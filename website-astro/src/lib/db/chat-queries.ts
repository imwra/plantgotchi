import { getDb } from './client';

// Types
export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image';
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  updated_at: string;
}

export interface ConversationWithPreview {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  last_sender_id: string | null;
  unread_count: number;
  member_count: number;
}

export interface MessageWithReactions extends Message {
  sender_name: string | null;
  sender_email: string | null;
  reactions: Reaction[];
}

// Conversation functions

export async function getUserConversations(userId: string): Promise<ConversationWithPreview[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT
            c.id, c.type,
            CASE WHEN c.type = 'dm' THEN (
              SELECT u.name FROM conversation_members ocm
              JOIN "user" u ON u.id = ocm.user_id
              WHERE ocm.conversation_id = c.id AND ocm.user_id != ?
              LIMIT 1
            ) ELSE c.name END AS name,
            c.created_by, c.created_at, c.updated_at,
            m.content AS last_message,
            m.created_at AS last_message_at,
            m.sender_id AS last_sender_id,
            (SELECT COUNT(*) FROM messages msg
             WHERE msg.conversation_id = c.id
             AND msg.created_at > cm.last_read_at) AS unread_count,
            (SELECT COUNT(*) FROM conversation_members cm2
             WHERE cm2.conversation_id = c.id) AS member_count
          FROM conversations c
          JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = ?
          LEFT JOIN messages m ON m.id = (
            SELECT m2.id FROM messages m2
            WHERE m2.conversation_id = c.id
            ORDER BY m2.created_at DESC LIMIT 1
          )
          ORDER BY COALESCE(m.created_at, c.updated_at) DESC`,
    args: [userId, userId],
  });
  return result.rows as unknown as ConversationWithPreview[];
}

export async function getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.* FROM conversations c
          JOIN conversation_members cm ON cm.conversation_id = c.id
          WHERE c.id = ? AND cm.user_id = ?`,
    args: [conversationId, userId],
  });
  return (result.rows[0] as unknown as Conversation) ?? null;
}

export async function getConversationMembers(conversationId: string): Promise<(ConversationMember & { name: string | null; email: string | null })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT cm.*, u.name, u.email
          FROM conversation_members cm
          JOIN user u ON u.id = cm.user_id
          WHERE cm.conversation_id = ?
          ORDER BY cm.joined_at`,
    args: [conversationId],
  });
  return result.rows as unknown as (ConversationMember & { name: string | null; email: string | null })[];
}

export async function findExistingDM(userId1: string, userId2: string): Promise<Conversation | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.* FROM conversations c
          WHERE c.type = 'dm'
          AND EXISTS (SELECT 1 FROM conversation_members cm1 WHERE cm1.conversation_id = c.id AND cm1.user_id = ?)
          AND EXISTS (SELECT 1 FROM conversation_members cm2 WHERE cm2.conversation_id = c.id AND cm2.user_id = ?)`,
    args: [userId1, userId2],
  });
  return (result.rows[0] as unknown as Conversation) ?? null;
}

export async function createConversation(
  id: string,
  type: 'dm' | 'group',
  createdBy: string,
  name: string | null,
  memberIds: string[]
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO conversations (id, type, name, created_by) VALUES (?, ?, ?, ?)`,
    args: [id, type, name, createdBy],
  });

  // Add creator as owner
  await db.execute({
    sql: `INSERT INTO conversation_members (id, conversation_id, user_id, role) VALUES (?, ?, ?, 'owner')`,
    args: [crypto.randomUUID(), id, createdBy],
  });

  // Add other members
  for (const memberId of memberIds) {
    if (memberId === createdBy) continue;
    await db.execute({
      sql: `INSERT INTO conversation_members (id, conversation_id, user_id, role) VALUES (?, ?, ?, 'member')`,
      args: [crypto.randomUUID(), id, memberId],
    });
  }
}

export async function addMembersToConversation(conversationId: string, userIds: string[]): Promise<void> {
  const db = getDb();
  for (const userId of userIds) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO conversation_members (id, conversation_id, user_id, role) VALUES (?, ?, ?, 'member')`,
      args: [crypto.randomUUID(), conversationId, userId],
    });
  }
}

export async function getMemberRole(conversationId: string, userId: string): Promise<string | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT role FROM conversation_members WHERE conversation_id = ? AND user_id = ?`,
    args: [conversationId, userId],
  });
  if (result.rows.length === 0) return null;
  return (result.rows[0] as unknown as { role: string }).role;
}

// Message functions

export async function getMessages(
  conversationId: string,
  after?: string,
  limit: number = 50
): Promise<MessageWithReactions[]> {
  const db = getDb();

  let sql = `SELECT m.*, u.name AS sender_name, u.email AS sender_email
             FROM messages m
             JOIN user u ON u.id = m.sender_id
             WHERE m.conversation_id = ?`;
  const args: (string | number)[] = [conversationId];

  if (after) {
    sql += ` AND m.created_at > ?`;
    args.push(after);
  }

  sql += ` ORDER BY m.created_at ASC LIMIT ?`;
  args.push(limit);

  const result = await db.execute({ sql, args });
  const messages = result.rows as unknown as (Message & { sender_name: string | null; sender_email: string | null })[];

  // Fetch reactions for these messages
  if (messages.length === 0) return [];

  const messageIds = messages.map((m) => m.id);
  const placeholders = messageIds.map(() => '?').join(',');
  const reactionsResult = await db.execute({
    sql: `SELECT * FROM reactions WHERE message_id IN (${placeholders}) ORDER BY created_at ASC`,
    args: messageIds,
  });
  const reactions = reactionsResult.rows as unknown as Reaction[];

  const reactionsByMessage = new Map<string, Reaction[]>();
  for (const r of reactions) {
    const arr = reactionsByMessage.get(r.message_id) || [];
    arr.push(r);
    reactionsByMessage.set(r.message_id, arr);
  }

  return messages.map((m) => ({
    ...m,
    reactions: reactionsByMessage.get(m.id) || [],
  }));
}

export async function createMessage(
  id: string,
  conversationId: string,
  senderId: string,
  type: 'text' | 'image',
  content: string
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO messages (id, conversation_id, sender_id, type, content) VALUES (?, ?, ?, ?, ?)`,
    args: [id, conversationId, senderId, type, content],
  });
  await db.execute({
    sql: `UPDATE conversations SET updated_at = datetime('now') WHERE id = ?`,
    args: [conversationId],
  });
}

export async function getLatestMessageTimestamp(conversationId: string): Promise<string | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT created_at FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1`,
    args: [conversationId],
  });
  if (result.rows.length === 0) return null;
  return (result.rows[0] as unknown as { created_at: string }).created_at;
}

// Reaction functions

export async function addReaction(id: string, messageId: string, userId: string, emoji: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO reactions (id, message_id, user_id, emoji) VALUES (?, ?, ?, ?)`,
    args: [id, messageId, userId, emoji],
  });
}

export async function removeReaction(reactionId: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `DELETE FROM reactions WHERE id = ? AND user_id = ?`,
    args: [reactionId, userId],
  });
}

export async function getReactionOwner(reactionId: string): Promise<string | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT user_id FROM reactions WHERE id = ?`,
    args: [reactionId],
  });
  if (result.rows.length === 0) return null;
  return (result.rows[0] as unknown as { user_id: string }).user_id;
}

// Typing / Read functions

export async function setTyping(conversationId: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO typing_indicators (conversation_id, user_id, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT (conversation_id, user_id) DO UPDATE SET updated_at = datetime('now')`,
    args: [conversationId, userId],
  });
}

export async function getActiveTypers(
  conversationId: string,
  excludeUserId: string
): Promise<(TypingIndicator & { name: string | null })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT ti.*, u.name
          FROM typing_indicators ti
          JOIN user u ON u.id = ti.user_id
          WHERE ti.conversation_id = ? AND ti.user_id != ?
          AND ti.updated_at > datetime('now', '-5 seconds')`,
    args: [conversationId, excludeUserId],
  });
  return result.rows as unknown as (TypingIndicator & { name: string | null })[];
}

export async function updateReadReceipt(conversationId: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE conversation_members SET last_read_at = datetime('now') WHERE conversation_id = ? AND user_id = ?`,
    args: [conversationId, userId],
  });
}

// User search

export async function searchUsers(query: string, excludeUserId: string, limit: number = 20): Promise<{ id: string; name: string | null; email: string }[]> {
  const db = getDb();
  const pattern = `%${query}%`;
  const result = await db.execute({
    sql: `SELECT id, name, email FROM user
          WHERE id != ? AND (name LIKE ? OR email LIKE ?)
          LIMIT ?`,
    args: [excludeUserId, pattern, pattern, limit],
  });
  return result.rows as unknown as { id: string; name: string | null; email: string }[];
}

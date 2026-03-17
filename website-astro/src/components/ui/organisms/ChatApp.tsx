import { useState, useEffect, useRef, useCallback } from 'react';
import ChatPanel from './ChatPanel';
import NewConversationModal, { type SearchUser } from './NewConversationModal';
import SiteNav from './SiteNav';
import type { Conversation } from './ConversationList';
import type { Message } from './ConversationView';
import { relativeTime } from '../../../lib/time-utils';
import { Analytics } from '../../../lib/analytics';

// ---------------------------------------------------------------------------
// ChatLabels
// ---------------------------------------------------------------------------

export interface ChatLabels {
  heading: string;
  newMessage: string;
  searchPlaceholder: string;
  noConversations: string;
  noConversationsDesc: string;
  inputPlaceholder: string;
  members: string;
  typing: string;
  typingMultiple: string;
  today: string;
  yesterday: string;
  you: string;
  dmTab: string;
  groupTab: string;
  groupName: string;
  searchUsers: string;
  create: string;
  cancel: string;
  addMembers: string;
  loadingMessages: string;
  sendImage: string;
  selectConversation: string;
  selectConversationDesc: string;
}

export const DEFAULT_CHAT_LABELS: ChatLabels = {
  heading: 'CHAT',
  newMessage: 'New Message',
  searchPlaceholder: 'Search...',
  noConversations: 'No conversations yet',
  noConversationsDesc: 'Start a conversation with another plant lover!',
  inputPlaceholder: 'Type a message...',
  members: 'members',
  typing: 'is typing...',
  typingMultiple: 'are typing...',
  today: 'Today',
  yesterday: 'Yesterday',
  you: 'You',
  dmTab: 'Direct Message',
  groupTab: 'Group',
  groupName: 'Group Name',
  searchUsers: 'Search users...',
  create: 'Create',
  cancel: 'Cancel',
  addMembers: 'Add Members',
  loadingMessages: 'Loading messages...',
  sendImage: 'Send Image',
  selectConversation: 'Select a conversation',
  selectConversationDesc: 'Choose a chat from the list to start messaging',
};

export interface ChatAppProps {
  userName: string;
  userId?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  chatLabels?: ChatLabels;
}

export default function ChatApp({ userName, userId, locale, navLabels, chatLabels }: ChatAppProps) {
  const labels = chatLabels ?? DEFAULT_CHAT_LABELS;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<string | undefined>();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ---- Fetch conversations ----
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(
        data.map((c: any) => ({
          id: c.id,
          name: c.name ?? 'Chat',
          lastMessage: c.last_message ?? '',
          lastMessageTime: c.last_message_at ? relativeTime(c.last_message_at) : '',
          lastMessageTimeRaw: c.last_message_at ?? '',
          unreadCount: c.unread_count ?? 0,
          isGroup: c.type === 'group',
          memberCount: c.member_count ?? 2,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + refresh every 10 seconds
  useEffect(() => {
    fetchConversations();
    const iv = setInterval(fetchConversations, 10_000);
    return () => clearInterval(iv);
  }, [fetchConversations]);

  // ---- Fetch initial messages when conversation changes ----
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setLastMessageTime(undefined);
      setTypingUsers([]);
      return;
    }

    let cancelled = false;

    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const msgs: Message[] = (data.messages ?? []).map((m: any) => ({
          id: m.id,
          content: m.content,
          type: m.type ?? 'text',
          isMine: userId ? m.sender_id === userId : false,
          timestamp: m.created_at ? relativeTime(m.created_at) : '',
          timestampRaw: m.created_at ?? '',
          senderName: m.sender_name ?? '',
          senderEmoji: m.sender_emoji ?? '',
          reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
        }));
        setMessages(msgs);
        if (msgs.length > 0) {
          setLastMessageTime(msgs[msgs.length - 1].timestampRaw);
        }
        setTypingUsers(data.typers ?? []);
        const conv = conversations.find((c) => c.id === activeConversationId);
        Analytics.track('chat_conversation_viewed', {
          conversation_id: activeConversationId,
          conversation_type: conv ? (conv.isGroup ? 'group' : 'dm') : undefined,
        });
      } catch {
        // ignore
      }
    };

    fetchInitial();

    // Mark as read
    fetch('/api/chat/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversationId }),
    })
      .then((r) => {
        if (r.ok) {
          Analytics.track('chat_conversation_read', { conversation_id: activeConversationId });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  // ---- Long-polling loop ----
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;

    // Small delay so initial fetch completes first
    const startTimeout = setTimeout(() => {
      const poll = async () => {
        while (!cancelled) {
          try {
            const params = new URLSearchParams({
              conversationId: activeConversationId,
              poll: 'true',
              ...(lastMessageTime ? { after: lastMessageTime } : {}),
            });
            const res = await fetch(`/api/chat/messages?${params}`);
            if (res.status === 503) {
              await new Promise((r) => setTimeout(r, 2000));
              continue;
            }
            if (!res.ok) break;
            const data = await res.json();
            if (!cancelled) {
              if (data.messages && data.messages.length > 0) {
                const newMsgs: Message[] = data.messages.map((m: any) => ({
                  id: m.id,
                  content: m.content,
                  type: m.type ?? 'text',
                  isMine: userId ? m.sender_id === userId : false,
                  timestamp: m.created_at ? relativeTime(m.created_at) : '',
                  timestampRaw: m.created_at ?? '',
                  senderName: m.sender_name ?? '',
                  senderEmoji: m.sender_emoji ?? '',
                  reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
                }));
                setMessages((prev) => [...prev, ...newMsgs]);
                setLastMessageTime(newMsgs[newMsgs.length - 1].timestampRaw);
              }
              setTypingUsers(data.typers ?? []);
            }
          } catch {
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
      };
      poll();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
    };
  }, [activeConversationId, lastMessageTime]);

  // ---- Send message ----
  const sendMessage = async (type: 'text' | 'image' = 'text', content: string) => {
    if (!activeConversationId) return;
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content,
          type,
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            content: msg.content,
            type: msg.type ?? 'text',
            isMine: true,
            timestamp: msg.created_at ? relativeTime(msg.created_at) : '',
            timestampRaw: msg.created_at ?? '',
            senderName: userName,
            senderEmoji: msg.sender_emoji ?? '',
            reactions: [],
          },
        ]);
        setLastMessageTime(msg.created_at);
        Analytics.track('chat_message_sent', { conversation_id: activeConversationId, message_type: 'text' });
        fetchConversations();
      }
    } catch {
      // ignore
    }
  };

  // ---- Typing indicator (debounced) ----
  const signalTyping = useCallback(() => {
    if (typingTimeout.current) return;
    if (!activeConversationId) return;
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversationId }),
    }).catch(() => {});
    Analytics.track('chat_typing_started', { conversation_id: activeConversationId });
    typingTimeout.current = setTimeout(() => {
      typingTimeout.current = undefined;
    }, 3000);
  }, [activeConversationId]);

  // ---- Image upload ----
  const handleImageUpload = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const { url } = await res.json();
          await sendMessage('image', url);
          Analytics.track('chat_file_uploaded', { conversation_id: activeConversationId, file_type: file.type });
        }
      } catch {
        // ignore
      }
    };
    input.click();
  }, [activeConversationId, userName]);

  // ---- Create conversation ----
  const handleCreateDM = async (userId: string) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dm', userId }),
      });
      if (res.ok) {
        const conv = await res.json();
        Analytics.track('chat_conversation_created', { conversation_id: conv.id, conversation_type: conv.type });
        setShowNewConversation(false);
        setSearchResults([]);
        await fetchConversations();
        setActiveConversationId(conv.id);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'group', name, memberIds }),
      });
      if (res.ok) {
        const conv = await res.json();
        Analytics.track('chat_conversation_created', { conversation_id: conv.id, conversation_type: conv.type });
        setShowNewConversation(false);
        setSearchResults([]);
        await fetchConversations();
        setActiveConversationId(conv.id);
      }
    } catch {
      // ignore
    }
  };

  // ---- Search users ----
  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/chat/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const users = await res.json();
        setSearchResults(
          users.map((u: any) => ({
            id: u.id,
            name: u.name ?? u.email,
            emoji: u.emoji ?? '',
          })),
        );
      }
    } catch {
      // ignore
    }
  };

  // ---- Reactions ----
  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (res.ok) {
        Analytics.track('chat_reaction_added', { conversation_id: activeConversationId, emoji });
        if (activeConversationId) {
          const msgsRes = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
          if (msgsRes.ok) {
            const data = await msgsRes.json();
            const msgs = (data.messages ?? []).map((m: any) => ({
              id: m.id,
              content: m.content,
              type: m.type ?? 'text',
              isMine: userId ? m.sender_id === userId : false,
              timestamp: m.created_at ? relativeTime(m.created_at) : '',
              timestampRaw: m.created_at ?? '',
              senderName: m.sender_name ?? '',
              senderEmoji: m.sender_emoji ?? '',
              reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
            }));
            setMessages(msgs);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  const handleRemoveReaction = async (reactionId: string) => {
    try {
      const res = await fetch('/api/chat/reactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionId }),
      });
      if (res.ok) {
        if (activeConversationId) {
          const msgsRes = await fetch(`/api/chat/messages?conversationId=${activeConversationId}`);
          if (msgsRes.ok) {
            const data = await msgsRes.json();
            const msgs = (data.messages ?? []).map((m: any) => ({
              id: m.id,
              content: m.content,
              type: m.type ?? 'text',
              isMine: userId ? m.sender_id === userId : false,
              timestamp: m.created_at ? relativeTime(m.created_at) : '',
              timestampRaw: m.created_at ?? '',
              senderName: m.sender_name ?? '',
              senderEmoji: m.sender_emoji ?? '',
              reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
            }));
            setMessages(msgs);
          }
        }
      }
    } catch {
      // ignore
    }
  };

  // ---- Handle send from ChatPanel ----
  const handleSend = (message: string) => {
    signalTyping();
    sendMessage('text', message);
  };

  // ---- Handle select conversation ----
  const handleSelectConversation = (id: string) => {
    if (id === '') {
      setActiveConversationId(undefined);
    } else {
      setActiveConversationId(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg via-bg-warm to-bg font-pixel text-text">
      <SiteNav
        userName={userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/chat'}
      />

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-3xl mb-4 animate-pulse">💬</div>
          <p className="font-pixel text-pixel-sm text-text-light">{labels.loadingMessages}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-8 text-danger">
          <p className="font-pixel text-pixel-sm">{error}</p>
        </div>
      )}

      {/* Chat panel — edge to edge */}
      {!loading && !error && (
        <div className="h-[calc(100vh-56px)]">
          <ChatPanel
            conversations={conversations}
            messages={messages}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onSend={handleSend}
            onNewConversation={() => setShowNewConversation(true)}
            onImageClick={handleImageUpload}
            onReact={handleReact}
            onRemoveReaction={handleRemoveReaction}
            typingUsers={typingUsers}
            labels={labels}
          />
        </div>
      )}

      {/* New conversation modal */}
      {showNewConversation && (
        <NewConversationModal
          onClose={() => {
            setShowNewConversation(false);
            setSearchResults([]);
          }}
          onCreateDM={handleCreateDM}
          onCreateGroup={handleCreateGroup}
          searchResults={searchResults}
          onSearch={handleSearchUsers}
          labels={{
            newMessage: labels.newMessage,
            dmTab: labels.dmTab,
            groupTab: labels.groupTab,
            groupName: labels.groupName,
            searchUsers: labels.searchUsers,
            create: labels.create,
            cancel: labels.cancel,
            addMembers: labels.addMembers,
          }}
        />
      )}
    </div>
  );
}

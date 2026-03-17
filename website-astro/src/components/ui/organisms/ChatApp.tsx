import { useState, useEffect, useRef, useCallback } from 'react';
import ChatPanel from './ChatPanel';
import NewConversationModal, { type SearchUser } from './NewConversationModal';
import SiteNav from './SiteNav';
import type { Conversation } from './ConversationList';
import type { Message } from './ConversationView';

export interface ChatAppProps {
  userName: string;
  locale?: string;
  navLabels?: Record<string, string>;
}

export default function ChatApp({ userName, locale, navLabels }: ChatAppProps) {
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
          name: c.name,
          lastMessage: c.last_message ?? '',
          lastMessageTime: c.last_message_at ?? '',
          unreadCount: c.unread_count ?? 0,
          isGroup: c.is_group ?? false,
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
          isMine: m.is_mine ?? false,
          timestamp: m.created_at,
          senderName: m.sender_name ?? '',
          senderEmoji: m.sender_emoji ?? '',
          reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
        }));
        setMessages(msgs);
        if (msgs.length > 0) {
          setLastMessageTime(msgs[msgs.length - 1].timestamp);
        }
        setTypingUsers(data.typers ?? []);
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
    }).catch(() => {});

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
                  isMine: m.is_mine ?? false,
                  timestamp: m.created_at,
                  senderName: m.sender_name ?? '',
                  senderEmoji: m.sender_emoji ?? '',
                  reactions: (m.reactions ?? []).map((r: any) => ({ emoji: r.emoji, count: r.count, reacted: r.reacted })),
                }));
                setMessages((prev) => [...prev, ...newMsgs]);
                setLastMessageTime(newMsgs[newMsgs.length - 1].timestamp);
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
            timestamp: msg.created_at,
            senderName: userName,
            senderEmoji: msg.sender_emoji ?? '',
            reactions: [],
          },
        ]);
        setLastMessageTime(msg.created_at);
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
        body: JSON.stringify({ type: 'dm', memberIds: [userId] }),
      });
      if (res.ok) {
        const conv = await res.json();
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

      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3.5 pb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-3.5 pb-3 border-b-2 border-border-light">
          <div className="font-pixel text-[13px] sm:text-[15px] text-primary-dark tracking-wide">
            CHAT
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-3xl mb-4 animate-pulse">💬</div>
            <p className="font-pixel text-pixel-sm text-text-light">Loading...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-8 text-danger">
            <p className="font-pixel text-pixel-sm">{error}</p>
          </div>
        )}

        {/* Chat panel */}
        {!loading && !error && (
          <div className="h-[calc(100vh-180px)] min-h-[400px]">
            <ChatPanel
              conversations={conversations}
              messages={messages}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onSend={handleSend}
              onNewConversation={() => setShowNewConversation(true)}
              typingUsers={typingUsers}
            />
          </div>
        )}
      </div>

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
        />
      )}
    </div>
  );
}

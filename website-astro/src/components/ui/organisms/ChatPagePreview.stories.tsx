import type { Meta, StoryObj } from '@storybook/react';
import SiteNav from './SiteNav';
import ChatPanel from './ChatPanel';

const DEMO_CONVERSATIONS = [
  { id: '1', name: 'Maria Silva', lastMessage: 'Sua jiboia está linda!', lastMessageTime: '2m', unreadCount: 3, isGroup: false, memberCount: 2 },
  { id: '2', name: 'Grupo: Suculentas SP', lastMessage: 'Alguém tem mudas de echeveria?', lastMessageTime: '1h', unreadCount: 0, isGroup: true, memberCount: 8 },
  { id: '3', name: 'João Santos', lastMessage: 'Valeu pela dica!', lastMessageTime: '3h', unreadCount: 1, isGroup: false, memberCount: 2 },
  { id: '4', name: 'Grupo: Iniciantes', lastMessage: 'Como regar cactos?', lastMessageTime: '1d', unreadCount: 0, isGroup: true, memberCount: 15 },
];

const DEMO_MESSAGES = [
  { id: 'm1', content: 'Oi! Vi sua jiboia no perfil, que linda!', type: 'text' as const, isMine: false, timestamp: '14:30', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [{ emoji: '❤️', count: 1, reacted: true }] },
  { id: 'm2', content: 'Obrigado! Ela está com 3 anos já', type: 'text' as const, isMine: true, timestamp: '14:32', senderName: 'Você', senderEmoji: '🌱', reactions: [] },
  { id: 'm3', content: 'Nossa, tá enorme! Qual o segredo?', type: 'text' as const, isMine: false, timestamp: '14:33', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [] },
  { id: 'm4', content: 'Rego toda segunda e quinta, e deixo perto da janela. Também uso adubo líquido uma vez por mês, funciona muito bem!', type: 'text' as const, isMine: true, timestamp: '14:35', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '👍', count: 1, reacted: false }] },
  { id: 'm5', content: 'Vou tentar isso! Obrigada pela dica 🌱', type: 'text' as const, isMine: false, timestamp: '14:36', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [] },
  { id: 'm6', content: 'De nada! Se precisar de mais alguma coisa, me fala', type: 'text' as const, isMine: true, timestamp: '14:38', senderName: 'Você', senderEmoji: '🌱', reactions: [{ emoji: '❤️', count: 1, reacted: false }] },
  { id: 'm7', content: 'Ah, e uma pergunta: você usa vaso de barro ou plástico?', type: 'text' as const, isMine: false, timestamp: '14:40', senderName: 'Maria Silva', senderEmoji: '🌿', reactions: [] },
  { id: 'm8', content: 'Barro! Ajuda muito na drenagem', type: 'text' as const, isMine: true, timestamp: '14:41', senderName: 'Você', senderEmoji: '🌱', reactions: [] },
];

const NAV_LABELS = {
  home: 'Inicio',
  garden: 'Jardim',
  help: 'Ajuda',
  admin: 'Admin',
  chat: 'Chat',
  login: 'Entrar',
  logout: 'Sair',
  toggleMenu: 'Abrir menu',
  langPtbr: 'Portugues (BR)',
  langEn: 'English',
  langCurrentPtbr: 'PT',
  langCurrentEn: 'EN',
};

function ChatPageContained() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0ead6' }}>
      <SiteNav userName="Will" locale="pt-br" labels={NAV_LABELS} currentPath="/chat" />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 16px 24px' }}>
        <div style={{ height: 'calc(100vh - 80px)' }}>
          <ChatPanel
            conversations={DEMO_CONVERSATIONS}
            messages={DEMO_MESSAGES}
            activeConversationId="1"
            typingUsers={['Maria Silva']}
          />
        </div>
      </div>
    </div>
  );
}

function ChatPageEdgeToEdge() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0ead6' }}>
      <SiteNav userName="Will" locale="pt-br" labels={NAV_LABELS} currentPath="/chat" />
      <div style={{ height: 'calc(100vh - 56px)' }}>
        <ChatPanel
          conversations={DEMO_CONVERSATIONS}
          messages={DEMO_MESSAGES}
          activeConversationId="1"
          typingUsers={['Maria Silva']}
        />
      </div>
    </div>
  );
}

function ChatPageEdgeToEdgeNoChat() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0ead6' }}>
      <SiteNav userName="Will" locale="pt-br" labels={NAV_LABELS} currentPath="/chat" />
      <div style={{ height: 'calc(100vh - 56px)' }}>
        <ChatPanel
          conversations={DEMO_CONVERSATIONS}
          messages={[]}
        />
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Organisms/ChatPagePreview',
  decorators: [
    (Story) => (
      <div style={{ position: 'fixed', inset: 0, overflow: 'auto' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj;

export const Contained: Story = {
  name: 'Current: Contained (max-width 960px)',
  render: () => <ChatPageContained />,
};

export const EdgeToEdge: Story = {
  name: 'Option: Edge-to-Edge (full width)',
  render: () => <ChatPageEdgeToEdge />,
};

export const EdgeToEdgeNoActive: Story = {
  name: 'Option: Edge-to-Edge (no chat selected)',
  render: () => <ChatPageEdgeToEdgeNoChat />,
};

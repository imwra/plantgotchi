import type { Meta, StoryObj } from '@storybook/react';

const pixelFontSizes = [
  { tw: 'font-pixel text-[6px]', size: '6px', usage: 'Micro labels (chart labels, tiny timestamps)' },
  { tw: 'font-pixel text-pixel-xs', size: '7px', usage: 'Bar labels, status badges, tag labels' },
  { tw: 'font-pixel text-pixel-sm', size: '9px', usage: 'Card titles, section headers, button text' },
  { tw: 'font-pixel text-[11px]', size: '11px', usage: 'Modal titles, medium headings' },
  { tw: 'font-pixel text-[13px]', size: '13px', usage: 'Page section titles' },
  { tw: 'font-pixel text-[15px]', size: '15px', usage: 'Page main title' },
];

const regularFontSizes = [
  { tw: 'text-xs', size: '12px', usage: 'Secondary text, descriptions, timestamps' },
  { tw: 'text-sm', size: '14px', usage: 'Body text, input text, messages' },
  { tw: 'text-base', size: '16px', usage: 'Large body text (rarely used)' },
];

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
  paddingBottom: 8,
  borderBottom: '2px solid #3d3425',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 16,
  backgroundColor: '#fffdf5',
  border: '1px solid #e0d5b8',
  borderRadius: 6,
};

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  marginBottom: 4,
};

const classLabelStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#7a6e5a',
  backgroundColor: '#f0ead6',
  padding: '2px 6px',
  borderRadius: 3,
};

const usageLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#7a6e5a',
  fontStyle: 'italic',
};

function TypographyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24, backgroundColor: '#fffdf5', minHeight: '100vh' }}>
      <h1 className="font-pixel" style={{ fontSize: 15, color: '#3d3425', margin: 0 }}>
        Typography Tokens
      </h1>

      {/* Pixel Font Section */}
      <div>
        <div style={sectionStyle}>
          <h2 className="font-pixel" style={{ fontSize: 11, color: '#3d3425', margin: 0 }}>
            PIXEL FONT (Press Start 2P)
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {pixelFontSizes.map((fs) => (
            <div key={fs.tw} style={cardStyle}>
              <div style={labelRowStyle}>
                <span style={classLabelStyle}>{fs.tw}</span>
                <span style={{ ...classLabelStyle, backgroundColor: '#e8e0cc' }}>{fs.size}</span>
                <span style={usageLabelStyle}>{fs.usage}</span>
              </div>
              <p className={fs.tw} style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
                PLANTGOTCHI ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
              </p>
              <p className={fs.tw} style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
                Your plant needs water! Sua planta precisa de agua!
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Regular Font Section */}
      <div>
        <div style={sectionStyle}>
          <h2 className="font-pixel" style={{ fontSize: 11, color: '#3d3425', margin: 0 }}>
            REGULAR FONT
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {regularFontSizes.map((fs) => (
            <div key={fs.tw} style={cardStyle}>
              <div style={labelRowStyle}>
                <span style={classLabelStyle}>{fs.tw}</span>
                <span style={{ ...classLabelStyle, backgroundColor: '#e8e0cc' }}>{fs.size}</span>
                <span style={usageLabelStyle}>{fs.usage}</span>
              </div>
              <p className={fs.tw} style={{ color: '#3d3425', margin: 0, lineHeight: 1.6 }}>
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
              <p className={fs.tw} style={{ color: '#3d3425', margin: 0, lineHeight: 1.6 }}>
                Sua planta esta crescendo! Regue todos os dias para mante-la saudavel.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Combined Examples */}
      <div>
        <div style={sectionStyle}>
          <h2 className="font-pixel" style={{ fontSize: 11, color: '#3d3425', margin: 0 }}>
            COMBINED EXAMPLES
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card title + description */}
          <div style={cardStyle}>
            <span style={usageLabelStyle}>Card: pixel title + regular description</span>
            <p className="font-pixel text-pixel-sm" style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
              MINHA PLANTA / MY PLANT
            </p>
            <p className="text-sm" style={{ color: '#7a6e5a', margin: 0, lineHeight: 1.6 }}>
              Your plant is thriving! Keep up the good work. / Sua planta esta prosperando!
            </p>
          </div>

          {/* Page header */}
          <div style={cardStyle}>
            <span style={usageLabelStyle}>Page header: large pixel title + section title</span>
            <p className="font-pixel text-[15px]" style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
              PLANTGOTCHI
            </p>
            <p className="font-pixel text-[13px]" style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
              LEADERBOARD
            </p>
            <p className="text-sm" style={{ color: '#7a6e5a', margin: 0, lineHeight: 1.6 }}>
              See how your plant compares to others. / Veja como sua planta se compara.
            </p>
          </div>

          {/* Modal example */}
          <div style={cardStyle}>
            <span style={usageLabelStyle}>Modal: 11px title + 9px buttons + regular body</span>
            <p className="font-pixel text-[11px]" style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
              NEW CONVERSATION / NOVA CONVERSA
            </p>
            <p className="text-sm" style={{ color: '#3d3425', margin: 0, lineHeight: 1.6 }}>
              Search users... / Buscar usuarios...
            </p>
            <p className="font-pixel text-pixel-sm" style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}>
              CREATE / CRIAR
            </p>
          </div>

          {/* Empty state */}
          <div style={cardStyle}>
            <span style={usageLabelStyle}>Empty state: pixel title + regular description</span>
            <p className="font-pixel text-pixel-sm" style={{ color: '#7a6e5a', margin: 0, lineHeight: 1.8 }}>
              No conversations yet / Nenhuma conversa ainda
            </p>
            <p className="text-sm" style={{ color: '#7a6e5a', margin: 0, lineHeight: 1.6 }}>
              Start a chat with fellow plant lovers! / Comece um chat com outros amantes de plantas!
            </p>
          </div>

          {/* Micro labels */}
          <div style={cardStyle}>
            <span style={usageLabelStyle}>Micro: chart labels + badge + timestamp</span>
            <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
              <span className="font-pixel text-[6px]" style={{ color: '#7a6e5a' }}>MON TUE WED THU FRI</span>
              <span className="font-pixel text-pixel-xs" style={{ color: '#3d3425', backgroundColor: '#e8f5e9', padding: '2px 6px', borderRadius: 4 }}>LEVEL 5</span>
              <span className="text-xs" style={{ color: '#7a6e5a' }}>2 hours ago / 2 horas atras</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Typography',
  component: TypographyPage,
};

export default meta;

type Story = StoryObj;

export const AllSizes: Story = {};

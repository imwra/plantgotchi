import type { Meta, StoryObj } from '@storybook/react';

const fontSizes = [
  { name: 'pixel-xs', size: '6px', tw: 'text-pixel-xs' },
  { name: 'pixel-sm', size: '7px', tw: 'text-pixel-sm' },
  { name: 'pixel-base', size: '8px', tw: 'text-pixel-base' },
  { name: 'pixel-md', size: '9px', tw: 'text-pixel-md' },
  { name: 'pixel-lg', size: '12px', tw: 'text-pixel-lg' },
  { name: 'pixel-xl', size: '15px', tw: 'text-pixel-xl' },
];

const sampleText = 'PLANTGOTCHI ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789';

function TypographyPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h1 className="font-pixel" style={{ fontSize: 15, color: '#3d3425' }}>
        Typography Tokens
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {fontSizes.map((fs) => (
          <div
            key={fs.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 16,
              backgroundColor: '#fffdf5',
              border: '1px solid #e0d5b8',
              borderRadius: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span
                className="font-pixel"
                style={{ fontSize: 8, color: '#3d3425', minWidth: 100 }}
              >
                {fs.name}
              </span>
              <span
                className="font-pixel"
                style={{ fontSize: 7, color: '#7a6e5a' }}
              >
                ({fs.size})
              </span>
            </div>
            <p
              className={`font-pixel ${fs.tw}`}
              style={{ color: '#3d3425', margin: 0, lineHeight: 1.8 }}
            >
              {sampleText}
            </p>
          </div>
        ))}
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

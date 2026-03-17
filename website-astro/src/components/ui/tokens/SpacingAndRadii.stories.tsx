import type { Meta, StoryObj } from '@storybook/react';

const radii = [
  { name: 'rounded-sm', value: '3px', tw: 'rounded-sm' },
  { name: 'rounded-md', value: '6px', tw: 'rounded-md' },
  { name: 'rounded-lg', value: '8px', tw: 'rounded-lg' },
  { name: 'rounded-xl', value: '10px', tw: 'rounded-xl' },
  { name: 'rounded-2xl', value: '12px', tw: 'rounded-2xl' },
];

function SpacingAndRadiiPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h1 className="font-pixel" style={{ fontSize: 15, color: '#3d3425' }}>
        Spacing &amp; Radii Tokens
      </h1>

      <div>
        <h2
          className="font-pixel"
          style={{ fontSize: 9, color: '#3d3425', marginBottom: 16 }}
        >
          Border Radii
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {radii.map((r) => (
            <div
              key={r.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                className={`bg-primary ${r.tw}`}
                style={{
                  width: 80,
                  height: 60,
                  border: '1px solid #357a2c',
                }}
              />
              <span
                className="font-pixel"
                style={{ fontSize: 6, color: '#3d3425' }}
              >
                {r.name}
              </span>
              <span
                className="font-pixel"
                style={{ fontSize: 6, color: '#7a6e5a' }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Spacing & Radii',
  component: SpacingAndRadiiPage,
};

export default meta;

type Story = StoryObj;

export const AllRadii: Story = {};

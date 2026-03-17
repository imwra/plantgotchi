import type { Meta, StoryObj } from '@storybook/react';

const colorGroups = [
  {
    label: 'Backgrounds',
    tokens: [
      { name: 'bg', value: '#f0ead6', tw: 'bg-bg' },
      { name: 'bg-warm', value: '#faf5e8', tw: 'bg-bg-warm' },
      { name: 'bg-card', value: '#fffdf5', tw: 'bg-bg-card' },
      { name: 'bg-card-hover', value: '#fff8e0', tw: 'bg-bg-card-hover' },
    ],
  },
  {
    label: 'Borders',
    tokens: [
      { name: 'border', value: '#c8b88a', tw: 'bg-border' },
      { name: 'border-light', value: '#e0d5b8', tw: 'bg-border-light' },
      { name: 'border-accent', value: '#8bba6a', tw: 'bg-border-accent' },
    ],
  },
  {
    label: 'Primary',
    tokens: [
      { name: 'primary', value: '#4a9e3f', tw: 'bg-primary' },
      { name: 'primary-dark', value: '#357a2c', tw: 'bg-primary-dark' },
      { name: 'primary-light', value: '#a8d89a', tw: 'bg-primary-light' },
      { name: 'primary-pale', value: '#e4f5de', tw: 'bg-primary-pale' },
    ],
  },
  {
    label: 'Secondary',
    tokens: [
      { name: 'secondary', value: '#5bb5a6', tw: 'bg-secondary' },
      { name: 'secondary-pale', value: '#ddf3ef', tw: 'bg-secondary-pale' },
    ],
  },
  {
    label: 'Water',
    tokens: [
      { name: 'water', value: '#5ba3d9', tw: 'bg-water' },
      { name: 'water-pale', value: '#ddeefb', tw: 'bg-water-pale' },
      { name: 'water-dark', value: '#3a7cb8', tw: 'bg-water-dark' },
    ],
  },
  {
    label: 'Sun',
    tokens: [
      { name: 'sun', value: '#e8b835', tw: 'bg-sun' },
      { name: 'sun-pale', value: '#fef5d4', tw: 'bg-sun-pale' },
    ],
  },
  {
    label: 'Danger',
    tokens: [
      { name: 'danger', value: '#d95b5b', tw: 'bg-danger' },
      { name: 'danger-pale', value: '#fce0e0', tw: 'bg-danger-pale' },
    ],
  },
  {
    label: 'Orange',
    tokens: [{ name: 'orange', value: '#e8883b', tw: 'bg-orange' }],
  },
  {
    label: 'Purple',
    tokens: [{ name: 'purple', value: '#9b6bb5', tw: 'bg-purple' }],
  },
  {
    label: 'Brown',
    tokens: [
      { name: 'brown', value: '#9c7a4f', tw: 'bg-brown' },
      { name: 'brown-light', value: '#c4a97a', tw: 'bg-brown-light' },
      { name: 'brown-pale', value: '#f0e6d2', tw: 'bg-brown-pale' },
    ],
  },
  {
    label: 'Text',
    tokens: [
      { name: 'text', value: '#3d3425', tw: 'bg-text' },
      { name: 'text-mid', value: '#7a6e5a', tw: 'bg-text-mid' },
      { name: 'text-light', value: '#a89e8a', tw: 'bg-text-light' },
      { name: 'white', value: '#fffdf5', tw: 'bg-white' },
    ],
  },
  {
    label: 'Shadows',
    tokens: [
      { name: 'shadow', value: 'rgba(60,50,30,0.08)', tw: '' },
      { name: 'shadow-md', value: 'rgba(60,50,30,0.12)', tw: '' },
    ],
  },
];

function Swatch({ name, value, tw }: { name: string; value: string; tw: string }) {
  const isShadow = name.startsWith('shadow');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        className={tw || undefined}
        style={{
          width: 80,
          height: 52,
          borderRadius: 6,
          border: '1px solid #c8b88a',
          ...(isShadow
            ? { backgroundColor: '#fffdf5', boxShadow: `0 4px 12px ${value}` }
            : !tw
              ? { backgroundColor: value }
              : {}),
        }}
      />
      <span
        className="font-pixel"
        style={{ fontSize: 6, color: '#3d3425', textAlign: 'center', maxWidth: 88 }}
      >
        {name}
      </span>
      <span
        className="font-pixel"
        style={{ fontSize: 6, color: '#7a6e5a', textAlign: 'center', maxWidth: 88 }}
      >
        {value}
      </span>
    </div>
  );
}

function ColorsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h1 className="font-pixel" style={{ fontSize: 15, color: '#3d3425' }}>
        Color Tokens
      </h1>
      {colorGroups.map((group) => (
        <div key={group.label}>
          <h2
            className="font-pixel"
            style={{ fontSize: 9, color: '#3d3425', marginBottom: 12 }}
          >
            {group.label}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {group.tokens.map((token) => (
              <Swatch key={token.name} {...token} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Colors',
  component: ColorsPage,
};

export default meta;

type Story = StoryObj;

export const AllColors: Story = {};

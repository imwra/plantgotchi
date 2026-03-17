import { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

function AnimationDemo({
  name,
  animationClass,
  children,
}: {
  name: string;
  animationClass: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: '#fffdf5',
        border: '1px solid #e0d5b8',
        borderRadius: 6,
        minWidth: 120,
      }}
    >
      <div className={animationClass} style={{ fontSize: 32, lineHeight: 1 }}>
        {children}
      </div>
      <span className="font-pixel" style={{ fontSize: 6, color: '#3d3425' }}>
        {name}
      </span>
      <span className="font-pixel" style={{ fontSize: 6, color: '#7a6e5a' }}>
        animate-{name}
      </span>
    </div>
  );
}

function FadeInDemo() {
  const [key, setKey] = useState(0);
  const replay = useCallback(() => setKey((k) => k + 1), []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: '#fffdf5',
        border: '1px solid #e0d5b8',
        borderRadius: 6,
        minWidth: 120,
      }}
    >
      <div key={key} className="animate-fade-in" style={{ fontSize: 32, lineHeight: 1 }}>
        <div
          className="bg-primary"
          style={{ width: 40, height: 40, borderRadius: 6 }}
        />
      </div>
      <span className="font-pixel" style={{ fontSize: 6, color: '#3d3425' }}>
        fade-in
      </span>
      <button
        onClick={replay}
        className="font-pixel bg-primary-pale"
        style={{
          fontSize: 6,
          color: '#3d3425',
          border: '1px solid #c8b88a',
          borderRadius: 3,
          padding: '4px 8px',
          cursor: 'pointer',
        }}
      >
        Replay
      </button>
    </div>
  );
}

function AnimationsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
      <h1 className="font-pixel" style={{ fontSize: 15, color: '#3d3425' }}>
        Animation Tokens
      </h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <AnimationDemo name="bounce-plant" animationClass="animate-bounce-plant">
          🌿
        </AnimationDemo>

        <AnimationDemo name="wilt" animationClass="animate-wilt">
          🌿
        </AnimationDemo>

        <AnimationDemo name="pulse-slow" animationClass="animate-pulse-slow">
          <span
            className="bg-primary font-pixel"
            style={{
              display: 'inline-block',
              fontSize: 6,
              color: '#fffdf5',
              padding: '4px 8px',
              borderRadius: 6,
            }}
          >
            BADGE
          </span>
        </AnimationDemo>

        <AnimationDemo name="live-pulse" animationClass="animate-live-pulse">
          <div
            className="bg-primary"
            style={{ width: 16, height: 16, borderRadius: '50%' }}
          />
        </AnimationDemo>

        <FadeInDemo />

        <AnimationDemo name="sway" animationClass="animate-sway">
          🌱
        </AnimationDemo>

        <AnimationDemo name="pulse-glow" animationClass="animate-pulse-glow">
          <div
            className="bg-primary"
            style={{ width: 40, height: 40, borderRadius: 6 }}
          />
        </AnimationDemo>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Tokens/Animations',
  component: AnimationsPage,
};

export default meta;

type Story = StoryObj;

export const AllAnimations: Story = {};

import type { Meta, StoryObj } from '@storybook/react';
import ViewTabs from './ViewTabs';

const meta: Meta<typeof ViewTabs> = {
  title: 'Molecules/ViewTabs',
  component: ViewTabs,
  decorators: [(Story) => <div style={{ maxWidth: 600, padding: 16, background: '#fff' }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof ViewTabs>;

const sampleViews = [
  { id: 'v1', name: 'Default', view_type: 'table', is_default: 1 },
  { id: 'v2', name: 'By Phase', view_type: 'table', is_default: 0 },
  { id: 'v3', name: 'Critical Only', view_type: 'board', is_default: 0 },
];

export const Default: Story = {
  args: {
    views: sampleViews,
    activeViewId: 'v1',
    onSelect: (id) => console.log('Select:', id),
    onCreate: (name) => console.log('Create:', name),
    onDelete: (id) => console.log('Delete:', id),
    onRename: (id, name) => console.log('Rename:', id, name),
  },
};

export const SingleTab: Story = {
  args: {
    views: [sampleViews[0]],
    activeViewId: 'v1',
    onSelect: (id) => console.log('Select:', id),
    onCreate: (name) => console.log('Create:', name),
    onDelete: (id) => console.log('Delete:', id),
    onRename: (id, name) => console.log('Rename:', id, name),
  },
};

export const ManyTabs: Story = {
  args: {
    views: [
      ...sampleViews,
      { id: 'v4', name: 'High Priority', view_type: 'table', is_default: 0 },
      { id: 'v5', name: 'My Issues', view_type: 'table', is_default: 0 },
      { id: 'v6', name: 'Blocked Items', view_type: 'board', is_default: 0 },
      { id: 'v7', name: 'Firmware Tasks', view_type: 'table', is_default: 0 },
      { id: 'v8', name: 'PCB Tracking', view_type: 'board', is_default: 0 },
    ],
    activeViewId: 'v3',
    onSelect: (id) => console.log('Select:', id),
    onCreate: (name) => console.log('Create:', name),
    onDelete: (id) => console.log('Delete:', id),
    onRename: (id, name) => console.log('Rename:', id, name),
  },
};

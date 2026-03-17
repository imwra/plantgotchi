import type { Meta, StoryObj } from '@storybook/react';
import BoardView from './BoardView';

const sampleIssues = [
  { id: '1', title: 'Design PCB layout for soil moisture sensor', status: 'todo', assignee_ids: 'Will', fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'PCB Design' }] },
  { id: '2', title: 'Implement BLE pairing flow', status: 'in_progress', assignee_ids: 'Will', fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'Firmware' }] },
  { id: '3', title: 'Test soil sensor readings', status: 'in_progress', assignee_ids: 'Ana', fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'Firmware' }] },
  { id: '4', title: 'Order PCB prototype', status: 'done', assignee_ids: null, fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'PCB Design' }] },
  { id: '5', title: 'Set up dev environment', status: 'done', assignee_ids: 'Will', fieldValues: [] },
  { id: '6', title: 'Design 3D case for outdoor sensor', status: 'todo', assignee_ids: 'Ana', fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: '3D Case' }] },
  { id: '7', title: 'Fix BLE reconnection bug', status: 'blocked', assignee_ids: 'Will', fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'Firmware' }] },
  { id: '8', title: 'Write firmware OTA update logic', status: 'todo', assignee_ids: null, fieldValues: [{ field_id: 'f1', field_name: 'Phase', value: 'Firmware' }] },
];

const sampleFields = [
  { id: 'f1', name: 'Phase', field_type: 'single_select', options: '["PCB Design","Firmware","3D Case","Setup"]', position: 0 },
];

const meta: Meta<typeof BoardView> = {
  title: 'Organisms/BoardView',
  component: BoardView,
  decorators: [(Story) => <div style={{ padding: 16, background: '#f9f6f0' }}><Story /></div>],
};
export default meta;

type Story = StoryObj<typeof BoardView>;

export const Default: Story = {
  args: {
    projectId: 'proj1',
    issues: sampleIssues,
    fields: sampleFields,
    boardField: 'status',
  },
};

export const CustomField: Story = {
  args: {
    projectId: 'proj1',
    issues: sampleIssues,
    fields: sampleFields,
    boardField: 'f1',
  },
};

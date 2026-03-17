import type { Meta, StoryObj } from '@storybook/react';
import ProjectView from './ProjectView';

const meta: Meta<typeof ProjectView> = {
  title: 'Organisms/ProjectView',
  component: ProjectView,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof ProjectView>;

export const TableView: Story = {
  args: {
    projectId: 'demo-project',
    userName: 'Will',
    locale: 'en',
    labels: {
      viewTable: 'Table',
      viewBoard: 'Board',
      addIssue: 'Add Issue',
      settings: 'Settings',
      members: 'members',
      groupBy: 'Group by',
      groupByNone: 'None',
      columns: 'Columns',
      search: 'Search issues...',
      boardBy: 'Board by',
      emptyColumn: 'No issues',
      newView: 'New View',
      rename: 'Rename',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
    },
  },
};

export const BoardViewStory: Story = {
  name: 'Board View',
  args: {
    ...TableView.args,
  },
};

export const WithSavedViews: Story = {
  name: 'With Saved Views',
  args: {
    ...TableView.args,
  },
};

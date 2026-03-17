# Projects & Issues (Sub-project 2: Board View & Polish) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Board/Kanban view with drag-and-drop, inline table editing, and saved view preferences to the existing Projects & Issues system built in sub-project 1.

**Architecture:** New `project_views` table stores per-user saved view configurations. Board view is a React organism using `@dnd-kit` for drag-and-drop, rendering issues as cards in columns grouped by any single-select field. Inline editing adds click-to-edit cells in the existing `IssueTable` organism. All state changes use optimistic UI updates with background API calls.

**Tech Stack:** @dnd-kit/core + @dnd-kit/sortable (drag-and-drop), Turso/libsql (database), Astro API routes, React 19, Tailwind CSS v4, Storybook 8, Vitest

**Spec:** docs/superpowers/specs/2026-03-17-projects-issues-board-view-design.md

**Depends on:** Sub-project 1 must be implemented first.

---

## File Structure

### New files to create:

```
src/lib/db/
  view-queries.ts                    # Saved view CRUD query functions

src/pages/api/projects/
  [id]/views/
    index.ts                         # GET list views, POST create view
    [viewId].ts                      # PUT update view, DELETE delete view
  [id]/issues/
    reorder.ts                       # PUT batch reorder issue positions

src/pages/api/issues/
  [id]/status.ts                     # PUT quick status update

src/components/ui/atoms/
  InlineEditor.tsx                   # Generic inline-editable cell
  FieldDropdown.tsx                  # Single/multi-select dropdown
  UserPicker.tsx                     # User selection dropdown
  DatePicker.tsx                     # Date picker input

src/components/ui/molecules/
  BoardColumn.tsx                    # Single Kanban column
  BoardCard.tsx                      # Draggable card in board view
  ViewTabs.tsx                       # Saved view tab bar

src/components/ui/organisms/
  BoardView.tsx                      # Full board with drag-and-drop

stories/atoms/
  InlineEditor.stories.tsx
  FieldDropdown.stories.tsx
  UserPicker.stories.tsx
  DatePicker.stories.tsx

stories/molecules/
  BoardColumn.stories.tsx
  BoardCard.stories.tsx
  ViewTabs.stories.tsx

stories/organisms/
  BoardView.stories.tsx

tests/lib/
  view-queries.test.ts              # Unit tests for view query functions
```

### Files to modify:

```
package.json                         # Add @dnd-kit dependencies
src/lib/db/project-queries.ts        # Add reorder + status update queries (created in sub-project 1)
src/components/ui/atoms/index.ts     # Export new atoms
src/components/ui/molecules/index.ts # Export new molecules
src/components/ui/organisms/index.ts # Export new organisms
src/components/ui/organisms/IssueTable.tsx    # Add inline editing support
src/components/ui/organisms/ProjectView.tsx   # Add board view tab, view tabs bar
```

---

## Chunk 1: Install dnd-kit + Schema + View & Reorder APIs

### Task 1.1: Install @dnd-kit Dependencies

- **Modify:** `website-astro/package.json`

- [ ] Run `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` in the `website-astro/` directory
- [ ] Verify the three packages appear in `dependencies` in `package.json`

**Commit:** `feat(projects): install @dnd-kit drag-and-drop dependencies`

### Task 1.2: Add project_views Table to Schema

- **Modify:** `website-astro/src/lib/db/project-queries.ts` (add migration function or raw SQL execution)

The `project_views` table:

```sql
CREATE TABLE IF NOT EXISTS project_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('table', 'board')),
  config TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_project_views_project_user ON project_views(project_id, user_id);
```

- [ ] Add the `CREATE TABLE IF NOT EXISTS project_views` statement to the schema initialization function in `project-queries.ts` (following the pattern used by sub-project 1 for `projects`, `issues`, etc.)
- [ ] Include the `idx_project_views_project_user` index creation
- [ ] Test that the migration runs without error against an existing database with sub-project 1 tables

**Commit:** `feat(projects): add project_views table schema for saved views`

### Task 1.3: Create View Query Functions

- **Create:** `website-astro/src/lib/db/view-queries.ts`

- [ ] Define `ProjectView` TypeScript interface:
  ```typescript
  export interface ProjectView {
    id: string;
    project_id: string;
    user_id: string;
    name: string;
    view_type: 'table' | 'board';
    config: string; // JSON string
    is_default: number;
    created_at: string;
  }
  ```
- [ ] Implement `getProjectViews(projectId: string, userId: string): Promise<ProjectView[]>` — returns views ordered by `is_default DESC, created_at ASC`
- [ ] Implement `createProjectView(view: { projectId, userId, name, viewType, config, isDefault? }): Promise<ProjectView>` — generates ID with `lower(hex(randomblob(8)))`, inserts row, returns created view
- [ ] Implement `updateProjectView(viewId: string, userId: string, updates: { name?, config?, isDefault? }): Promise<void>` — updates only provided fields, verifies `user_id` matches
- [ ] Implement `deleteProjectView(viewId: string, userId: string): Promise<void>` — deletes view, verifies `user_id` matches
- [ ] Follow the query pattern from `website-astro/src/lib/db/queries.ts` (use `getDb()`, `db.execute()` with parameterized SQL, cast results with `as unknown as T`)

**Commit:** `feat(projects): add view-queries.ts with saved view CRUD functions`

### Task 1.4: Create Reorder and Status Update Query Functions

- **Modify:** `website-astro/src/lib/db/project-queries.ts`

- [ ] Implement `reorderProjectIssues(projectId: string, issueIds: string[]): Promise<void>` — batch UPDATE `project_issues` setting `position` = array index for each `issue_id` in the project. Use a transaction (`db.batch()`) for atomicity.
- [ ] Implement `updateIssueStatus(issueId: string, status: string): Promise<void>` — UPDATE `issues` SET `status` and `updated_at = datetime('now')`. Validate status is one of: `todo`, `in_progress`, `done`, `blocked`, `archived`.

**Commit:** `feat(projects): add reorder and quick status update query functions`

### Task 1.5: Create View API Endpoints

- **Create:** `website-astro/src/pages/api/projects/[id]/views/index.ts`
- **Create:** `website-astro/src/pages/api/projects/[id]/views/[viewId].ts`

For `index.ts`:
- [ ] Implement `GET` handler: authenticate session, check admin role, call `getProjectViews(id, session.user.id)`, return JSON array
- [ ] Implement `POST` handler: authenticate session, check admin role, parse body `{ name, viewType, config }`, validate `viewType` is `'table'` or `'board'`, call `createProjectView(...)`, return 201 with created view
- [ ] Follow the existing API pattern from `website-astro/src/pages/api/plants/index.ts` (export `GET`/`POST` as named Astro APIRoute functions)

For `[viewId].ts`:
- [ ] Implement `PUT` handler: authenticate session, parse body `{ name?, config?, isDefault? }`, call `updateProjectView(viewId, session.user.id, updates)`, return 200
- [ ] Implement `DELETE` handler: authenticate session, call `deleteProjectView(viewId, session.user.id)`, return 204

**Commit:** `feat(projects): add saved views API endpoints (CRUD)`

### Task 1.6: Create Reorder and Status Update API Endpoints

- **Create:** `website-astro/src/pages/api/projects/[id]/issues/reorder.ts`
- **Create:** `website-astro/src/pages/api/issues/[id]/status.ts`

For `reorder.ts`:
- [ ] Implement `PUT` handler: authenticate session, check admin role, parse body `{ issueIds: string[] }`, validate `issueIds` is a non-empty array of strings, call `reorderProjectIssues(id, issueIds)`, return 200

For `status.ts`:
- [ ] Implement `PUT` handler: authenticate session, check admin role, parse body `{ status: string }`, validate status value, call `updateIssueStatus(id, status)`, return 200

**Commit:** `feat(projects): add issue reorder and quick status update API endpoints`

### Task 1.7: Write Tests for View Queries

- **Create:** `website-astro/tests/lib/view-queries.test.ts`

- [ ] Test `getProjectViews` returns empty array for new project
- [ ] Test `createProjectView` returns view with generated ID
- [ ] Test `updateProjectView` updates config JSON
- [ ] Test `deleteProjectView` removes the view
- [ ] Test `updateProjectView` rejects when user_id does not match
- [ ] Mock `getDb()` following the same pattern as other test files in the project

**Commit:** `test(projects): add unit tests for view query functions`

---

## Chunk 2: Board View Components (BoardColumn, BoardCard, BoardView)

### Task 2.1: Create BoardCard Molecule

- **Create:** `website-astro/src/components/ui/molecules/BoardCard.tsx`

- [ ] Define props interface:
  ```typescript
  interface BoardCardProps {
    id: string;
    title: string;
    issueNumber?: string;
    fieldChip?: { label: string; color: string };
    assigneeAvatar?: { name: string; imageUrl?: string };
    priority?: { label: string; color: string };
    onClick?: () => void;
    isDragging?: boolean;
  }
  ```
- [ ] Render card with: title (max 2 lines, `font-pixel text-pixel-base`, `line-clamp-2`), bottom row with field chip on left and assignee avatar on right
- [ ] Apply design tokens: `bg-bg-card`, `rounded-lg`, `shadow-sm`, `p-3`
- [ ] When `isDragging` is true, apply `shadow-md`, slight rotation (`rotate-2`), and reduced opacity
- [ ] Card is clickable (calls `onClick`)
- [ ] Export as default

**Commit:** `feat(projects): create BoardCard molecule component`

### Task 2.2: Create BoardColumn Molecule

- **Create:** `website-astro/src/components/ui/molecules/BoardColumn.tsx`

- [ ] Define props interface:
  ```typescript
  interface BoardColumnProps {
    id: string;
    label: string;
    count: number;
    color?: string;
    children: React.ReactNode;
    isDropTarget?: boolean;
  }
  ```
- [ ] Render column header with label + count badge (using `Badge` atom from design system)
- [ ] Column body renders children (cards) stacked vertically with `gap-2` (8px)
- [ ] Column has `min-w-[250px]`, `flex-shrink-0`, and vertical scroll if content overflows
- [ ] When `isDropTarget` is true, add `border-accent` highlight ring
- [ ] Style: `bg-bg-surface`, `rounded-xl`, `p-3`
- [ ] Export as default

**Commit:** `feat(projects): create BoardColumn molecule component`

### Task 2.3: Create BoardView Organism

- **Create:** `website-astro/src/components/ui/organisms/BoardView.tsx`

- [ ] Import `@dnd-kit/core` (`DndContext`, `DragOverlay`, `closestCorners`, `KeyboardSensor`, `PointerSensor`, `useSensor`, `useSensors`) and `@dnd-kit/sortable` (`SortableContext`, `useSortable`, `verticalListSortingStrategy`)
- [ ] Define props interface:
  ```typescript
  interface BoardViewProps {
    projectId: string;
    issues: Issue[]; // Issue type from sub-project 1
    fields: ProjectField[]; // ProjectField type from sub-project 1
    boardField: string; // field ID to group by (default: 'status')
    onStatusChange?: (issueId: string, newStatus: string) => void;
    onReorder?: (issueIds: string[]) => void;
    onIssueClick?: (issueId: string) => void;
  }
  ```
- [ ] Group issues into columns based on `boardField` values (for status: use hardcoded `['todo', 'in_progress', 'done', 'blocked']`; for custom fields: use field options from `ProjectField.options`)
- [ ] Create a `SortableBoardCard` wrapper that uses `useSortable` hook to make `BoardCard` draggable
- [ ] Implement `handleDragEnd`:
  - If card moved within same column: call `onReorder` with new order
  - If card moved to different column: call `onStatusChange` (or field value change) AND `onReorder`
  - Optimistic update: reorder state locally before API call
- [ ] Implement `handleDragStart`: track active card for `DragOverlay`
- [ ] Render horizontal scrollable container with `flex gap-4 overflow-x-auto`
- [ ] Render `DragOverlay` with a clone of the active `BoardCard` (with `isDragging=true`)
- [ ] Export as default

**Commit:** `feat(projects): create BoardView organism with drag-and-drop`

### Task 2.4: Create Storybook Stories for Board Components

- **Create:** `website-astro/stories/molecules/BoardCard.stories.tsx`
- **Create:** `website-astro/stories/molecules/BoardColumn.stories.tsx`
- **Create:** `website-astro/stories/organisms/BoardView.stories.tsx`

For BoardCard stories:
- [ ] Default story: basic card with title, field chip, and assignee
- [ ] Dragging story: card in dragging state (`isDragging=true`)
- [ ] Long title story: title that exceeds 2 lines (shows ellipsis)
- [ ] Minimal story: title only, no chip or avatar

For BoardColumn stories:
- [ ] Default story: column with 3-4 sample cards
- [ ] Empty story: column with zero cards
- [ ] Drop target story: column with `isDropTarget=true`

For BoardView stories:
- [ ] Default story: full board with 4 status columns and ~8 sample issues
- [ ] Custom field story: board grouped by a "Phase" single-select field

**Commit:** `feat(projects): add Storybook stories for board view components`

### Task 2.5: Export New Board Components

- **Modify:** `website-astro/src/components/ui/molecules/index.ts`
- **Modify:** `website-astro/src/components/ui/organisms/index.ts`

- [ ] Add `export { default as BoardCard } from './BoardCard';` to molecules index
- [ ] Add `export { default as BoardColumn } from './BoardColumn';` to molecules index
- [ ] Add `export { default as BoardView } from './BoardView';` to organisms index

**Commit:** `feat(projects): export board view components from design system indexes`

---

## Chunk 3: Inline Table Editing (InlineEditor, FieldDropdown, DatePicker, UserPicker)

### Task 3.1: Create InlineEditor Atom

- **Create:** `website-astro/src/components/ui/atoms/InlineEditor.tsx`

- [ ] Define props interface:
  ```typescript
  interface InlineEditorProps {
    value: string;
    type: 'text' | 'number';
    onSave: (value: string) => void;
    onCancel?: () => void;
    placeholder?: string;
    className?: string;
  }
  ```
- [ ] Default state: display value as plain text (clickable)
- [ ] On click: switch to input mode with current value pre-filled
- [ ] Input has `border-primary` ring when active (focus styles)
- [ ] Save on `blur` or `Enter` key press — calls `onSave` with new value
- [ ] Cancel on `Escape` key press — reverts to original value, calls `onCancel`
- [ ] For `type='number'`: use `<input type="number">` with appropriate step
- [ ] Export as default

**Commit:** `feat(projects): create InlineEditor atom for click-to-edit cells`

### Task 3.2: Create FieldDropdown Atom

- **Create:** `website-astro/src/components/ui/atoms/FieldDropdown.tsx`

- [ ] Define props interface:
  ```typescript
  interface FieldDropdownProps {
    options: { value: string; label: string; color?: string }[];
    value: string | string[]; // string for single-select, string[] for multi-select
    multi?: boolean;
    onChange: (value: string | string[]) => void;
    onClose?: () => void;
    placeholder?: string;
  }
  ```
- [ ] Render a dropdown menu positioned below the trigger (use absolute positioning)
- [ ] For single-select: clicking an option selects it and closes the dropdown
- [ ] For multi-select (`multi=true`): options have checkboxes, clicking toggles selection, dropdown stays open until clicking outside or pressing Escape
- [ ] Options with `color` render a small colored dot next to the label
- [ ] Style dropdown with `bg-bg-card`, `rounded-lg`, `shadow-lg`, `border border-border`
- [ ] Close on click outside (use `useEffect` with document click listener)
- [ ] Export as default

**Commit:** `feat(projects): create FieldDropdown atom for select fields`

### Task 3.3: Create DatePicker Atom

- **Create:** `website-astro/src/components/ui/atoms/DatePicker.tsx`

- [ ] Define props interface:
  ```typescript
  interface DatePickerProps {
    value: string; // ISO date string (YYYY-MM-DD)
    onChange: (value: string) => void;
    onClose?: () => void;
    placeholder?: string;
  }
  ```
- [ ] Default state: display formatted date as plain text (clickable)
- [ ] On click: show native `<input type="date">` with current value
- [ ] Save on change event — calls `onChange` with ISO date string
- [ ] Close on blur
- [ ] Style consistent with other atoms: `border-primary` ring when active
- [ ] Export as default

**Commit:** `feat(projects): create DatePicker atom for date fields`

### Task 3.4: Create UserPicker Atom

- **Create:** `website-astro/src/components/ui/atoms/UserPicker.tsx`

- [ ] Define props interface:
  ```typescript
  interface UserPickerProps {
    users: { id: string; name: string; imageUrl?: string }[];
    value: string | null; // selected user ID
    onChange: (userId: string | null) => void;
    onClose?: () => void;
    placeholder?: string;
  }
  ```
- [ ] Render a dropdown menu with user list (avatar + name for each)
- [ ] Clicking a user selects them and closes the dropdown
- [ ] Include a "None" / "Unassigned" option at the top to clear selection
- [ ] Search/filter input at the top of the dropdown for teams with many users
- [ ] Style consistent with `FieldDropdown`: `bg-bg-card`, `rounded-lg`, `shadow-lg`
- [ ] Close on click outside or Escape
- [ ] Export as default

**Commit:** `feat(projects): create UserPicker atom for user/assignee fields`

### Task 3.5: Add Inline Editing to IssueTable

- **Modify:** `website-astro/src/components/ui/organisms/IssueTable.tsx`

- [ ] Import `InlineEditor`, `FieldDropdown`, `DatePicker`, `UserPicker` atoms
- [ ] Add `onFieldUpdate` prop: `(issueId: string, fieldId: string, value: string) => void`
- [ ] Add `onTitleUpdate` prop: `(issueId: string, title: string) => void`
- [ ] Add `onAssigneeUpdate` prop: `(issueId: string, userId: string | null) => void`
- [ ] Replace static title cell with `InlineEditor` (type='text')
- [ ] Replace static text/number field cells with `InlineEditor` (matching type)
- [ ] Replace static single-select field cells with `FieldDropdown` (single mode)
- [ ] Replace static multi-select field cells with `FieldDropdown` (multi mode)
- [ ] Replace static date field cells with `DatePicker`
- [ ] Replace static user field cells with `UserPicker`
- [ ] Replace static assignee cell with `UserPicker`
- [ ] Keep non-editable cells unchanged: issue number, created_at, updated_at
- [ ] Tab key navigation: on Tab press in an active editor, save current cell and activate the next editable cell in the row
- [ ] Changes call the appropriate update prop immediately (debouncing handled by the parent)

**Commit:** `feat(projects): add inline editing support to IssueTable organism`

### Task 3.6: Create Storybook Stories for Inline Editing Atoms

- **Create:** `website-astro/stories/atoms/InlineEditor.stories.tsx`
- **Create:** `website-astro/stories/atoms/FieldDropdown.stories.tsx`
- **Create:** `website-astro/stories/atoms/DatePicker.stories.tsx`
- **Create:** `website-astro/stories/atoms/UserPicker.stories.tsx`

For InlineEditor:
- [ ] Text mode story: editable text cell
- [ ] Number mode story: editable number cell
- [ ] Active state story: editor in edit mode with focus ring

For FieldDropdown:
- [ ] Single-select story: dropdown with 4 color-coded options
- [ ] Multi-select story: dropdown with checkboxes
- [ ] Empty story: no selection

For DatePicker:
- [ ] With value story: shows a formatted date
- [ ] Empty story: shows placeholder

For UserPicker:
- [ ] With users story: dropdown with 5 sample users
- [ ] Selected story: showing selected user
- [ ] Empty story: no user selected

**Commit:** `feat(projects): add Storybook stories for inline editing atoms`

### Task 3.7: Export New Atoms

- **Modify:** `website-astro/src/components/ui/atoms/index.ts`

- [ ] Add `export { default as InlineEditor } from './InlineEditor';`
- [ ] Add `export { default as FieldDropdown } from './FieldDropdown';`
- [ ] Add `export { default as DatePicker } from './DatePicker';`
- [ ] Add `export { default as UserPicker } from './UserPicker';`

**Commit:** `feat(projects): export inline editing atoms from design system index`

---

## Chunk 4: Saved View Preferences (ViewTabs, Persistence, Auto-save)

### Task 4.1: Create ViewTabs Molecule

- **Create:** `website-astro/src/components/ui/molecules/ViewTabs.tsx`

- [ ] Define props interface:
  ```typescript
  interface ViewTabsProps {
    views: ProjectView[];
    activeViewId: string | null;
    onSelect: (viewId: string) => void;
    onCreate: (name: string) => void;
    onDelete: (viewId: string) => void;
    onRename: (viewId: string, name: string) => void;
  }
  ```
- [ ] Render horizontal tab bar below the Board|Table view switcher
- [ ] Each tab shows view name; the default view tab is always first and cannot be deleted
- [ ] Active tab has `border-b-2 border-primary` styling
- [ ] Right-click (or three-dot menu) on a tab shows context menu: Rename, Delete (except for default view)
- [ ] "+ New View" tab at the end: clicking opens an inline text input to name the new view, Enter confirms, Escape cancels
- [ ] Tab overflow: horizontal scroll with subtle fade edges if tabs exceed container width
- [ ] Export as default

**Commit:** `feat(projects): create ViewTabs molecule for saved view tab bar`

### Task 4.2: Implement View Persistence Logic (Hook)

- **Create:** `website-astro/src/components/hooks/useProjectViews.ts`

- [ ] Create `useProjectViews(projectId: string)` custom hook that manages:
  - `views`: array of `ProjectView` objects
  - `activeView`: currently selected view (or null for default)
  - `loading`: boolean
- [ ] On mount: fetch `GET /api/projects/:id/views` and populate state
- [ ] `selectView(viewId)`: set active view, apply its config to the parent
- [ ] `createView(name, viewType, config)`: call `POST /api/projects/:id/views`, add to state, set as active
- [ ] `updateView(viewId, updates)`: call `PUT /api/projects/:id/views/:viewId`, update state
- [ ] `deleteView(viewId)`: call `DELETE /api/projects/:id/views/:viewId`, remove from state, switch to default
- [ ] Return `{ views, activeView, loading, selectView, createView, updateView, deleteView }`

**Commit:** `feat(projects): create useProjectViews hook for view state management`

### Task 4.3: Implement Auto-save with Debounce

- **Create:** `website-astro/src/components/hooks/useAutoSaveView.ts`

- [ ] Create `useAutoSaveView(activeViewId: string | null, config: object, updateView: Function)` hook
- [ ] Track config changes with `useEffect` and a 2-second debounce timer (`setTimeout`)
- [ ] When config changes and 2 seconds pass without further changes, call `updateView(activeViewId, { config: JSON.stringify(config) })`
- [ ] Clear timer on unmount or new changes (cleanup in `useEffect`)
- [ ] If `activeViewId` is null (user is on "Default" and makes changes), set a `pendingSave` flag — the parent will prompt "Save as new view?" vs "Update default"
- [ ] Return `{ pendingSave, clearPendingSave }`

**Commit:** `feat(projects): create useAutoSaveView hook with 2-second debounce`

### Task 4.4: Create ViewTabs Storybook Stories

- **Create:** `website-astro/stories/molecules/ViewTabs.stories.tsx`

- [ ] Default story: 3 tabs (Default, By Phase, Critical Only) with Default active
- [ ] Single tab story: only the Default view
- [ ] Many tabs story: 8+ tabs to demonstrate horizontal scroll
- [ ] Creating story: shows the "+ New View" inline input in active state

**Commit:** `feat(projects): add Storybook stories for ViewTabs molecule`

### Task 4.5: Export ViewTabs

- **Modify:** `website-astro/src/components/ui/molecules/index.ts`

- [ ] Add `export { default as ViewTabs } from './ViewTabs';`

**Commit:** `feat(projects): export ViewTabs from molecules index`

---

## Chunk 5: Integration (Wire into ProjectView, Final Testing)

### Task 5.1: Wire Board View into ProjectView

- **Modify:** `website-astro/src/components/ui/organisms/ProjectView.tsx`

- [ ] Import `BoardView` organism
- [ ] Import `ViewTabs` molecule
- [ ] Import `useProjectViews` and `useAutoSaveView` hooks
- [ ] Update the view switcher: remove "coming soon" badge from Board tab, make it fully functional
- [ ] When Board is selected: render `BoardView` instead of `IssueTable`
- [ ] Add "Board by: [field]" dropdown to the toolbar when in Board mode (replaces "Group by")
  - Populate dropdown options from project's single-select fields + "Status" as default
  - Changing the field updates `boardField` in the active view config
- [ ] Render `ViewTabs` below the Board|Table switcher
- [ ] Connect `ViewTabs` events to `useProjectViews` hook methods
- [ ] When a view tab is selected: apply its `config` (set groupBy, sortBy, visibleColumns, filters, boardField, viewType)
- [ ] Connect auto-save: any toolbar change (filter, groupBy, columns, sort) triggers the `useAutoSaveView` debounce
- [ ] When user is on Default view and makes changes, show a small prompt/toast: "Save as new view?" with a button — clicking opens the new view name input

**Commit:** `feat(projects): wire board view and saved views into ProjectView`

### Task 5.2: Connect Board Drag-and-Drop to API

- **Modify:** `website-astro/src/components/ui/organisms/ProjectView.tsx`

- [ ] Implement `handleBoardReorder` callback:
  1. Update local issue state optimistically (reorder array)
  2. Call `PUT /api/projects/:id/issues/reorder` with new `issueIds` order
  3. On error: revert local state, show error toast
- [ ] Implement `handleBoardStatusChange` callback:
  1. Update local issue's status optimistically
  2. Call `PUT /api/issues/:id/status` with new status
  3. On error: revert local state, show error toast
- [ ] Pass both callbacks to `BoardView` as `onReorder` and `onStatusChange` props
- [ ] Implement `handleIssueClick`: navigate to `/issues/:id`

**Commit:** `feat(projects): connect board drag-and-drop to reorder and status APIs`

### Task 5.3: Connect Inline Table Editing to API

- **Modify:** `website-astro/src/components/ui/organisms/ProjectView.tsx`

- [ ] Implement `handleFieldUpdate(issueId, fieldId, value)`:
  1. Update local field value optimistically
  2. Call `PUT /api/projects/:id/issues/:issueId/fields` with `{ [fieldId]: value }`
  3. On error: revert, show error toast
- [ ] Implement `handleTitleUpdate(issueId, title)`:
  1. Update local issue title optimistically
  2. Call `PUT /api/issues/:issueId` with `{ title }`
  3. On error: revert, show error toast
- [ ] Implement `handleAssigneeUpdate(issueId, userId)`:
  1. Update local assignees optimistically
  2. Call `POST /api/issues/:issueId/assignees` (or `DELETE` if removing)
  3. On error: revert, show error toast
- [ ] Pass callbacks to `IssueTable` as `onFieldUpdate`, `onTitleUpdate`, `onAssigneeUpdate` props
- [ ] Add debounce (300ms) for text/number field updates to avoid excessive API calls during typing

**Commit:** `feat(projects): connect inline table editing to issue update APIs`

### Task 5.4: Add i18n Keys for Board View and Inline Editing

- **Modify:** i18n locale files (EN and PT-BR, paths established by sub-project 1's i18n setup)

- [ ] Add keys under `projects.board.*`:
  - `projects.board.boardBy`: "Board by" / "Agrupar por"
  - `projects.board.emptyColumn`: "No issues" / "Sem issues"
  - `projects.board.dragHint`: "Drag to reorder or change status" / "Arraste para reordenar ou alterar status"
- [ ] Add keys under `projects.views.*`:
  - `projects.views.default`: "Default" / "Padrão"
  - `projects.views.newView`: "New View" / "Nova Visão"
  - `projects.views.saveAsNew`: "Save as new view?" / "Salvar como nova visão?"
  - `projects.views.updateDefault`: "Update default" / "Atualizar padrão"
  - `projects.views.rename`: "Rename" / "Renomear"
  - `projects.views.delete`: "Delete" / "Excluir"
- [ ] Add keys under `projects.inline.*`:
  - `projects.inline.clickToEdit`: "Click to edit" / "Clique para editar"
  - `projects.inline.saving`: "Saving..." / "Salvando..."
  - `projects.inline.saved`: "Saved" / "Salvo"
  - `projects.inline.error`: "Error saving" / "Erro ao salvar"

**Commit:** `feat(i18n): add translation keys for board view and inline editing`

### Task 5.5: Write Integration Tests

- **Create:** `website-astro/tests/components/BoardView.test.tsx`

- [ ] Test that BoardView renders the correct number of columns based on status values
- [ ] Test that issues are placed in the correct columns based on their status
- [ ] Test that drag-and-drop callbacks fire with correct arguments (mock `@dnd-kit`)
- [ ] Test that empty columns render with "No issues" message

- **Create:** `website-astro/tests/components/InlineEditor.test.tsx`

- [ ] Test that clicking text switches to edit mode
- [ ] Test that pressing Enter saves the value
- [ ] Test that pressing Escape cancels the edit
- [ ] Test that blur saves the value

- **Create:** `website-astro/tests/components/ViewTabs.test.tsx`

- [ ] Test that tabs render for each view
- [ ] Test that clicking a tab calls `onSelect`
- [ ] Test that "+ New View" shows input on click
- [ ] Test that default view cannot be deleted

**Commit:** `test(projects): add integration tests for board view, inline editing, and view tabs`

### Task 5.6: Final Storybook Story for ProjectView with Board

- **Modify:** existing `ProjectView` Storybook story file (created in sub-project 1)

- [ ] Add "Board View" story: ProjectView with `viewType='board'`, sample issues across 4 status columns
- [ ] Add "With Saved Views" story: ProjectView with 3 saved view tabs shown
- [ ] Add "Inline Editing" story: ProjectView in table mode with inline editing enabled, showing an active editor cell

**Commit:** `feat(projects): add board view and saved views stories to ProjectView Storybook`

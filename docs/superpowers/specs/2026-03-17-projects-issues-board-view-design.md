# Projects & Issues System — Design Spec (Sub-project 2: Board View & Polish)

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Board/Kanban view, inline table editing, saved view preferences, drag-and-drop ordering
**Depends on:** Sub-project 1 (Core Issues & Projects)

---

## 1. Goal

Add the Board (Kanban) view to the project management system, plus inline table editing, drag-and-drop ordering, and saved view preferences. This completes the two-view system (Board + Table) designed during brainstorming.

---

## 2. Schema Additions

### 2.1 Position column on project_issues

Add to the `project_issues` table (created in sub-project 1):

```sql
ALTER TABLE project_issues ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
```

This supports manual ordering of issues within a project — used by both board view (card order within columns) and table view (manual sort mode).

**Important:** Sub-project 1's migration should include this column from the start to avoid a second migration. This spec documents the column here but it must be added to sub-project 1's schema.

### 2.2 Saved Views

```sql
CREATE TABLE project_views (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('table', 'board')),
  config TEXT NOT NULL DEFAULT '{}',  -- JSON: groupBy, sortBy, visibleColumns, filters, boardField
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_project_views_project_user ON project_views(project_id, user_id);
```

The `config` JSON stores:
```json
{
  "viewType": "table",
  "groupBy": "field_abc123",
  "sortBy": { "field": "updated_at", "direction": "desc" },
  "visibleColumns": ["status", "title", "field_abc123", "assignee", "updated_at"],
  "filters": { "status": ["todo", "in_progress"], "assignee": "user_123" },
  "boardField": "field_abc123"
}
```

---

## 3. API Additions

### 3.1 Issue Position (drag-and-drop ordering)

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/projects/:id/issues/reorder` | Batch update positions `{ issueIds: string[] }` — sets position based on array index |

### 3.2 Saved Views

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects/:id/views` | List saved views for current user |
| `POST` | `/api/projects/:id/views` | Create saved view `{ name, viewType, config }` |
| `PUT` | `/api/projects/:id/views/:viewId` | Update view config |
| `DELETE` | `/api/projects/:id/views/:viewId` | Delete saved view |

### 3.3 Bulk Status Update (for board drag-and-drop)

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/issues/:id/status` | Quick status update `{ status }` — lighter than full PUT |

---

## 4. Board View UI

### 4.1 Layout

The board view renders issues as cards in vertical columns. Each column represents a value of a single-select field (default: status).

**Column configuration:**
- Default: columns = status values (Todo, In Progress, Done, Blocked)
- User can switch to any single-select custom field (e.g., Phase, Priority)
- Column selector dropdown in the toolbar: "Board by: Status ▾"

**Card layout:**
- Title (font-pixel text-pixel-base, 2-line max with ellipsis)
- Bottom row: field chip (e.g., phase label) on left, assignee avatar on right
- Optional: priority indicator (colored dot or text)
- Click card → navigate to `/issues/:id`

**Column layout:**
- Column header: field value label + issue count badge
- Cards stacked vertically with 8px gap
- Minimum column width: 250px
- Horizontal scroll if columns exceed viewport

### 4.2 Drag and Drop

Use a lightweight drag-and-drop library (e.g., `@dnd-kit/core` + `@dnd-kit/sortable`):

- Drag a card within a column → reorder (updates `position` on `project_issues`)
- Drag a card to another column → change the field value (e.g., status changes from "todo" to "in_progress") AND reorder
- Visual feedback: dragged card has shadow-md + slight rotation, drop target column highlights with border-accent
- Optimistic update: UI updates immediately, API call fires in background, reverts on error

### 4.3 Board Toolbar

Same toolbar as table view:
- Filter chips (status, assignee, etc.)
- "Board by: [field] ▾" dropdown (replaces "Group by" from table view)
- Search input
- View switcher: Board | Table

---

## 5. Inline Table Editing

### 5.1 Editable Cells

Clicking a cell in the table view enters edit mode for that cell:

- **Title:** Converts to a text input, saves on blur or Enter
- **Status:** Click cycles through states (same as current behavior, already implemented in sub-project 1)
- **Single-select fields:** Click shows a dropdown with options
- **Multi-select fields:** Click shows a multi-select dropdown with checkboxes
- **Text fields:** Click converts to text input
- **Number fields:** Click converts to number input
- **Date fields:** Click shows a date picker
- **User fields:** Click shows a user picker dropdown
- **Assignee:** Click shows a user picker dropdown

### 5.2 Behavior

- Tab key moves to the next editable cell in the row
- Escape cancels the edit
- Changes save immediately (debounced API call, optimistic UI update)
- Visual feedback: active cell has a `border-primary` ring

### 5.3 Non-editable Cells

- Issue number (auto-generated)
- Created/updated timestamps (system-managed)

---

## 6. Saved View Preferences

### 6.1 View Tabs

Below the Board | Table switcher, show a row of saved view tabs:

```
Board | Table    [Default] [By Phase] [Critical Only] [+ New View]
```

- Each tab represents a saved view configuration
- Clicking a tab loads its config (groupBy, filters, visibleColumns, etc.)
- "Default" is always present (the project's default view)
- "+ New View" saves the current configuration as a named view

### 6.2 View Persistence

- When the user changes groupBy, filters, columns, or sorting, those changes apply to the current view
- Changes are auto-saved after 2 seconds of inactivity (debounced)
- If the user is on "Default" and makes changes, prompt: "Save as new view?" vs "Update default"
- Views are per-user per-project (different users can have different saved views)

---

## 7. Design System Components

New and modified components:

| Component | Layer | Description |
|-----------|-------|-------------|
| `BoardColumn` | molecule | Single Kanban column with header and card list |
| `BoardCard` | molecule | Draggable card in the board view |
| `BoardView` | organism | Full board with columns, drag-and-drop context |
| `InlineEditor` | atom | Generic inline-editable cell (text, number, date, select) |
| `ViewTabs` | molecule | Saved view tab bar with create/delete |
| `FieldDropdown` | atom | Dropdown for single/multi-select field values |
| `UserPicker` | atom | Dropdown to select users |
| `DatePicker` | atom | Date picker input |

Modified components (from sub-project 1):
- `IssueTable` — Add inline editing support, integrate saved views
- `ProjectView` — Add board view tab, view tabs bar

All components follow design system tokens and are documented in Storybook.

---

## 8. Dependencies

New npm packages:
- `@dnd-kit/core` — Drag-and-drop framework
- `@dnd-kit/sortable` — Sortable lists/grids addon
- `@dnd-kit/utilities` — CSS transform utilities

These are lightweight (~15kb gzipped total) and framework-agnostic.

---

## 9. Out of Scope

- Real-time collaboration (WebSocket sync between users)
- Column work-in-progress (WIP) limits
- Swimlanes (horizontal grouping in board view)
- Board card customization (choosing which fields to show on cards)
- Keyboard shortcuts for navigation
- Undo/redo
- Non-admin access (project membership roles)

# Projects & Issues System — Design Spec (Sub-project 1: Core)

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Database-backed project management with issues, comments, custom fields, table view with group-by. Admin-only access for now.

---

## 1. Goal

Build a GitHub-inspired project and issue management system into Plantgotchi. Issues are independent entities with unlimited nesting, markdown descriptions, comments with reactions/pinning, and assignees. Projects are views over issues with custom fields (single-select, multi-select, text, number, date, user). The table view supports grouping by any single-select field, show/hide columns, and sorting.

This sub-project delivers: database schema, full API, project list page, project table view page, issue detail page, seed migration from the existing Launch Tracker, and admin-only access gating.

**Not in scope (sub-project 2):** Board/Kanban view, drag-and-drop, inline table editing, saved view preferences, real-time updates.

---

## 2. Data Model

All tables in the existing LibSQL/Turso database alongside plants, readings, etc.

**Important:** `PRAGMA foreign_keys = ON` must be set on the database client connection (`client.ts`) to enforce foreign key constraints. The existing codebase does not set this.

**`updated_at` handling:** SQLite does not auto-update timestamps. The API layer must explicitly set `updated_at = datetime('now')` in every UPDATE query. No triggers needed.

### 2.1 Issues

```sql
CREATE TABLE issues (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'archived')),
  parent_issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_issues_parent ON issues(parent_issue_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created_by ON issues(created_by);
```

### 2.2 Projects

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 2.3 Project Members

```sql
CREATE TABLE project_members (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'member', 'viewer')),
  PRIMARY KEY (project_id, user_id)
);
```

### 2.4 Project-Issue Membership (many-to-many)

```sql
CREATE TABLE project_issues (
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, issue_id)
);

CREATE INDEX idx_project_issues_issue ON project_issues(issue_id);
```

### 2.5 Custom Field Definitions (per project)

```sql
CREATE TABLE project_fields (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL
    CHECK (field_type IN ('text', 'number', 'date', 'single_select', 'multi_select', 'user')),
  options TEXT DEFAULT '[]',  -- JSON array for select types
  position INTEGER NOT NULL DEFAULT 0,
  UNIQUE (project_id, name)
);

CREATE INDEX idx_project_fields_project ON project_fields(project_id);
```

### 2.6 Custom Field Values (per issue-in-project)

```sql
CREATE TABLE project_issue_fields (
  project_id TEXT NOT NULL,
  issue_id TEXT NOT NULL,
  field_id TEXT NOT NULL REFERENCES project_fields(id) ON DELETE CASCADE,
  value TEXT DEFAULT '',
  PRIMARY KEY (project_id, issue_id, field_id),
  FOREIGN KEY (project_id, issue_id) REFERENCES project_issues(project_id, issue_id) ON DELETE CASCADE
);
```

### 2.7 Issue Assignees

```sql
CREATE TABLE issue_assignees (
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, user_id)
);
```

### 2.8 Comments

```sql
CREATE TABLE issue_comments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_comments_issue ON issue_comments(issue_id);
```

### 2.9 Comment Reactions

```sql
CREATE TABLE comment_reactions (
  comment_id TEXT NOT NULL REFERENCES issue_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  PRIMARY KEY (comment_id, user_id, emoji)
);
```

---

## 3. API Endpoints

All endpoints require authentication. All endpoints check that the user is an admin (for now).

### 3.1 Projects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List projects the user has access to (`?limit=&offset=`) |
| `POST` | `/api/projects` | Create project (creator becomes owner) |
| `GET` | `/api/projects/:id` | Get project with field definitions and member list |
| `PUT` | `/api/projects/:id` | Update project name/description |
| `DELETE` | `/api/projects/:id` | Delete project (does NOT delete issues) |

### 3.2 Project Members

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects/:id/members` | List members |
| `POST` | `/api/projects/:id/members` | Add member `{ userId, role }` |
| `DELETE` | `/api/projects/:id/members/:userId` | Remove member |

### 3.3 Project Custom Fields

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects/:id/fields` | List field definitions |
| `POST` | `/api/projects/:id/fields` | Create field `{ name, field_type, options? }` |
| `PUT` | `/api/projects/:id/fields/:fieldId` | Update field (rename, reorder, change options) |
| `DELETE` | `/api/projects/:id/fields/:fieldId` | Delete field and its values |

### 3.4 Project Issues

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects/:id/issues` | List issues in project with field values (`?groupBy=fieldId&status=todo&limit=&offset=`) |
| `POST` | `/api/projects/:id/issues` | Add existing issue to project `{ issueId }` OR create new issue and add `{ title, status?, parentIssueId? }` |
| `DELETE` | `/api/projects/:id/issues/:issueId` | Remove issue from project (does not delete the issue) |
| `PUT` | `/api/projects/:id/issues/:issueId/fields` | Set custom field values `{ fieldId: value, ... }` |

### 3.5 Issues

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/issues` | List issues (`?status=&assignee=&parentId=&search=&limit=&offset=`) |
| `POST` | `/api/issues` | Create issue `{ title, description?, status?, parentIssueId? }` |
| `GET` | `/api/issues/:id` | Get issue with assignees, sub-issues, comments, projects |
| `PUT` | `/api/issues/:id` | Update issue (title, description, status, parentIssueId) |
| `DELETE` | `/api/issues/:id` | Delete issue (cascades to sub-issues) |

### 3.6 Issue Assignees

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/issues/:id/assignees` | Add assignee `{ userId }` |
| `DELETE` | `/api/issues/:id/assignees/:userId` | Remove assignee |

### 3.7 Comments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/issues/:id/comments` | List comments with reactions |
| `POST` | `/api/issues/:id/comments` | Create comment `{ body }` |
| `PUT` | `/api/comments/:id` | Edit comment `{ body }` |
| `DELETE` | `/api/comments/:id` | Delete comment |
| `POST` | `/api/comments/:id/pin` | Toggle pin |
| `POST` | `/api/comments/:id/reactions` | Add reaction `{ emoji }` |
| `DELETE` | `/api/comments/:id/reactions/:emoji` | Remove reaction |

---

## 4. Pages & UI

### 4.1 Navigation

Add "Projects" (or "Projetos" in PT-BR) to SiteNav between "Garden" and "Help". Only visible to admin users.

### 4.2 Project List Page (`/projects`)

- Grid of project cards showing: name, description (truncated), issue count, member avatars
- "+ New Project" button opens a create form (inline or modal)
- Each card links to `/projects/:id`
- Uses design system components: cards use `bg-bg-card`, `rounded-xl`, `shadow-sm`, `font-pixel` for names

### 4.3 Project View Page (`/projects/:id`)

**Header:**
- Project name (editable inline)
- Description
- Member avatars + member count
- Settings gear (edit project, manage fields, manage members)

**View switcher:** Board (disabled/coming soon badge) | Table (active)

**Table toolbar:**
- Filter chips: status filters, assignee filter
- Group by dropdown: None, or any single-select field (e.g., Phase)
- Columns dropdown: show/hide columns (status, title always visible)
- Search input

**Table view:**
- When ungrouped: flat table with sortable columns — Status, Title, custom fields, Assignee, Updated
- When grouped: collapsible group headers with phase number badge, name, progress bar, count. Rows beneath each group. The grouped field auto-hides from columns.
- Sub-issues shown indented with ↳ prefix below their parent
- Clicking an issue title navigates to `/issues/:id`
- Status badge is clickable to cycle status (same as current TaskRow behavior)

### 4.4 Issue Detail Page (`/issues/:id`)

**Main content (left):**
- Title (editable, `font-pixel text-pixel-lg`)
- Issue number + opened date + author
- Description (markdown rendered, editable)
- Sub-issues section: list of child issues with status badges, "+ Add sub-issue" button
- Comments section: chronological list, each with author, date, body, reactions, pin indicator
- Comment composer: textarea with "Comment" button

**Sidebar (right, 280px):**
- Status (clickable to change)
- Assignees (avatars, + button to add)
- Parent issue (link, or "None")
- Projects (links to each project this issue belongs to, + button to add to project)
- Custom fields (per-project, rendered by field type: text input, number input, date picker, select dropdown, user picker)

### 4.5 Design System Components

New atoms/molecules to create for this feature, following the existing design system patterns:

| Component | Layer | Description |
|-----------|-------|-------------|
| `ProjectCard` | molecule | Card for project list page |
| `IssueRow` | molecule | Table row for an issue (replaces/extends TaskRow) |
| `GroupHeader` | molecule | Collapsible group header with progress bar |
| `CommentItem` | molecule | Single comment with reactions and pin |
| `FieldEditor` | molecule | Renders the appropriate input for a custom field type |
| `IssueSidebar` | molecule | Right sidebar with status, assignees, fields |
| `IssueTable` | organism | Full table with grouping, sorting, column management |
| `ProjectView` | organism | Project page with toolbar + table |
| `IssueDetail` | organism | Issue detail page layout |

All components use the established design tokens and Tailwind classes. Stories added to Storybook.

---

## 5. Seed Migration

On first deploy, a seed script creates the "Launching Plantgotchi" project:

1. Create the project with the current admin user as owner
2. Create a "Phase" custom field (single-select) with options matching the phases defined in `AdminPanel.tsx`'s `INITIAL_PHASES` constant (SETUP, PCB DESIGN, 3D CASE DESIGN, ESP32 FIRMWARE, and any others present)
3. Create a "Priority" custom field (single-select) with options: Critical, High, Normal, Low
4. Create all issues from the existing Launch Tracker data (hardcoded in `AdminPanel.tsx` `INITIAL_PHASES` constant — approximately 24 tasks across 4 phases)
5. Set phase and priority field values for each issue
6. Assign all issues to the admin user
7. Mark issues as critical where the old data had `critical: true`

**Status mapping:** The existing Launch Tracker uses hyphenated status values (e.g., `in-progress`). The migration must map these to underscored values: `in-progress` → `in_progress`.

**Migration approach:** The schema is created via raw SQL statements executed through the `@libsql/client` (matching the existing pattern — there is no Kysely migration infrastructure). The seed script is a standalone API endpoint (`POST /api/admin/seed-projects`) or a build-time script, idempotent (checks if "Launching Plantgotchi" project exists before creating).

---

## 6. Access Control

For sub-project 1, access is admin-only:

- All `/api/projects/*`, `/api/issues/*`, `/api/comments/*` endpoints check `session.user.role === 'admin'`
- SiteNav only shows "Projects" link for admin users
- `/projects` and `/projects/:id` pages redirect non-admins to `/garden`
- `/issues/:id` pages redirect non-admins to `/garden`

Future (sub-project 2+): project membership roles (owner/member/viewer) control access per-project. The `project_members` table is already in the schema for this.

---

## 7. i18n

All user-facing strings go through the existing i18n system:

- New translation keys under `nav.projects`, `projects.*`, `issues.*`, `comments.*`
- Both PT-BR and EN locale files updated
- Components accept label props with English defaults (same pattern as GardenDashboard)

---

## 8. What Gets Removed

- The "Launch Tracker" tab in AdminPanel is removed after migration
- `AdminDashboard.tsx` localStorage logic is removed (data lives in the database now)
- The PhaseCard and TaskRow molecules remain in the design system (they may be useful elsewhere) but are replaced by IssueRow and GroupHeader in the project view

---

## 9. Out of Scope (Sub-project 2)

- Board/Kanban view with drag-and-drop
- Inline editing in table cells
- Column reordering and drag-to-resize
- Saved view preferences (per-user view configurations)
- Real-time updates / WebSocket
- Non-admin access (project membership roles)
- Issue labels/tags (beyond custom fields)
- Due dates as a built-in field (can be done via custom date field)
- File attachments on issues
- Email notifications

import { getDb } from './client';

/**
 * Run all project/issue migrations. Idempotent — uses IF NOT EXISTS.
 * Tables are created in FK-dependency order.
 */
export async function runMigrations(): Promise<string[]> {
  const db = getDb();

  const tables = [
    'issues',
    'projects',
    'project_members',
    'project_issues',
    'project_fields',
    'project_issue_fields',
    'issue_assignees',
    'issue_comments',
    'comment_reactions',
    'project_views',
  ];

  await db.batch([
    // 1. issues
    {
      sql: `CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo'
          CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'archived')),
        parent_issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE,
        created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_issues_parent ON issues(parent_issue_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_issues_created_by ON issues(created_by)`, args: [] },

    // 2. projects
    {
      sql: `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },

    // 3. project_members
    {
      sql: `CREATE TABLE IF NOT EXISTS project_members (
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member'
          CHECK (role IN ('owner', 'member', 'viewer')),
        PRIMARY KEY (project_id, user_id)
      )`,
      args: [],
    },

    // 4. project_issues
    {
      sql: `CREATE TABLE IF NOT EXISTS project_issues (
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (project_id, issue_id)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_project_issues_issue ON project_issues(issue_id)`, args: [] },

    // 5. project_fields
    {
      sql: `CREATE TABLE IF NOT EXISTS project_fields (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        field_type TEXT NOT NULL
          CHECK (field_type IN ('text', 'number', 'date', 'single_select', 'multi_select', 'user')),
        options TEXT DEFAULT '[]',
        position INTEGER NOT NULL DEFAULT 0,
        UNIQUE (project_id, name)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_project_fields_project ON project_fields(project_id)`, args: [] },

    // 6. project_issue_fields
    {
      sql: `CREATE TABLE IF NOT EXISTS project_issue_fields (
        project_id TEXT NOT NULL,
        issue_id TEXT NOT NULL,
        field_id TEXT NOT NULL REFERENCES project_fields(id) ON DELETE CASCADE,
        value TEXT DEFAULT '',
        PRIMARY KEY (project_id, issue_id, field_id),
        FOREIGN KEY (project_id, issue_id) REFERENCES project_issues(project_id, issue_id) ON DELETE CASCADE
      )`,
      args: [],
    },

    // 7. issue_assignees
    {
      sql: `CREATE TABLE IF NOT EXISTS issue_assignees (
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        PRIMARY KEY (issue_id, user_id)
      )`,
      args: [],
    },

    // 8. issue_comments
    {
      sql: `CREATE TABLE IF NOT EXISTS issue_comments (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
        issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        body TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_comments_issue ON issue_comments(issue_id)`, args: [] },

    // 9. comment_reactions
    {
      sql: `CREATE TABLE IF NOT EXISTS comment_reactions (
        comment_id TEXT NOT NULL REFERENCES issue_comments(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        emoji TEXT NOT NULL,
        PRIMARY KEY (comment_id, user_id, emoji)
      )`,
      args: [],
    },

    // 10. project_views (saved view configurations)
    {
      sql: `CREATE TABLE IF NOT EXISTS project_views (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        view_type TEXT NOT NULL CHECK (view_type IN ('table', 'board')),
        config TEXT NOT NULL DEFAULT '{}',
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_project_views_project_user ON project_views(project_id, user_id)`, args: [] },
  ]);

  return tables;
}

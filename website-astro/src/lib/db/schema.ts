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

export async function runLmsMigrations(): Promise<string[]> {
  const db = getDb();

  const tables = [
    'creator_profiles',
    'courses',
    'course_phases',
    'phase_modules',
    'module_content_blocks',
    'course_enrollments',
    'module_completions',
  ];

  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS creator_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON creator_profiles(user_id)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        creator_id TEXT NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        cover_image_url TEXT,
        price_cents INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS course_phases (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_phases_course_id_sort ON course_phases(course_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS phase_modules (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL REFERENCES course_phases(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL,
        is_preview INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_phase_modules_phase_id_sort ON phase_modules(phase_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS module_content_blocks (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
        block_type TEXT NOT NULL CHECK(block_type IN ('video', 'text', 'quiz')),
        sort_order INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_content_blocks_module_id_sort ON module_content_blocks(module_id, sort_order)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS course_enrollments (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        price_paid_cents INTEGER NOT NULL DEFAULT 0,
        enrolled_at TEXT DEFAULT (datetime('now')),
        UNIQUE(course_id, user_id)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id)`, args: [] },
    {
      sql: `CREATE TABLE IF NOT EXISTS module_completions (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES phase_modules(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        completed_at TEXT DEFAULT (datetime('now')),
        quiz_answers TEXT,
        UNIQUE(module_id, user_id)
      )`,
      args: [],
    },
    { sql: `CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON module_completions(user_id)`, args: [] },
    { sql: `CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON module_completions(module_id)`, args: [] },
  ]);

  return tables;
}

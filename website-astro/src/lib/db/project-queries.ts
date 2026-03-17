import { getDb } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';
  parent_issue_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'owner' | 'member' | 'viewer';
}

export interface ProjectField {
  id: string;
  project_id: string;
  name: string;
  field_type: 'text' | 'number' | 'date' | 'single_select' | 'multi_select' | 'user';
  options: string;
  position: number;
}

export interface ProjectIssueField {
  project_id: string;
  issue_id: string;
  field_id: string;
  value: string;
}

export interface IssueAssignee {
  issue_id: string;
  user_id: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string | null;
  body: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

export interface CommentReaction {
  comment_id: string;
  user_id: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Project CRUD
// ---------------------------------------------------------------------------

export async function listProjects(limit = 50, offset = 0) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT p.*,
            (SELECT COUNT(*) FROM project_issues pi WHERE pi.project_id = p.id) as issue_count,
            (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
          FROM projects p
          ORDER BY p.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return result.rows as unknown as (Project & { issue_count: number; member_count: number })[];
}

export async function getProject(id: string) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM projects WHERE id = ?',
    args: [id],
  });
  const project = result.rows[0] as unknown as Project | undefined;
  if (!project) return null;

  const [fieldsResult, membersResult] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM project_fields WHERE project_id = ? ORDER BY position', args: [id] }),
    db.execute({
      sql: `SELECT pm.*, u.name as user_name, u.email as user_email, u.image as user_image
            FROM project_members pm
            LEFT JOIN user u ON u.id = pm.user_id
            WHERE pm.project_id = ?`,
      args: [id],
    }),
  ]);

  return {
    ...project,
    fields: fieldsResult.rows as unknown as ProjectField[],
    members: membersResult.rows as unknown as (ProjectMember & { user_name: string; user_email: string; user_image: string | null })[],
  };
}

export async function createProject(name: string, description: string, createdBy: string) {
  const db = getDb();
  const id = generateId();
  await db.batch([
    {
      sql: `INSERT INTO projects (id, name, description, created_by) VALUES (?, ?, ?, ?)`,
      args: [id, name, description, createdBy],
    },
    {
      sql: `INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')`,
      args: [id, createdBy],
    },
  ]);
  return id;
}

export async function updateProject(id: string, name: string, description: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE projects SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [name, description, id],
  });
}

export async function deleteProject(id: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [id] });
}

// ---------------------------------------------------------------------------
// Project Members
// ---------------------------------------------------------------------------

export async function listProjectMembers(projectId: string) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT pm.*, u.name as user_name, u.email as user_email, u.image as user_image
          FROM project_members pm
          LEFT JOIN user u ON u.id = pm.user_id
          WHERE pm.project_id = ?`,
    args: [projectId],
  });
  return result.rows as unknown as (ProjectMember & { user_name: string; user_email: string; user_image: string | null })[];
}

export async function addProjectMember(projectId: string, userId: string, role: string) {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR REPLACE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)`,
    args: [projectId, userId, role],
  });
}

export async function removeProjectMember(projectId: string, userId: string) {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    args: [projectId, userId],
  });
}

// ---------------------------------------------------------------------------
// Project Fields
// ---------------------------------------------------------------------------

export async function listProjectFields(projectId: string) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM project_fields WHERE project_id = ? ORDER BY position',
    args: [projectId],
  });
  return result.rows as unknown as ProjectField[];
}

export async function createProjectField(projectId: string, name: string, fieldType: string, options: string = '[]', position: number = 0) {
  const db = getDb();
  const id = generateId();
  await db.execute({
    sql: `INSERT INTO project_fields (id, project_id, name, field_type, options, position) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, projectId, name, fieldType, options, position],
  });
  return id;
}

export async function updateProjectField(fieldId: string, name: string, options: string, position: number) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE project_fields SET name = ?, options = ?, position = ? WHERE id = ?`,
    args: [name, options, position, fieldId],
  });
}

export async function deleteProjectField(fieldId: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM project_fields WHERE id = ?', args: [fieldId] });
}

// ---------------------------------------------------------------------------
// Project Issues
// ---------------------------------------------------------------------------

export async function listProjectIssues(
  projectId: string,
  opts: { groupBy?: string; status?: string; limit?: number; offset?: number; search?: string } = {}
) {
  const db = getDb();
  const { status, limit = 200, offset = 0, search, groupBy } = opts;

  let where = 'WHERE pi.project_id = ?';
  const args: any[] = [projectId];

  if (status) {
    where += ' AND i.status = ?';
    args.push(status);
  }
  if (search) {
    where += ' AND i.title LIKE ?';
    args.push(`%${search}%`);
  }

  args.push(limit, offset);

  const result = await db.execute({
    sql: `SELECT i.*, pi.position,
            (SELECT GROUP_CONCAT(ia.user_id, ',') FROM issue_assignees ia WHERE ia.issue_id = i.id) as assignee_ids
          FROM project_issues pi
          JOIN issues i ON i.id = pi.issue_id
          ${where}
          ORDER BY pi.position, i.created_at
          LIMIT ? OFFSET ?`,
    args,
  });

  const issues = result.rows as unknown as (Issue & { position: number; assignee_ids: string | null })[];

  // Fetch field values for all issues
  const fieldValuesResult = await db.execute({
    sql: `SELECT pif.issue_id, pif.field_id, pif.value, pf.name as field_name
          FROM project_issue_fields pif
          JOIN project_fields pf ON pf.id = pif.field_id
          WHERE pif.project_id = ?`,
    args: [projectId],
  });
  const fieldValues = fieldValuesResult.rows as unknown as { issue_id: string; field_id: string; value: string; field_name: string }[];

  // Attach field values to issues
  const issuesWithFields = issues.map(issue => ({
    ...issue,
    fieldValues: fieldValues.filter(fv => fv.issue_id === issue.id),
  }));

  // Group if requested
  if (groupBy) {
    const grouped: Record<string, typeof issuesWithFields> = {};
    for (const issue of issuesWithFields) {
      const fieldValue = issue.fieldValues.find(fv => fv.field_id === groupBy);
      const key = fieldValue?.value || '(No value)';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    }
    return { grouped, issues: issuesWithFields };
  }

  return { issues: issuesWithFields };
}

export async function addIssueToProject(projectId: string, issueId: string, position: number = 0) {
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO project_issues (project_id, issue_id, position) VALUES (?, ?, ?)`,
    args: [projectId, issueId, position],
  });
}

export async function createIssueInProject(projectId: string, title: string, status: string = 'todo', parentIssueId: string | null, createdBy: string) {
  const db = getDb();
  const issueId = generateId();
  // Get next position
  const posResult = await db.execute({
    sql: 'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM project_issues WHERE project_id = ?',
    args: [projectId],
  });
  const nextPos = (posResult.rows[0] as any).next_pos ?? 0;

  await db.batch([
    {
      sql: `INSERT INTO issues (id, title, status, parent_issue_id, created_by) VALUES (?, ?, ?, ?, ?)`,
      args: [issueId, title, status, parentIssueId, createdBy],
    },
    {
      sql: `INSERT INTO project_issues (project_id, issue_id, position) VALUES (?, ?, ?)`,
      args: [projectId, issueId, nextPos],
    },
  ]);
  return issueId;
}

export async function removeIssueFromProject(projectId: string, issueId: string) {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM project_issues WHERE project_id = ? AND issue_id = ?',
    args: [projectId, issueId],
  });
}

export async function setIssueFieldValues(projectId: string, issueId: string, fieldValues: Record<string, string>) {
  const db = getDb();
  const statements = Object.entries(fieldValues).map(([fieldId, value]) => ({
    sql: `INSERT OR REPLACE INTO project_issue_fields (project_id, issue_id, field_id, value) VALUES (?, ?, ?, ?)`,
    args: [projectId, issueId, fieldId, value] as any[],
  }));
  if (statements.length > 0) {
    await db.batch(statements);
  }
}

// ---------------------------------------------------------------------------
// Issue CRUD
// ---------------------------------------------------------------------------

export async function listIssues(opts: { status?: string; assignee?: string; parentId?: string; search?: string; limit?: number; offset?: number } = {}) {
  const db = getDb();
  const { status, assignee, parentId, search, limit = 50, offset = 0 } = opts;

  let where = 'WHERE 1=1';
  const args: any[] = [];

  if (status) {
    where += ' AND i.status = ?';
    args.push(status);
  }
  if (parentId) {
    where += ' AND i.parent_issue_id = ?';
    args.push(parentId);
  }
  if (search) {
    where += ' AND i.title LIKE ?';
    args.push(`%${search}%`);
  }
  if (assignee) {
    where += ' AND EXISTS (SELECT 1 FROM issue_assignees ia WHERE ia.issue_id = i.id AND ia.user_id = ?)';
    args.push(assignee);
  }

  args.push(limit, offset);

  const result = await db.execute({
    sql: `SELECT i.* FROM issues i ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    args,
  });
  return result.rows as unknown as Issue[];
}

export async function createIssue(title: string, description: string = '', status: string = 'todo', parentIssueId: string | null = null, createdBy: string) {
  const db = getDb();
  const id = generateId();
  await db.execute({
    sql: `INSERT INTO issues (id, title, description, status, parent_issue_id, created_by) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, title, description, status, parentIssueId, createdBy],
  });
  return id;
}

export async function getIssue(id: string) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM issues WHERE id = ?',
    args: [id],
  });
  const issue = result.rows[0] as unknown as Issue | undefined;
  if (!issue) return null;

  const [assigneesResult, subIssuesResult, commentsResult, projectsResult] = await Promise.all([
    db.execute({
      sql: `SELECT ia.*, u.name as user_name, u.email as user_email, u.image as user_image
            FROM issue_assignees ia
            LEFT JOIN user u ON u.id = ia.user_id
            WHERE ia.issue_id = ?`,
      args: [id],
    }),
    db.execute({
      sql: 'SELECT * FROM issues WHERE parent_issue_id = ? ORDER BY created_at',
      args: [id],
    }),
    db.execute({
      sql: `SELECT c.*, u.name as author_name, u.email as author_email, u.image as author_image
            FROM issue_comments c
            LEFT JOIN user u ON u.id = c.user_id
            WHERE c.issue_id = ?
            ORDER BY c.pinned DESC, c.created_at ASC`,
      args: [id],
    }),
    db.execute({
      sql: `SELECT p.* FROM projects p
            JOIN project_issues pi ON pi.project_id = p.id
            WHERE pi.issue_id = ?`,
      args: [id],
    }),
  ]);

  // Fetch reactions for all comments
  const commentIds = (commentsResult.rows as any[]).map(c => c.id);
  let reactions: any[] = [];
  if (commentIds.length > 0) {
    const placeholders = commentIds.map(() => '?').join(',');
    const reactionsResult = await db.execute({
      sql: `SELECT * FROM comment_reactions WHERE comment_id IN (${placeholders})`,
      args: commentIds,
    });
    reactions = reactionsResult.rows as any[];
  }

  const comments = (commentsResult.rows as any[]).map(c => ({
    ...c,
    reactions: reactions.filter(r => r.comment_id === c.id),
  }));

  return {
    ...issue,
    assignees: assigneesResult.rows,
    subIssues: subIssuesResult.rows as unknown as Issue[],
    comments,
    projects: projectsResult.rows as unknown as Project[],
  };
}

export async function updateIssue(id: string, updates: { title?: string; description?: string; status?: string; parentIssueId?: string | null }) {
  const db = getDb();
  const sets: string[] = [];
  const args: any[] = [];

  if (updates.title !== undefined) {
    sets.push('title = ?');
    args.push(updates.title);
  }
  if (updates.description !== undefined) {
    sets.push('description = ?');
    args.push(updates.description);
  }
  if (updates.status !== undefined) {
    sets.push('status = ?');
    args.push(updates.status);
  }
  if (updates.parentIssueId !== undefined) {
    sets.push('parent_issue_id = ?');
    args.push(updates.parentIssueId);
  }

  if (sets.length === 0) return;

  sets.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE issues SET ${sets.join(', ')} WHERE id = ?`,
    args,
  });
}

export async function deleteIssue(id: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM issues WHERE id = ?', args: [id] });
}

// ---------------------------------------------------------------------------
// Issue Assignees
// ---------------------------------------------------------------------------

export async function addAssignee(issueId: string, userId: string) {
  const db = getDb();
  await db.execute({
    sql: 'INSERT OR IGNORE INTO issue_assignees (issue_id, user_id) VALUES (?, ?)',
    args: [issueId, userId],
  });
}

export async function removeAssignee(issueId: string, userId: string) {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM issue_assignees WHERE issue_id = ? AND user_id = ?',
    args: [issueId, userId],
  });
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function listComments(issueId: string) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*, u.name as author_name, u.email as author_email, u.image as author_image
          FROM issue_comments c
          LEFT JOIN user u ON u.id = c.user_id
          WHERE c.issue_id = ?
          ORDER BY c.pinned DESC, c.created_at ASC`,
    args: [issueId],
  });

  const commentIds = (result.rows as any[]).map(c => c.id);
  let reactions: any[] = [];
  if (commentIds.length > 0) {
    const placeholders = commentIds.map(() => '?').join(',');
    const reactionsResult = await db.execute({
      sql: `SELECT * FROM comment_reactions WHERE comment_id IN (${placeholders})`,
      args: commentIds,
    });
    reactions = reactionsResult.rows as any[];
  }

  return (result.rows as any[]).map(c => ({
    ...c,
    reactions: reactions.filter(r => r.comment_id === c.id),
  }));
}

export async function createComment(issueId: string, userId: string, body: string) {
  const db = getDb();
  const id = generateId();
  await db.execute({
    sql: 'INSERT INTO issue_comments (id, issue_id, user_id, body) VALUES (?, ?, ?, ?)',
    args: [id, issueId, userId, body],
  });
  return id;
}

export async function updateComment(id: string, body: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE issue_comments SET body = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [body, id],
  });
}

export async function deleteComment(id: string) {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM issue_comments WHERE id = ?', args: [id] });
}

export async function togglePin(id: string) {
  const db = getDb();
  await db.execute({
    sql: `UPDATE issue_comments SET pinned = CASE WHEN pinned = 0 THEN 1 ELSE 0 END, updated_at = datetime('now') WHERE id = ?`,
    args: [id],
  });
}

export async function addReaction(commentId: string, userId: string, emoji: string) {
  const db = getDb();
  await db.execute({
    sql: 'INSERT OR IGNORE INTO comment_reactions (comment_id, user_id, emoji) VALUES (?, ?, ?)',
    args: [commentId, userId, emoji],
  });
}

export async function removeReaction(commentId: string, userId: string, emoji: string) {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ?',
    args: [commentId, userId, emoji],
  });
}

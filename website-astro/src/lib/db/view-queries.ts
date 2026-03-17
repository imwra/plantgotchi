import { getDb } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// View CRUD
// ---------------------------------------------------------------------------

export async function getProjectViews(projectId: string, userId: string): Promise<ProjectView[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM project_views
          WHERE project_id = ? AND user_id = ?
          ORDER BY is_default DESC, created_at ASC`,
    args: [projectId, userId],
  });
  return result.rows as unknown as ProjectView[];
}

export async function createProjectView(view: {
  projectId: string;
  userId: string;
  name: string;
  viewType: 'table' | 'board';
  config: string;
  isDefault?: number;
}): Promise<ProjectView> {
  const db = getDb();
  const id = generateId();
  const isDefault = view.isDefault ?? 0;

  await db.execute({
    sql: `INSERT INTO project_views (id, project_id, user_id, name, view_type, config, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, view.projectId, view.userId, view.name, view.viewType, view.config, isDefault],
  });

  // Return the created view
  const result = await db.execute({
    sql: 'SELECT * FROM project_views WHERE id = ?',
    args: [id],
  });
  return result.rows[0] as unknown as ProjectView;
}

export async function updateProjectView(
  viewId: string,
  userId: string,
  updates: { name?: string; config?: string; isDefault?: number }
): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: any[] = [];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    args.push(updates.name);
  }
  if (updates.config !== undefined) {
    sets.push('config = ?');
    args.push(updates.config);
  }
  if (updates.isDefault !== undefined) {
    sets.push('is_default = ?');
    args.push(updates.isDefault);
  }

  if (sets.length === 0) return;

  args.push(viewId, userId);

  await db.execute({
    sql: `UPDATE project_views SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    args,
  });
}

export async function deleteProjectView(viewId: string, userId: string): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM project_views WHERE id = ? AND user_id = ?',
    args: [viewId, userId],
  });
}

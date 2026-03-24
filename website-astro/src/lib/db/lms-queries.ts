import { getDb } from './client';

// ── Types ──

export interface CreatorProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  price_cents: number;
  currency: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CoursePhase {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PhaseModule {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_preview: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleContentBlock {
  id: string;
  module_id: string;
  block_type: 'video' | 'text' | 'quiz';
  sort_order: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  price_paid_cents: number;
  enrolled_at: string;
}

export interface ModuleCompletion {
  id: string;
  module_id: string;
  user_id: string;
  completed_at: string;
  quiz_answers: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// ── Helpers ──

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function uniqueSlug(baseSlug: string): Promise<string> {
  const db = getDb();
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await db.execute({ sql: 'SELECT id FROM courses WHERE slug = ?', args: [slug] });
    if (existing.rows.length === 0) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

// ── Creator Profile Queries ──

export async function getCreatorByUserId(userId: string): Promise<CreatorProfile | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM creator_profiles WHERE user_id = ?', args: [userId] });
  return (result.rows[0] as unknown as CreatorProfile) || null;
}

export async function getCreatorById(id: string): Promise<CreatorProfile | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM creator_profiles WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as CreatorProfile) || null;
}

export async function createCreatorProfile(userId: string, displayName: string, bio?: string): Promise<CreatorProfile> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO creator_profiles (id, user_id, display_name, bio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, displayName, bio || null, now, now],
  });
  return { id, user_id: userId, display_name: displayName, bio: bio || null, avatar_url: null, created_at: now, updated_at: now };
}

export async function updateCreatorProfile(id: string, updates: { display_name?: string; bio?: string; avatar_url?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  if (updates.display_name !== undefined) { sets.push('display_name = ?'); args.push(updates.display_name); }
  if (updates.bio !== undefined) { sets.push('bio = ?'); args.push(updates.bio); }
  if (updates.avatar_url !== undefined) { sets.push('avatar_url = ?'); args.push(updates.avatar_url); }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE creator_profiles SET ${sets.join(', ')} WHERE id = ?`, args });
}

// ── Course Queries ──

export async function listPublishedCourses(limit = 50, offset = 0): Promise<(Course & { creator_name: string; enrollment_count: number })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*, cp.display_name as creator_name,
            (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
          FROM courses c
          JOIN creator_profiles cp ON cp.id = c.creator_id
          WHERE c.status = 'published'
          ORDER BY c.created_at DESC
          LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return result.rows as unknown as (Course & { creator_name: string; enrollment_count: number })[];
}

export async function listCreatorCourses(creatorId: string): Promise<(Course & { enrollment_count: number })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT c.*,
            (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count
          FROM courses c
          WHERE c.creator_id = ?
          ORDER BY c.created_at DESC`,
    args: [creatorId],
  });
  return result.rows as unknown as (Course & { enrollment_count: number })[];
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM courses WHERE slug = ?', args: [slug] });
  return (result.rows[0] as unknown as Course) || null;
}

export async function createCourse(creatorId: string, title: string, description?: string, priceCents = 0, currency = 'USD'): Promise<Course> {
  const db = getDb();
  const id = crypto.randomUUID();
  const slug = await uniqueSlug(generateSlug(title));
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO courses (id, creator_id, title, slug, description, price_cents, currency, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
    args: [id, creatorId, title, slug, description || null, priceCents, currency, now, now],
  });
  return { id, creator_id: creatorId, title, slug, description: description || null, cover_image_url: null, price_cents: priceCents, currency, status: 'draft', created_at: now, updated_at: now };
}

export async function updateCourse(id: string, updates: { title?: string; description?: string; cover_image_url?: string; price_cents?: number; currency?: string; status?: string; slug?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE courses SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteCourse(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: `UPDATE courses SET status = 'archived', updated_at = datetime('now') WHERE id = ?`, args: [id] });
}

// ── Phase Queries ──

export async function listPhases(courseId: string): Promise<CoursePhase[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM course_phases WHERE course_id = ? ORDER BY sort_order', args: [courseId] });
  return result.rows as unknown as CoursePhase[];
}

export async function createPhase(courseId: string, title: string, description?: string): Promise<CoursePhase> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM course_phases WHERE course_id = ?', args: [courseId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO course_phases (id, course_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, courseId, title, description || null, sortOrder, now, now],
  });
  return { id, course_id: courseId, title, description: description || null, sort_order: sortOrder, created_at: now, updated_at: now };
}

export async function updatePhase(id: string, updates: { title?: string; description?: string; sort_order?: number }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE course_phases SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deletePhase(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM course_phases WHERE id = ?', args: [id] });
}

// ── Module Queries ──

export async function listModules(phaseId: string): Promise<PhaseModule[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM phase_modules WHERE phase_id = ? ORDER BY sort_order', args: [phaseId] });
  return result.rows as unknown as PhaseModule[];
}

export async function getModule(id: string): Promise<PhaseModule | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM phase_modules WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as PhaseModule) || null;
}

export async function createModule(phaseId: string, title: string, description?: string, isPreview = false): Promise<PhaseModule> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM phase_modules WHERE phase_id = ?', args: [phaseId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO phase_modules (id, phase_id, title, description, sort_order, is_preview, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, phaseId, title, description || null, sortOrder, isPreview ? 1 : 0, now, now],
  });
  return { id, phase_id: phaseId, title, description: description || null, sort_order: sortOrder, is_preview: isPreview ? 1 : 0, created_at: now, updated_at: now };
}

export async function updateModule(id: string, updates: { title?: string; description?: string; sort_order?: number; is_preview?: number }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE phase_modules SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteModule(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM phase_modules WHERE id = ?', args: [id] });
}

// ── Content Block Queries ──

export async function listContentBlocks(moduleId: string): Promise<ModuleContentBlock[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM module_content_blocks WHERE module_id = ? ORDER BY sort_order', args: [moduleId] });
  return result.rows as unknown as ModuleContentBlock[];
}

export async function createContentBlock(moduleId: string, blockType: 'video' | 'text' | 'quiz', content: string): Promise<ModuleContentBlock> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = await db.execute({ sql: 'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM module_content_blocks WHERE module_id = ?', args: [moduleId] });
  const sortOrder = ((maxOrder.rows[0] as unknown as { max_order: number }).max_order) + 1;
  await db.execute({
    sql: `INSERT INTO module_content_blocks (id, module_id, block_type, sort_order, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, moduleId, blockType, sortOrder, content, now, now],
  });
  return { id, module_id: moduleId, block_type: blockType, sort_order: sortOrder, content, created_at: now, updated_at: now };
}

export async function updateContentBlock(id: string, updates: { block_type?: string; sort_order?: number; content?: string }): Promise<void> {
  const db = getDb();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) { sets.push(`${key} = ?`); args.push(value); }
  }
  if (sets.length === 0) return;
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE module_content_blocks SET ${sets.join(', ')} WHERE id = ?`, args });
}

export async function deleteContentBlock(id: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM module_content_blocks WHERE id = ?', args: [id] });
}

// ── Enrollment Queries ──

export async function enrollUser(courseId: string, userId: string, pricePaidCents = 0): Promise<CourseEnrollment> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO course_enrollments (id, course_id, user_id, price_paid_cents, enrolled_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, courseId, userId, pricePaidCents, now],
  });
  return { id, course_id: courseId, user_id: userId, price_paid_cents: pricePaidCents, enrolled_at: now };
}

export async function getEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM course_enrollments WHERE course_id = ? AND user_id = ?', args: [courseId, userId] });
  return (result.rows[0] as unknown as CourseEnrollment) || null;
}

export async function listUserEnrollments(userId: string): Promise<(CourseEnrollment & { title: string; slug: string; cover_image_url: string | null; creator_name: string })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT ce.*, c.title, c.slug, c.cover_image_url, cp.display_name as creator_name
          FROM course_enrollments ce
          JOIN courses c ON c.id = ce.course_id
          JOIN creator_profiles cp ON cp.id = c.creator_id
          WHERE ce.user_id = ?
          ORDER BY ce.enrolled_at DESC`,
    args: [userId],
  });
  return result.rows as unknown as (CourseEnrollment & { title: string; slug: string; cover_image_url: string | null; creator_name: string })[];
}

// ── Completion / Progress Queries ──

export async function completeModule(moduleId: string, userId: string, quizAnswers?: string): Promise<ModuleCompletion> {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT OR IGNORE INTO module_completions (id, module_id, user_id, completed_at, quiz_answers) VALUES (?, ?, ?, ?, ?)`,
    args: [id, moduleId, userId, now, quizAnswers || null],
  });
  const result = await db.execute({ sql: 'SELECT * FROM module_completions WHERE module_id = ? AND user_id = ?', args: [moduleId, userId] });
  return result.rows[0] as unknown as ModuleCompletion;
}

export interface CourseProgress {
  total_modules: number;
  completed_modules: number;
  phases: { phase_id: string; title: string; total: number; completed: number }[];
}

export async function getCourseProgress(courseId: string, userId: string): Promise<CourseProgress> {
  const db = getDb();
  const phases = await db.execute({ sql: 'SELECT * FROM course_phases WHERE course_id = ? ORDER BY sort_order', args: [courseId] });
  const phaseRows = phases.rows as unknown as CoursePhase[];

  let totalModules = 0;
  let completedModules = 0;
  const phaseProgress: CourseProgress['phases'] = [];

  for (const phase of phaseRows) {
    const modules = await db.execute({ sql: 'SELECT id FROM phase_modules WHERE phase_id = ?', args: [phase.id] });
    const moduleIds = (modules.rows as unknown as { id: string }[]).map(m => m.id);
    const total = moduleIds.length;
    let completed = 0;

    if (moduleIds.length > 0) {
      const placeholders = moduleIds.map(() => '?').join(',');
      const completions = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM module_completions WHERE user_id = ? AND module_id IN (${placeholders})`,
        args: [userId, ...moduleIds],
      });
      completed = (completions.rows[0] as unknown as { cnt: number }).cnt;
    }

    totalModules += total;
    completedModules += completed;
    phaseProgress.push({ phase_id: phase.id, title: phase.title, total, completed });
  }

  return { total_modules: totalModules, completed_modules: completedModules, phases: phaseProgress };
}

// ── Course detail with full tree ──

export async function getCourseWithContent(slug: string): Promise<(Course & { creator_name: string; phases: (CoursePhase & { modules: (PhaseModule & { blocks: ModuleContentBlock[] })[] })[] }) | null> {
  const course = await getCourseBySlug(slug);
  if (!course) return null;

  const db = getDb();
  const creatorResult = await db.execute({ sql: 'SELECT display_name FROM creator_profiles WHERE id = ?', args: [course.creator_id] });
  const creatorName = (creatorResult.rows[0] as unknown as { display_name: string })?.display_name || 'Unknown';

  const phaseRows = await listPhases(course.id);
  const phases = await Promise.all(phaseRows.map(async (phase) => {
    const moduleRows = await listModules(phase.id);
    const modules = await Promise.all(moduleRows.map(async (mod) => {
      const blocks = await listContentBlocks(mod.id);
      return { ...mod, blocks };
    }));
    return { ...phase, modules };
  }));

  return { ...course, creator_name: creatorName, phases };
}

// ── Tag Queries ──

export async function listTags(): Promise<Tag[]> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM tags ORDER BY name', args: [] });
  return result.rows as unknown as Tag[];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT * FROM tags WHERE slug = ?', args: [slug] });
  return (result.rows[0] as unknown as Tag) || null;
}

export async function createTag(name: string): Promise<Tag> {
  const db = getDb();
  const id = crypto.randomUUID();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  await db.execute({ sql: 'INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)', args: [id, name, slug] });
  return { id, name, slug };
}

export async function addTagToCourse(courseId: string, tagId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'INSERT OR IGNORE INTO course_tags (course_id, tag_id) VALUES (?, ?)', args: [courseId, tagId] });
}

export async function removeTagFromCourse(courseId: string, tagId: string): Promise<void> {
  const db = getDb();
  await db.execute({ sql: 'DELETE FROM course_tags WHERE course_id = ? AND tag_id = ?', args: [courseId, tagId] });
}

export async function getCourseTags(courseId: string): Promise<Tag[]> {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT t.* FROM tags t JOIN course_tags ct ON t.id = ct.tag_id WHERE ct.course_id = ? ORDER BY t.name',
    args: [courseId],
  });
  return result.rows as unknown as Tag[];
}

export async function searchCourses(
  options: {
    query?: string;
    tagSlugs?: string[];
    sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
    limit?: number;
    offset?: number;
  }
): Promise<(Course & { creator_name: string; enrollment_count: number; tags: string[] })[]> {
  const db = getDb();
  const { query, tagSlugs, sort = 'newest', limit = 50, offset = 0 } = options;
  const args: unknown[] = [];
  let where = `c.status = 'published'`;

  if (query && query.trim()) {
    where += ` AND c.rowid IN (SELECT rowid FROM courses_fts WHERE courses_fts MATCH ?)`;
    args.push(query.trim() + '*');
  }

  if (tagSlugs && tagSlugs.length > 0) {
    const placeholders = tagSlugs.map(() => '?').join(',');
    where += ` AND c.id IN (SELECT ct.course_id FROM course_tags ct JOIN tags t ON ct.tag_id = t.id WHERE t.slug IN (${placeholders}))`;
    args.push(...tagSlugs);
  }

  const orderBy = {
    newest: 'c.created_at DESC',
    popular: 'enrollment_count DESC',
    price_asc: 'c.price_cents ASC',
    price_desc: 'c.price_cents DESC',
  }[sort];

  args.push(limit, offset);

  const result = await db.execute({
    sql: `SELECT c.*, cp.display_name as creator_name,
      (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrollment_count,
      (SELECT GROUP_CONCAT(t.slug, ',') FROM course_tags ct2 JOIN tags t ON ct2.tag_id = t.id WHERE ct2.course_id = c.id) as tag_slugs
    FROM courses c
    JOIN creator_profiles cp ON c.creator_id = cp.id
    WHERE ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`,
    args,
  });

  return (result.rows as unknown as (Course & { creator_name: string; enrollment_count: number; tag_slugs: string | null })[]).map(r => ({
    ...r,
    tags: r.tag_slugs ? r.tag_slugs.split(',') : [],
  }));
}

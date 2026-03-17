import { getDb } from './client';

// ---------------------------------------------------------------------------
// Initial data — matches AdminPanel.tsx INITIAL_PHASES
// ---------------------------------------------------------------------------

interface TaskSeed {
  title: string;
  done: boolean;
  critical: boolean;
}

interface PhaseSeed {
  title: string;
  tasks: TaskSeed[];
}

const PHASES: PhaseSeed[] = [
  {
    title: 'SETUP',
    tasks: [
      { title: 'Create JLCPCB account', done: false, critical: false },
      { title: 'Create AliExpress account', done: false, critical: false },
      { title: 'Install KiCad 8+', done: false, critical: false },
      { title: 'Install STL viewer (PrusaSlicer or similar)', done: false, critical: false },
      { title: 'Decide shipping address for prototype orders', done: false, critical: false },
      { title: 'Set up project GitHub repository', done: false, critical: false },
    ],
  },
  {
    title: 'PCB DESIGN',
    tasks: [
      { title: 'Clone w-parasite KiCad project', done: false, critical: true },
      { title: 'Analyze existing schematic and PCB layout', done: false, critical: true },
      { title: 'Modify schematic: add WS2812B RGB LED circuit', done: false, critical: true },
      { title: 'Modify schematic: add EC/fertility measurement circuit', done: false, critical: true },
      { title: 'Route PCB (2-layer FR4, 1.6mm)', done: false, critical: true },
      { title: 'Generate JLCPCB-ready files', done: false, critical: true },
      { title: 'Order 5x prototype PCBs from JLCPCB', done: false, critical: false },
      { title: 'Design review with spec', done: true, critical: false },
    ],
  },
  {
    title: '3D CASE DESIGN',
    tasks: [
      { title: 'Write CadQuery script for front shell', done: false, critical: false },
      { title: 'Write CadQuery script for back shell', done: false, critical: false },
      { title: 'Export STL files', done: false, critical: false },
      { title: 'Order 5x 3D printed cases', done: false, critical: false },
    ],
  },
  {
    title: 'ESP32 FIRMWARE',
    tasks: [
      { title: 'Set up PlatformIO project', done: false, critical: true },
      { title: 'Implement AP provisioning', done: false, critical: true },
      { title: 'Implement sensor reading', done: false, critical: true },
      { title: 'Implement MQTT client', done: false, critical: true },
      { title: 'Implement deep sleep', done: false, critical: false },
      { title: 'Flash and test on ESP32 dev board', done: false, critical: true },
    ],
  },
];

function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Seed the "Launching Plantgotchi" project with all initial issues.
 * Idempotent: checks if the project already exists before creating.
 */
export async function seedLaunchProject(adminUserId: string): Promise<void> {
  const db = getDb();

  // Check if already seeded
  const existing = await db.execute({
    sql: "SELECT id FROM projects WHERE name = 'Launching Plantgotchi' LIMIT 1",
    args: [],
  });
  if (existing.rows.length > 0) {
    return; // Already seeded
  }

  const projectId = generateId();
  const phaseFieldId = generateId();
  const priorityFieldId = generateId();

  // Create project + add admin as owner + create fields
  await db.batch([
    {
      sql: `INSERT INTO projects (id, name, description, created_by) VALUES (?, 'Launching Plantgotchi', 'Hardware + firmware launch tracker for the Plantgotchi sensor project', ?)`,
      args: [projectId, adminUserId],
    },
    {
      sql: `INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')`,
      args: [projectId, adminUserId],
    },
    {
      sql: `INSERT INTO project_fields (id, project_id, name, field_type, options, position) VALUES (?, ?, 'Phase', 'single_select', ?, 0)`,
      args: [phaseFieldId, projectId, JSON.stringify(['SETUP', 'PCB DESIGN', '3D CASE DESIGN', 'ESP32 FIRMWARE'])],
    },
    {
      sql: `INSERT INTO project_fields (id, project_id, name, field_type, options, position) VALUES (?, ?, 'Priority', 'single_select', ?, 1)`,
      args: [priorityFieldId, projectId, JSON.stringify(['Critical', 'High', 'Normal', 'Low'])],
    },
  ]);

  // Create issues and link them
  let position = 0;
  for (const phase of PHASES) {
    for (const task of phase.tasks) {
      const issueId = generateId();
      const status = task.done ? 'done' : 'todo';
      const priority = task.critical ? 'Critical' : 'Normal';

      await db.batch([
        {
          sql: `INSERT INTO issues (id, title, status, created_by) VALUES (?, ?, ?, ?)`,
          args: [issueId, task.title, status, adminUserId],
        },
        {
          sql: `INSERT INTO project_issues (project_id, issue_id, position) VALUES (?, ?, ?)`,
          args: [projectId, issueId, position],
        },
        {
          sql: `INSERT INTO project_issue_fields (project_id, issue_id, field_id, value) VALUES (?, ?, ?, ?)`,
          args: [projectId, issueId, phaseFieldId, phase.title],
        },
        {
          sql: `INSERT INTO project_issue_fields (project_id, issue_id, field_id, value) VALUES (?, ?, ?, ?)`,
          args: [projectId, issueId, priorityFieldId, priority],
        },
        {
          sql: `INSERT OR IGNORE INTO issue_assignees (issue_id, user_id) VALUES (?, ?)`,
          args: [issueId, adminUserId],
        },
      ]);
      position++;
    }
  }
}

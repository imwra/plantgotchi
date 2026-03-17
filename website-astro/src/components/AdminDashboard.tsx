import { useState, useEffect, useMemo, useCallback } from "react";
import SiteNav from "./SiteNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  notes: string;
  critical: boolean;
}

interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tasks: Task[];
  collapsed: boolean;
  estimatedWeeks: number;
  estimatedCost: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeId = (phase: number, idx: number) => `p${phase}-t${idx}`;

const buildPhase = (
  number: number,
  title: string,
  subtitle: string,
  tasks: Array<[string, boolean, boolean?]>, // [title, done, critical?]
  estimatedWeeks: number,
  estimatedCost: number | null = null,
): Phase => ({
  id: `phase-${number}`,
  number,
  title,
  subtitle,
  collapsed: true,
  estimatedWeeks,
  estimatedCost,
  tasks: tasks.map(([t, done, critical], i) => ({
    id: makeId(number, i),
    title: t,
    status: done ? "done" : "todo",
    notes: "",
    critical: critical ?? false,
  })),
});

// ---------------------------------------------------------------------------
// Initial data
// ---------------------------------------------------------------------------

const INITIAL_PHASES: Phase[] = [
  buildPhase(0, "SETUP", "Human Tasks", [
    ["Create JLCPCB account", false],
    ["Create AliExpress account", false],
    ["Install KiCad 8+", false],
    ["Install STL viewer (PrusaSlicer or similar)", false],
    ["Decide shipping address for prototype orders", false],
    ["Set up project GitHub repository", false],
  ], 1),

  buildPhase(1, "PCB DESIGN", "Hardware", [
    ["Clone w-parasite KiCad project (github.com/rbaron/b-parasite)", false, true],
    ["Analyze existing schematic and PCB layout", false, true],
    ["Modify schematic: add WS2812B RGB LED circuit", false, true],
    ["Modify schematic: add EC/fertility measurement circuit", false, true],
    ["Modify schematic: add phototransistor (TEPT5700) light sensor", false, true],
    ["Modify schematic: add ESP32-WROOM-32D for Solo variant", false, true],
    ["Modify schematic: add TP4056 USB-C charging circuit", false, true],
    ["Reshape PCB to Apple Watch form factor (34mm x 40mm body + 80mm probe)", false, true],
    ["Add soil moisture capacitive traces (3mm wide, 60-70mm long, 2mm gap)", false],
    ["Add EC electrode pads (ENIG, no coating, 3mm x 8mm)", false],
    ["Route PCB (2-layer FR4, 1.6mm, single-side assembly)", false, true],
    ["Generate JLCPCB-ready files (Gerber, BOM, CPL)", false, true],
    ["Order 5x prototype PCBs from JLCPCB ($80-120)", false],
    ["Design review with spec (COMPLETED - specs finalized)", true],
  ], 4, 120),

  buildPhase(2, "3D CASE DESIGN", "Mechanical", [
    ["Write CadQuery Python script for Solo sensor front shell", false],
    ["Write CadQuery Python script for Solo sensor back shell", false],
    ["Add LED window, embossed \"PLANTGOTCHI\" text, grid texture", false],
    ["Add battery pocket, vent grille, USB-C cutout, snap tabs", false],
    ["Export STL files for all 4 device form factors", false],
    ["Order 5x 3D printed cases from JLCPCB ($1.80/unit)", false],
  ], 2, 9),

  buildPhase(3, "ESP32 FIRMWARE", "Software", [
    ["Set up PlatformIO project (ESP-IDF + Arduino)", false, true],
    ["Implement AP provisioning (SSID \"Plantgotchi-XXXX\", captive portal)", false, true],
    ["Implement sensor reading (moisture, EC, temp/humidity, light, battery)", false, true],
    ["Implement MQTT client (connect, publish sensor data, subscribe config)", false, true],
    ["Implement 16-state LED state machine with priority system", false],
    ["Implement deep sleep with configurable interval (15min - 12hr)", false],
    ["Implement NVS storage for WiFi credentials and config", false],
    ["Implement OTA firmware update via MQTT trigger", false],
    ["Implement Parent mode (BLE scan, relay child data)", false],
    ["Write unit tests for sensor calibration and LED states", false],
    ["Flash and test on ESP32 dev board (with simulated sensors)", false, true],
  ], 4, 0),

  buildPhase(4, "nRF52832 FIRMWARE", "BLE Child", [
    ["Set up Zephyr or nRF5 SDK project", false],
    ["Implement BLE advertising payload (16 bytes: ID, moisture, EC, temp, humidity, light, battery)", false],
    ["Implement deep sleep cycle (wake -> read -> advertise 2s -> sleep)", false],
    ["Target <5uA sleep current, <200ms active time", false],
    ["Test on nRF52 DK or prototype board", false],
  ], 3, 0),

  buildPhase(5, "WEB APPLICATION", "Full Stack", [
    ["Set up PostgreSQL database with schema (users, plants, sensor_readings, care_logs, plant_photos)", false, true],
    ["Set up database migrations", false],
    ["Build backend API (FastAPI or Express) with MQTT listener", false, true],
    ["Implement auth (Supabase Auth or NextAuth, email + Google OAuth)", false, true],
    ["Build Next.js frontend with Tamagotchi pixel-art UI", false, true],
    ["Implement sensor pairing flow (AP mode connection wizard)", false],
    ["Implement real-time dashboard with animated plant sprites", false],
    ["Implement plant detail view (charts, photos, care log)", false],
    ["Implement push notifications (Firebase, moisture warnings, battery alerts)", false],
    ["Implement PlantCam photo timeline and time-lapse viewer", false],
    ["Deploy frontend to Vercel, backend to Railway/Fly.io", false],
    ["Set up MQTT broker (Mosquitto or HiveMQ Cloud)", false],
  ], 6, 0),

  buildPhase(6, "PLANTCAM FIRMWARE", "ESP32-S3", [
    ["Set up ESP-IDF project for ESP32-S3-WROOM-1", false],
    ["Implement OV5640 camera capture (1-4 photos/day schedule)", false],
    ["Implement WiFi upload to S3/R2", false],
    ["Implement MicroSD backup", false],
    ["Implement deep sleep (target 4-6 month battery at 4 photos/day)", false],
    ["Implement on-demand photo via MQTT command", false],
  ], 3, 0),

  buildPhase(7, "PLANTCAM PRO SOFTWARE", "RPi", [
    ["Set up Raspberry Pi OS Lite image", false],
    ["Implement Python capture script with libcamera", false],
    ["Deploy IMX500 AI model for plant disease detection", false],
    ["Implement BLE scanner for child sensors (bleak library)", false],
    ["Implement MQTT client for data relay", false],
    ["Build local web UI for direct access", false],
    ["Implement local time-lapse generation (ffmpeg)", false],
    ["Create systemd services for all daemons", false],
    ["Implement OTA update mechanism", false],
  ], 4, 0),

  buildPhase(8, "ASSEMBLY & TESTING", "Integration", [
    ["Receive JLCPCB PCBs and 3D cases (7-14 day wait)", false],
    ["Order LiPo batteries from AliExpress (602030, 300-500mAh)", false],
    ["Assemble 5 prototype Solo sensors (plug battery, flash firmware, snap case)", false],
    ["Calibrate soil moisture sensor (dry air = 0%, water = 100%)", false],
    ["Calibrate EC sensor with reference solutions", false],
    ["Full integration test (sensor -> MQTT -> cloud -> app)", false, true],
    ["Waterproofing test (probe section only)", false],
    ["Battery life test (measure actual deep sleep current)", false],
  ], 3, 50),

  buildPhase(9, "BETA & LAUNCH", "Go to Market", [
    ["Recruit 5-10 beta testers (friends, plant community)", false],
    ["Distribute beta units with feedback form", false],
    ["2-4 week beta testing period", false],
    ["Iterate on firmware, app, and case based on feedback", false],
    ["Order first production batch (100 BLE, 50 Solo, 20 PlantCam, 10 Pro)", false, true],
    ["Set up Shopify store or direct sales page", false],
    ["Create product photography and unboxing content", false],
    ["Launch on Product Hunt", false],
    ["Post to plant communities (Reddit r/houseplants, r/gardening, Facebook groups)", false],
    ["Submit to tech blogs and review sites", false],
  ], 6, 2024),

  buildPhase(10, "BUSINESS & LEGAL", "Operations", [
    ["Register business entity (Brazil)", false],
    ["Set up payment processing (Stripe for USD, local for BRL)", false],
    ["Create terms of service and privacy policy", false],
    ["Ensure CC BY-SA 4.0 compliance for w-parasite fork", false],
    ["File trademark for \"Plantgotchi\" brand", false],
    ["Set up customer support email/chat", false],
    ["Create user documentation and setup guides", false],
  ], 3, 0),
];

const MILESTONES = [
  { label: "PCB ordered", target: "Week 5" },
  { label: "First prototype assembled", target: "Week 14" },
  { label: "Beta launch", target: "Week 22" },
  { label: "Production order", target: "Week 28" },
  { label: "Public launch", target: "Week 30" },
];

const STORAGE_KEY = "plantgotchi-admin-v1";

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-text-mid/20 text-text-mid",
  "in-progress": "bg-water/20 text-water",
  done: "bg-primary/20 text-primary-dark",
  blocked: "bg-danger/20 text-danger",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  done: "Done",
  blocked: "Blocked",
};

const FILTER_OPTIONS: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AdminDashboardProps {
  embedded?: boolean;
}

export default function AdminDashboard({ embedded = false }: AdminDashboardProps) {
  const [phases, setPhases] = useState<Phase[]>(INITIAL_PHASES);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Phase[];
        // Merge stored state with initial data to pick up any new tasks
        const merged = INITIAL_PHASES.map((initial) => {
          const saved = parsed.find((p) => p.id === initial.id);
          if (!saved) return initial;
          return {
            ...initial,
            collapsed: saved.collapsed,
            tasks: initial.tasks.map((t) => {
              const savedTask = saved.tasks.find((st) => st.id === t.id);
              if (!savedTask) return t;
              return { ...t, status: savedTask.status, notes: savedTask.notes };
            }),
          };
        });
        setPhases(merged);
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phases));
  }, [phases, loaded]);

  // ---------------------------------------------------------------------------
  // Computed stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const all: Task[] = phases.flatMap((p) => p.tasks);
    const total = all.length;
    const done = all.filter((t) => t.status === "done").length;
    const inProgress = all.filter((t) => t.status === "in-progress").length;
    const blocked = all.filter((t) => t.status === "blocked").length;
    const todo = all.filter((t) => t.status === "todo").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, blocked, todo, pct };
  }, [phases]);

  const phaseStats = useCallback(
    (phase: Phase) => {
      const total = phase.tasks.length;
      const done = phase.tasks.filter((t) => t.status === "done").length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { total, done, pct };
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Filtered tasks helper
  // ---------------------------------------------------------------------------

  const filteredTasks = useCallback(
    (tasks: Task[]) => {
      let out = tasks;
      if (filter !== "all") {
        out = out.filter((t) => t.status === filter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        out = out.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.notes.toLowerCase().includes(q),
        );
      }
      return out;
    },
    [filter, search],
  );

  // Any phase has visible tasks?
  const phasesWithVisibleTasks = useMemo(
    () =>
      phases.map((p) => ({
        ...p,
        visible: filteredTasks(p.tasks).length > 0,
      })),
    [phases, filteredTasks],
  );

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const toggleCollapse = (phaseId: string) =>
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, collapsed: !p.collapsed } : p,
      ),
    );

  const expandAll = () =>
    setPhases((prev) => prev.map((p) => ({ ...p, collapsed: false })));

  const collapseAll = () =>
    setPhases((prev) => prev.map((p) => ({ ...p, collapsed: true })));

  const cycleStatus = (phaseId: string, taskId: string) => {
    const order: TaskStatus[] = ["todo", "in-progress", "done", "blocked"];
    setPhases((prev) =>
      prev.map((p) =>
        p.id !== phaseId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : {
                      ...t,
                      status:
                        order[(order.indexOf(t.status) + 1) % order.length],
                    },
              ),
            },
      ),
    );
  };

  const toggleDone = (phaseId: string, taskId: string) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id !== phaseId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id !== taskId
                  ? t
                  : { ...t, status: t.status === "done" ? "todo" : "done" },
              ),
            },
      ),
    );
  };

  const updateNote = (phaseId: string, taskId: string, note: string) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id !== phaseId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id !== taskId ? t : { ...t, notes: note },
              ),
            },
      ),
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!loaded) {
    return (
      <div className={embedded ? "" : "min-h-screen bg-bg flex items-center justify-center"}>
        <p className="pixel-font text-primary-dark text-sm">Loading...</p>
      </div>
    );
  }

  const mainContent = (
    <>

        {/* ---- Summary Bar ---- */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, color: "bg-text text-bg" },
            { label: "Done", value: stats.done, color: "bg-primary text-white" },
            { label: "In Progress", value: stats.inProgress, color: "bg-water text-white" },
            { label: "Blocked", value: stats.blocked, color: "bg-danger text-white" },
            { label: "Todo", value: stats.todo, color: "bg-bg-warm text-text" },
          ].map((s) => (
            <div
              key={s.label}
              className={`${s.color} rounded-xl px-4 py-3 text-center shadow-sm`}
            >
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider mt-1 opacity-80">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* ---- Overall Progress ---- */}
        <div className="bg-bg-warm rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="pixel-font text-[10px] text-primary-dark">
              OVERALL PROGRESS
            </span>
            <span className="text-sm font-bold text-primary-dark">
              {stats.pct}%
            </span>
          </div>
          <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-primary-light/40">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>

        {/* ---- Quick Stats & Milestones ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cost */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-bg-warm">
            <h3 className="pixel-font text-[10px] text-brown mb-3">
              ESTIMATED COSTS
            </h3>
            <div className="text-3xl font-bold text-primary-dark mb-1">
              $2,204
            </div>
            <p className="text-xs text-text-mid">
              First production run (100 BLE + 50 Solo + 20 PlantCam + 10 Pro)
            </p>
            <div className="mt-3 space-y-1 text-xs text-text-mid">
              <div className="flex justify-between">
                <span>PCB prototypes (5x)</span>
                <span className="font-semibold text-text">~$120</span>
              </div>
              <div className="flex justify-between">
                <span>3D cases (5x)</span>
                <span className="font-semibold text-text">~$9</span>
              </div>
              <div className="flex justify-between">
                <span>Batteries & misc</span>
                <span className="font-semibold text-text">~$50</span>
              </div>
              <div className="flex justify-between">
                <span>Production batch</span>
                <span className="font-semibold text-text">~$2,024</span>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-bg-warm">
            <h3 className="pixel-font text-[10px] text-brown mb-3">
              KEY MILESTONES
            </h3>
            <ul className="space-y-2">
              {MILESTONES.map((m) => (
                <li key={m.label} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="flex-1">{m.label}</span>
                  <span className="text-xs text-text-mid font-semibold">
                    {m.target}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---- Timeline Toggle ---- */}
        <button
          onClick={() => setShowTimeline((v) => !v)}
          className="text-sm text-water hover:text-water/80 underline underline-offset-2 cursor-pointer"
        >
          {showTimeline ? "Hide timeline" : "Show timeline view"}
        </button>

        {showTimeline && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-bg-warm overflow-x-auto">
            <h3 className="pixel-font text-[10px] text-brown mb-4">
              PHASE TIMELINE (WEEKS)
            </h3>
            <div className="min-w-[600px] space-y-2">
              {(() => {
                let offset = 0;
                const totalWeeks = phases.reduce(
                  (a, p) => a + p.estimatedWeeks,
                  0,
                );
                return phases.map((p) => {
                  const left = (offset / totalWeeks) * 100;
                  const width = (p.estimatedWeeks / totalWeeks) * 100;
                  const ps = phaseStats(p);
                  offset += p.estimatedWeeks;
                  const barColor =
                    ps.pct === 100
                      ? "bg-primary"
                      : ps.pct > 0
                        ? "bg-water"
                        : "bg-bg-warm";
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="w-20 text-[10px] text-text-mid truncate shrink-0">
                        P{p.number}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded relative">
                        <div
                          className={`absolute h-full ${barColor} rounded transition-all`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        />
                        <span
                          className="absolute text-[9px] text-text font-semibold leading-5 px-1 truncate"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          {p.title} ({p.estimatedWeeks}w)
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
              {/* Week markers */}
              <div className="flex-1 ml-[88px] flex justify-between text-[9px] text-text-mid pt-1">
                <span>0</span>
                <span>
                  {Math.round(
                    phases.reduce((a, p) => a + p.estimatedWeeks, 0) / 2,
                  )}w
                </span>
                <span>
                  {phases.reduce((a, p) => a + p.estimatedWeeks, 0)}w
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ---- Filter & Search ---- */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 text-xs rounded-full border transition cursor-pointer ${
                  filter === f.value
                    ? "bg-primary-dark text-bg border-primary-dark"
                    : "bg-white text-text-mid border-bg-warm hover:border-primary-light"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-sm rounded-lg border border-bg-warm bg-white focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Expand / Collapse */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-water hover:underline cursor-pointer"
            >
              Expand all
            </button>
            <span className="text-text-mid">/</span>
            <button
              onClick={collapseAll}
              className="text-xs text-water hover:underline cursor-pointer"
            >
              Collapse all
            </button>
          </div>
        </div>

        {/* ---- Phase Cards ---- */}
        <div className="space-y-4">
          {phasesWithVisibleTasks.map((phase) => {
            const ps = phaseStats(phase);
            const tasks = filteredTasks(phase.tasks);
            if (!phase.visible && (filter !== "all" || search.trim()))
              return null;

            return (
              <div
                key={phase.id}
                className="bg-white rounded-xl shadow-sm border border-bg-warm overflow-hidden"
              >
                {/* Phase Header */}
                <button
                  onClick={() => toggleCollapse(phase.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-warm/30 transition cursor-pointer"
                >
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-text-mid transition-transform shrink-0 ${
                      phase.collapsed ? "" : "rotate-90"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>

                  {/* Phase number badge */}
                  <span className="pixel-font text-[10px] bg-primary-dark text-bg w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    {phase.number}
                  </span>

                  {/* Title */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="pixel-font text-xs text-text">
                        {phase.title}
                      </span>
                      <span className="text-[10px] text-text-mid">
                        {phase.subtitle}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full max-w-xs h-1.5 bg-bg-warm rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${ps.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-primary-dark">
                      {ps.done}/{ps.total}
                    </span>
                    <span className="text-[10px] text-text-mid block">
                      {ps.pct}%
                    </span>
                  </div>
                </button>

                {/* Tasks */}
                {!phase.collapsed && (
                  <div className="border-t border-bg-warm divide-y divide-bg-warm/50">
                    {tasks.length === 0 && (
                      <p className="px-4 py-3 text-xs text-text-mid italic">
                        No matching tasks
                      </p>
                    )}
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`px-4 py-2.5 flex items-start gap-3 group hover:bg-bg/60 transition ${
                          task.status === "done" ? "opacity-60" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleDone(phase.id, task.id)}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${
                            task.status === "done"
                              ? "bg-primary border-primary text-white"
                              : "border-text-mid/40 hover:border-primary"
                          }`}
                        >
                          {task.status === "done" && (
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm ${
                                task.status === "done"
                                  ? "line-through text-text-mid"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.critical && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-orange/20 text-orange rounded font-bold uppercase tracking-wider">
                                Critical
                              </span>
                            )}
                          </div>

                          {/* Notes */}
                          {editingNote === task.id ? (
                            <input
                              autoFocus
                              type="text"
                              placeholder="Add a note..."
                              defaultValue={task.notes}
                              onBlur={(e) => {
                                updateNote(phase.id, task.id, e.target.value);
                                setEditingNote(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  updateNote(
                                    phase.id,
                                    task.id,
                                    (e.target as HTMLInputElement).value,
                                  );
                                  setEditingNote(null);
                                }
                                if (e.key === "Escape") setEditingNote(null);
                              }}
                              className="mt-1 w-full text-xs px-2 py-1 border border-primary-light rounded focus:outline-none focus:border-primary"
                            />
                          ) : task.notes ? (
                            <p
                              onClick={() => setEditingNote(task.id)}
                              className="mt-1 text-xs text-text-mid cursor-pointer hover:text-text"
                            >
                              {task.notes}
                            </p>
                          ) : (
                            <button
                              onClick={() => setEditingNote(task.id)}
                              className="mt-1 text-[10px] text-text-mid/50 hover:text-text-mid cursor-pointer opacity-0 group-hover:opacity-100 transition"
                            >
                              + add note
                            </button>
                          )}
                        </div>

                        {/* Status badge (click to cycle) */}
                        <button
                          onClick={() => cycleStatus(phase.id, task.id)}
                          className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold cursor-pointer transition ${
                            STATUS_COLORS[task.status]
                          }`}
                          title="Click to cycle status"
                        >
                          {STATUS_LABELS[task.status]}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- Footer ---- */}
        <footer className="text-center text-xs text-text-mid py-8 border-t border-bg-warm mt-8">
          <span className="pixel-font text-[8px] text-primary-dark">
            PLANTGOTCHI
          </span>{" "}
          Internal Dashboard &middot; Data saved locally in your browser
        </footer>
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{mainContent}</div>;
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav />
      {/* ---- Header ---- */}
      <header className="bg-primary-dark text-bg z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="pixel-font text-base sm:text-lg tracking-wide">
              PLANTGOTCHI
            </h1>
            <p className="text-bg-warm text-xs mt-1 opacity-80">
              Internal Product Launch Tracker
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-primary/30 px-3 py-1 rounded-full font-semibold">
              {stats.pct}% complete
            </span>
            <span className="opacity-70">{stats.done}/{stats.total} tasks</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {mainContent}
      </main>
    </div>
  );
}

import { fetchKushy } from './adapters/kushy';
import { fetchKaggle } from './adapters/kaggle-strains';
import { mergeRecords } from './core/merger';
import { formatReport, formatSummary } from './core/reporter';
import { getDb } from './core/turso-client';
import type { NormalizedStrain, SyncReport } from './core/types';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ADAPTERS = [
  { name: 'kushy', fetch: fetchKushy, csvArg: 'raw/kushy/latest.csv' },
  { name: 'kaggle', fetch: fetchKaggle, csvArg: 'raw/kaggle/latest.csv' },
];

async function normalize(sources: string[]) {
  const allErrors: string[] = [];
  mkdirSync(join(import.meta.dirname, 'staged'), { recursive: true });

  for (const adapter of ADAPTERS) {
    if (sources.length > 0 && !sources.includes(adapter.name)) continue;

    console.log(`\n--- Fetching ${adapter.name} ---`);
    const result = await adapter.fetch(join(import.meta.dirname, adapter.csvArg));

    if (result.errors.length > 0) {
      console.warn(`Errors during fetch: ${result.errors.length}`);
      for (const e of result.errors) console.warn(`  ${e}`);
      allErrors.push(...result.errors);
    }

    console.log(`Fetched ${result.records.length} records from ${adapter.name}`);

    const stagedPath = join(import.meta.dirname, `staged/${adapter.name}.json`);
    writeFileSync(stagedPath, JSON.stringify(result.records, null, 2));
    console.log(`Staged to ${stagedPath}`);
  }

  writeFileSync(
    join(import.meta.dirname, 'staged/report.md'),
    `# Normalize complete\n\nSources: ${ADAPTERS.map(a => a.name).join(', ')}\nErrors: ${allErrors.length}\n`
  );
}

async function push(sources: string[]) {
  const reports: SyncReport[] = [];

  for (const adapter of ADAPTERS) {
    if (sources.length > 0 && !sources.includes(adapter.name)) continue;

    const stagedPath = join(import.meta.dirname, `staged/${adapter.name}.json`);
    if (!existsSync(stagedPath)) {
      console.warn(`No staged data for ${adapter.name}, skipping`);
      continue;
    }

    const records: NormalizedStrain[] = JSON.parse(readFileSync(stagedPath, 'utf-8'));
    console.log(`Pushing ${records.length} records from ${adapter.name} to Turso...`);

    const merged = await mergeRecords(records);

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO data_sources (id, name, tier, sync_frequency, record_count, status, last_synced)
            VALUES (?, ?, 'structured', 'monthly', ?, 'active', datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              record_count = excluded.record_count,
              status = 'active',
              last_synced = datetime('now')`,
      args: [adapter.name, adapter.name, records.length],
    });

    const report: SyncReport = {
      source: adapter.name,
      timestamp: new Date().toISOString(),
      fetched: records.length,
      merged,
      errors: [],
    };
    reports.push(report);
    console.log(formatReport(report));
  }

  const summary = formatSummary(reports);
  console.log('\n' + summary);
  writeFileSync(join(import.meta.dirname, 'staged/report.md'), summary);
}

const [command, ...sources] = process.argv.slice(2);

if (command === 'normalize') {
  normalize(sources).catch(e => { console.error('Normalize failed:', e); process.exit(1); });
} else if (command === 'push') {
  push(sources).catch(e => { console.error('Push failed:', e); process.exit(1); });
} else {
  console.error('Usage: run.ts <normalize|push> [source1] [source2] ...');
  process.exit(1);
}

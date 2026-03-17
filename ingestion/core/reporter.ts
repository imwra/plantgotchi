import type { SyncReport } from './types';

export function formatReport(report: SyncReport): string {
  const lines: string[] = [
    `## Ingestion Report: ${report.source}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Records fetched:** ${report.fetched}`,
    '',
    '### Merge Results',
    `- Inserted: ${report.merged.inserted}`,
    `- Updated: ${report.merged.updated}`,
    `- Skipped: ${report.merged.skipped}`,
  ];

  if (report.merged.conflicts.length > 0) {
    lines.push('', '### Conflicts');
    for (const c of report.merged.conflicts) {
      lines.push(`- **${c.name}**: ${c.reason}`);
    }
  }

  if (report.errors.length > 0) {
    lines.push('', '### Errors');
    for (const e of report.errors) {
      lines.push(`- ${e}`);
    }
  }

  return lines.join('\n');
}

export function formatSummary(reports: SyncReport[]): string {
  const lines: string[] = ['# Ingestion Summary', ''];
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const r of reports) {
    totalInserted += r.merged.inserted;
    totalUpdated += r.merged.updated;
    totalErrors += r.errors.length;
    lines.push(`- **${r.source}**: ${r.fetched} fetched, ${r.merged.inserted} new, ${r.merged.updated} updated`);
  }

  lines.push('', `**Totals:** ${totalInserted} new, ${totalUpdated} updated, ${totalErrors} errors`);
  return lines.join('\n');
}

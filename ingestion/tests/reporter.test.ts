import { describe, it, expect } from 'vitest';
import { formatReport, formatSummary } from '../core/reporter';
import type { SyncReport } from '../core/types';

describe('reporter', () => {
  const report: SyncReport = {
    source: 'kushy',
    timestamp: '2026-03-17T00:00:00Z',
    fetched: 100,
    merged: { inserted: 80, updated: 15, skipped: 5, conflicts: [{ name: 'Blue Dream', reason: 'ambiguous breeder' }] },
    errors: ['Row 42 parse failure'],
  };

  it('formatReport includes source name', () => {
    const output = formatReport(report);
    expect(output).toContain('kushy');
  });

  it('formatReport includes merge counts', () => {
    const output = formatReport(report);
    expect(output).toContain('Inserted: 80');
    expect(output).toContain('Updated: 15');
  });

  it('formatReport includes conflicts', () => {
    const output = formatReport(report);
    expect(output).toContain('Blue Dream');
    expect(output).toContain('ambiguous breeder');
  });

  it('formatReport includes errors', () => {
    const output = formatReport(report);
    expect(output).toContain('Row 42 parse failure');
  });

  it('formatSummary aggregates totals', () => {
    const output = formatSummary([report, { ...report, source: 'kaggle', merged: { inserted: 20, updated: 5, skipped: 0, conflicts: [] }, errors: [] }]);
    expect(output).toContain('100 new');
    expect(output).toContain('20 updated');
  });
});

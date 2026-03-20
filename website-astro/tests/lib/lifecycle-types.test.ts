import { describe, it, expect } from 'vitest';
import {
  Phase,
  PHASE_ORDER,
  PHASES,
  getNextPhase,
  isGrowingPhase,
  hasMonitoring,
  getPhaseDefaults,
  LATE_FLOWER_HUMIDITY,
  GrowLogType,
  getAvailableActions,
} from '../../src/lib/db/lifecycle-types';

describe('Phase enum and order', () => {
  it('has exactly 8 phases in the correct order', () => {
    expect(PHASE_ORDER).toEqual([
      'germination',
      'seedling',
      'vegetative',
      'flowering',
      'drying',
      'curing',
      'processing',
      'complete',
    ]);
    expect(PHASE_ORDER).toHaveLength(8);
  });

  it('PHASES set contains all phases', () => {
    expect(PHASES.size).toBe(8);
    for (const phase of PHASE_ORDER) {
      expect(PHASES.has(phase)).toBe(true);
    }
  });
});

describe('getNextPhase', () => {
  it('returns the next phase for each phase', () => {
    expect(getNextPhase('germination')).toBe('seedling');
    expect(getNextPhase('seedling')).toBe('vegetative');
    expect(getNextPhase('vegetative')).toBe('flowering');
    expect(getNextPhase('flowering')).toBe('drying');
    expect(getNextPhase('drying')).toBe('curing');
    expect(getNextPhase('curing')).toBe('processing');
    expect(getNextPhase('processing')).toBe('complete');
  });

  it('returns null for complete', () => {
    expect(getNextPhase('complete')).toBeNull();
  });
});

describe('isGrowingPhase', () => {
  it('returns true only for vegetative and flowering', () => {
    expect(isGrowingPhase('vegetative')).toBe(true);
    expect(isGrowingPhase('flowering')).toBe(true);
  });

  it('returns false for all other phases', () => {
    const nonGrowing: Phase[] = ['germination', 'seedling', 'drying', 'curing', 'processing', 'complete'];
    for (const phase of nonGrowing) {
      expect(isGrowingPhase(phase)).toBe(false);
    }
  });
});

describe('hasMonitoring', () => {
  it('returns false only for complete', () => {
    expect(hasMonitoring('complete')).toBe(false);
  });

  it('returns true for all other phases', () => {
    const monitored: Phase[] = ['germination', 'seedling', 'vegetative', 'flowering', 'drying', 'curing', 'processing'];
    for (const phase of monitored) {
      expect(hasMonitoring(phase)).toBe(true);
    }
  });
});

describe('getPhaseDefaults', () => {
  it('returns correct defaults for germination', () => {
    const d = getPhaseDefaults('germination');
    expect(d).not.toBeNull();
    expect(d!.temp).toEqual([22, 28]);
    expect(d!.humidity).toEqual([70, 90]);
    expect(d!.lightSchedule).toBe('18/6');
  });

  it('returns correct defaults for seedling', () => {
    const d = getPhaseDefaults('seedling');
    expect(d!.temp).toEqual([20, 26]);
    expect(d!.humidity).toEqual([60, 70]);
    expect(d!.lightSchedule).toBe('18/6');
  });

  it('returns correct defaults for vegetative', () => {
    const d = getPhaseDefaults('vegetative');
    expect(d!.temp).toEqual([20, 28]);
    expect(d!.humidity).toEqual([40, 60]);
    expect(d!.lightSchedule).toBe('18/6');
  });

  it('returns correct defaults for flowering', () => {
    const d = getPhaseDefaults('flowering');
    expect(d!.temp).toEqual([18, 26]);
    expect(d!.humidity).toEqual([40, 50]);
    expect(d!.lightSchedule).toBe('12/12');
  });

  it('returns correct defaults for drying', () => {
    const d = getPhaseDefaults('drying');
    expect(d!.temp).toEqual([18, 22]);
    expect(d!.humidity).toEqual([55, 65]);
    expect(d!.lightSchedule).toBe('0/24');
  });

  it('returns correct defaults for curing', () => {
    const d = getPhaseDefaults('curing');
    expect(d!.temp).toEqual([18, 22]);
    expect(d!.humidity).toEqual([58, 65]);
    expect(d!.lightSchedule).toBe('0/24');
  });

  it('returns correct defaults for processing', () => {
    const d = getPhaseDefaults('processing');
    expect(d!.temp).toEqual([18, 24]);
    expect(d!.humidity).toEqual([40, 60]);
    expect(d!.lightSchedule).toBe('0/24');
  });

  it('returns null for complete', () => {
    expect(getPhaseDefaults('complete')).toBeNull();
  });
});

describe('LATE_FLOWER_HUMIDITY', () => {
  it('is [30, 40]', () => {
    expect(LATE_FLOWER_HUMIDITY).toEqual([30, 40]);
  });
});

describe('getAvailableActions', () => {
  it('returns correct actions for germination', () => {
    expect(getAvailableActions('germination')).toEqual([
      'watering', 'environmental', 'measurement', 'photo', 'note',
    ]);
  });

  it('returns correct actions for seedling', () => {
    expect(getAvailableActions('seedling')).toEqual([
      'watering', 'feeding', 'transplant', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment',
    ]);
  });

  it('vegetative allows training actions', () => {
    const actions = getAvailableActions('vegetative');
    expect(actions).toContain('topping');
    expect(actions).toContain('fimming');
    expect(actions).toContain('lst');
    expect(actions).toContain('defoliation');
    expect(actions).toContain('cloning');
    expect(actions).toEqual([
      'watering', 'feeding', 'topping', 'fimming', 'lst', 'defoliation',
      'transplant', 'cloning', 'environmental', 'measurement', 'photo', 'note', 'pestTreatment',
    ]);
  });

  it('flowering allows harvest but not topping', () => {
    const actions = getAvailableActions('flowering');
    expect(actions).toContain('harvest');
    expect(actions).not.toContain('topping');
    expect(actions).toEqual([
      'watering', 'feeding', 'lst', 'defoliation', 'flushing', 'trichomeCheck',
      'environmental', 'measurement', 'photo', 'note', 'pestTreatment', 'harvest',
    ]);
  });

  it('drying restricts to minimal actions', () => {
    expect(getAvailableActions('drying')).toEqual([
      'dryCheck', 'environmental', 'photo', 'note',
    ]);
  });

  it('curing has cureCheck actions', () => {
    expect(getAvailableActions('curing')).toEqual([
      'cureCheck', 'environmental', 'photo', 'note',
    ]);
  });

  it('processing has processing-specific actions', () => {
    expect(getAvailableActions('processing')).toEqual([
      'processingLog', 'dryWeight', 'photo', 'note',
    ]);
  });

  it('complete only allows photo and note', () => {
    expect(getAvailableActions('complete')).toEqual(['photo', 'note']);
  });
});

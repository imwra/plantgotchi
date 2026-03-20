import { describe, it, expect } from 'vitest';
import {
  resolveThresholds,
  evaluatePlant,
  getTransitionSuggestions,
} from '../../src/lib/agents/rules';
import type { Plant, SensorReading } from '../../src/lib/db/queries';

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'plant-1',
    user_id: 'user-1',
    name: 'Test Plant',
    species: null,
    emoji: '🌱',
    photo_url: null,
    moisture_min: 30,
    moisture_max: 70,
    temp_min: 18,
    temp_max: 30,
    light_preference: 'high',
    garden_id: null,
    catalog_id: null,
    plant_type: null,
    strain_id: null,
    strain_name: null,
    strain_type: null,
    environment: null,
    current_phase: null,
    phase_started_at: null,
    grow_id: null,
    identification_confidence: 'unknown',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeReading(overrides: Partial<SensorReading> = {}): SensorReading {
  return {
    id: 1,
    plant_id: 'plant-1',
    sensor_id: 'sensor-1',
    moisture: 50,
    temperature: 24,
    light: 5000,
    battery: 80,
    timestamp: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('resolveThresholds', () => {
  it('no phase → uses plant-level thresholds', () => {
    const plant = makePlant({ temp_min: 15, temp_max: 35 });
    const t = resolveThresholds(plant);
    expect(t.tempMin).toBe(15);
    expect(t.tempMax).toBe(35);
    expect(t.moistureMin).toBe(30);
    expect(t.moistureMax).toBe(70);
  });

  it('flowering phase → uses phase defaults (tempMin=18, tempMax=26)', () => {
    const plant = makePlant({ current_phase: 'flowering', temp_min: 10, temp_max: 35 });
    const t = resolveThresholds(plant);
    expect(t.tempMin).toBe(18);
    expect(t.tempMax).toBe(26);
  });

  it('always uses plant-level moisture regardless of phase', () => {
    const plant = makePlant({ current_phase: 'flowering', moisture_min: 25, moisture_max: 65 });
    const t = resolveThresholds(plant);
    expect(t.moistureMin).toBe(25);
    expect(t.moistureMax).toBe(65);
  });
});

describe('evaluatePlant (phase-aware)', () => {
  it('complete phase → returns empty array (skips evaluation)', () => {
    const plant = makePlant({ current_phase: 'complete' });
    const reading = makeReading();
    const recs = evaluatePlant(plant, reading);
    expect(recs).toEqual([]);
  });

  it('flowering phase + temp 28°C → generates "hot" warning (flowering max is 26)', () => {
    const plant = makePlant({ current_phase: 'flowering' });
    const reading = makeReading({ temperature: 28 });
    const recs = evaluatePlant(plant, reading);
    const hot = recs.find((r) => r.message.includes('Too hot'));
    expect(hot).toBeDefined();
    expect(hot!.severity).toBe('warning');
  });

  it('no phase + temp 32°C → generates "hot" warning (backward compat with plant temp_max=30)', () => {
    const plant = makePlant({ temp_max: 30 });
    const reading = makeReading({ temperature: 32 });
    const recs = evaluatePlant(plant, reading);
    const hot = recs.find((r) => r.message.includes('Too hot'));
    expect(hot).toBeDefined();
    expect(hot!.severity).toBe('warning');
  });
});

describe('getTransitionSuggestions', () => {
  it('vegetative + 43 days → suggests flowering', () => {
    const started = new Date(Date.now() - 43 * 86400000).toISOString();
    const plant = makePlant({ current_phase: 'vegetative', phase_started_at: started });
    const recs = getTransitionSuggestions(plant);
    expect(recs).toHaveLength(1);
    expect(recs[0].message).toMatch(/flower/i);
    expect(recs[0].severity).toBe('info');
    expect(recs[0].source).toBe('rules');
  });

  it('no phase → returns empty', () => {
    const plant = makePlant();
    const recs = getTransitionSuggestions(plant);
    expect(recs).toEqual([]);
  });

  it('drying + 8 days → suggests snap test', () => {
    const started = new Date(Date.now() - 8 * 86400000).toISOString();
    const plant = makePlant({ current_phase: 'drying', phase_started_at: started });
    const recs = getTransitionSuggestions(plant);
    expect(recs).toHaveLength(1);
    expect(recs[0].message).toMatch(/snap/i);
    expect(recs[0].severity).toBe('info');
  });
});

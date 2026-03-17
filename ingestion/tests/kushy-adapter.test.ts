import { describe, it, expect } from 'vitest';
import { normalizeKushyRow } from '../adapters/kushy';

describe('kushy adapter', () => {
  it('normalizes a kushy CSV row to NormalizedStrain', () => {
    const row = {
      name: 'Blue Dream',
      type: 'hybrid',
      rating: '4.5',
      effects: 'Relaxed,Happy,Euphoric',
      flavor: 'Berry,Sweet,Herbal',
      description: 'A sativa-dominant hybrid',
    };
    const result = normalizeKushyRow(row);
    expect(result.name).toBe('Blue Dream');
    expect(result.category).toBe('cannabis');
    expect(result.subcategory).toBe('hybrid');
    expect(result.source).toBe('kushy');
    expect(result.attributes.effects.value).toEqual(['Relaxed', 'Happy', 'Euphoric']);
    expect(result.attributes.effects.source).toBe('kushy');
    expect(result.attributes.flavor.value).toEqual(['Berry', 'Sweet', 'Herbal']);
  });

  it('maps indica type correctly', () => {
    const row = { name: 'Northern Lights', type: 'indica', rating: '4.0', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.subcategory).toBe('indica');
  });

  it('maps sativa type correctly', () => {
    const row = { name: 'Jack Herer', type: 'sativa', rating: '4.3', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.subcategory).toBe('sativa');
  });

  it('handles missing fields gracefully', () => {
    const row = { name: 'Mystery Strain', type: '', rating: '', effects: '', flavor: '', description: '' };
    const result = normalizeKushyRow(row);
    expect(result.name).toBe('Mystery Strain');
    expect(result.subcategory).toBeNull();
  });
});

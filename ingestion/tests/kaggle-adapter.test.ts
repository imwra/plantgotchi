import { describe, it, expect } from 'vitest';
import { normalizeKaggleRow } from '../adapters/kaggle-strains';

describe('kaggle-strains adapter', () => {
  it('normalizes a kaggle CSV row', () => {
    const row = {
      Strain: 'OG Kush',
      Type: 'hybrid',
      Rating: '4.3',
      Effects: 'Relaxed,Happy,Euphoric,Uplifted,Hungry',
      Flavor: 'Earthy,Pine,Woody',
      Description: 'OG Kush is a legendary strain.',
    };
    const result = normalizeKaggleRow(row);
    expect(result.name).toBe('OG Kush');
    expect(result.category).toBe('cannabis');
    expect(result.subcategory).toBe('hybrid');
    expect(result.source).toBe('kaggle');
    expect(result.attributes.effects.value).toEqual(['Relaxed', 'Happy', 'Euphoric', 'Uplifted', 'Hungry']);
  });

  it('handles empty type', () => {
    const row = { Strain: 'Test', Type: '', Rating: '', Effects: '', Flavor: '', Description: '' };
    const result = normalizeKaggleRow(row);
    expect(result.subcategory).toBeNull();
  });
});

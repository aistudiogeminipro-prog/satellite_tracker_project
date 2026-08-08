import { describe, it, expect } from 'vitest';
import { calculateSolarPosition } from './sunService';

describe('sunService', () => {
  it('calculates daytime solar elevation for Taipei at UTC noon (2026-08-08 04:00 UTC = 12:00 Local)', () => {
    // Taipei: Lat 25.03, Lon 121.56
    const date = new Date('2026-08-08T04:00:00Z');
    const result = calculateSolarPosition(25.03, 121.56, date);

    expect(result.elevationDeg).toBeGreaterThan(40);
    expect(result.isDaylight).toBe(true);
  });

  it('calculates nighttime solar elevation for Taipei at UTC midnight (2026-08-08 16:00 UTC = 00:00 Local)', () => {
    const date = new Date('2026-08-08T16:00:00Z');
    const result = calculateSolarPosition(25.03, 121.56, date);

    expect(result.elevationDeg).toBeLessThan(0);
    expect(result.isDaylight).toBe(false);
  });
});

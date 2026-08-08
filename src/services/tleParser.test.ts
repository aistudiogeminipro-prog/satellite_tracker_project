import { describe, it, expect } from 'vitest';
import { parseTLEText } from './tleParser';

describe('tleParser', () => {
  it('correctly parses 3-line TLE format', () => {
    const raw = `ISS (ZARYA)
1 25544U 98067A   24120.50000000  .00016717  00000-0  30000-3 0  9993
2 25544  51.6400 208.9100 0004000  90.0000 270.0000 15.49000000123457`;

    const parsed = parseTLEText(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('ISS (ZARYA)');
    expect(parsed[0].noradId).toBe('25544');
    expect(parsed[0].line1).toContain('1 25544U');
    expect(parsed[0].line2).toContain('2 25544');
  });

  it('correctly parses 2-line TLE format', () => {
    const raw = `1 25544U 98067A   24120.50000000  .00016717  00000-0  30000-3 0  9993
2 25544  51.6400 208.9100 0004000  90.0000 270.0000 15.49000000123457`;

    const parsed = parseTLEText(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].noradId).toBe('25544');
    expect(parsed[0].name).toBe('SATELLITE-25544');
  });
});

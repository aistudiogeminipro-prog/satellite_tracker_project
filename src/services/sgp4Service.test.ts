import { describe, it, expect } from 'vitest';
import { propagateSatellitePosition, generateOrbitTrajectory } from './sgp4Service';
import { TLEData } from '../types/satellite';

describe('sgp4Service', () => {
  const sampleTle: TLEData = {
    name: 'ISS (ZARYA)',
    noradId: '25544',
    line1: '1 25544U 98067A   24120.50000000  .00016717  00000-0  30000-3 0  9993',
    line2: '2 25544  51.6400 208.9100 0004000  90.0000 270.0000 15.49000000123457',
  };

  it('calculates geographic coordinates from valid TLE', () => {
    const pos = propagateSatellitePosition(sampleTle, new Date('2024-05-01T12:00:00Z'));
    expect(pos).not.toBeNull();
    if (pos) {
      expect(pos.noradId).toBe('25544');
    }
  });

  it('generates past and future orbit trajectories', () => {
    const trajectory = generateOrbitTrajectory(sampleTle, new Date('2024-05-01T12:00:00Z'), 1, 15);
    expect(trajectory.pastPositions.length).toBeGreaterThan(0);
    expect(trajectory.futurePositions.length).toBeGreaterThan(0);
  });
});

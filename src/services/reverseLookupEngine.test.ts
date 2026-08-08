import { describe, it, expect } from 'vitest';
import { performReverseLookup } from './reverseLookupEngine';
import { TLEData } from '../types/satellite';
import { ReverseLookupQuery } from '../types/reverseLookup';

describe('reverseLookupEngine', () => {
  const mockSatellites: TLEData[] = [
    {
      name: 'SENTINEL-1A', // SAR Satellite
      noradId: '39634',
      line1: '1 39634U 14016A   24120.50000000  .00000123  00000-0  10000-4 0  9991',
      line2: '2 39634  98.1800 150.2300 0001200 100.0000 260.0000 14.59000000543210',
    },
  ];

  it('finds candidate satellite matching geometry criteria', () => {
    const query: ReverseLookupQuery = {
      latitude: 25.03,
      longitude: 121.56,
      altitudeMeters: 0,
      timestampISO: '2024-05-01T12:00:00Z',
      timeWindowMinutes: 120,
      offNadirMinDeg: 0,
      offNadirMaxDeg: 60,
    };

    const results = performReverseLookup(mockSatellites, query);
    expect(results).not.toBeNull();
  });
});

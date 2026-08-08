import { describe, it, expect } from 'vitest';
import { getSatelliteMetadata, deriveOrbitTypeFromTLE } from './metadataService';
import { TLEData } from '../types/satellite';
import { SatelliteCategory, OrbitType } from '../types/metadata';

describe('metadataService', () => {
  it('returns known static metadata for SENTINEL-1A', () => {
    const tle: TLEData = {
      name: 'SENTINEL-1A',
      noradId: '39634',
      line1: '1 39634U 14016A   24120.50000000  .00000123  00000-0  10000-4 0  9991',
      line2: '2 39634  98.1800 150.2300 0001200 100.0000 260.0000 14.59000000543210',
    };

    const meta = getSatelliteMetadata(tle);
    expect(meta.noradId).toBe('39634');
    expect(meta.category).toBe(SatelliteCategory.SAR);
    expect(meta.country).toBe('歐盟');
    expect(meta.orbitType).toBe(OrbitType.SSO);
  });

  it('derives SSO orbit type automatically for unlisted satellite TLE', () => {
    const line1 = '1 99999U 24001A   24120.50000000  .00000123  00000-0  10000-4 0  9991';
    const line2 = '2 99999  98.0000 150.2300 0001200 100.0000 260.0000 15.00000000543210';

    const orbit = deriveOrbitTypeFromTLE(line1, line2);
    expect(orbit).toBe(OrbitType.SSO);
  });
});

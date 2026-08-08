import { TLEData } from './satellite';
import { SatelliteMetadata } from './metadata';

export interface ReverseLookupQuery {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  timestampISO: string;
  timeWindowMinutes: number; // e.g. 30 (means +/- 30 minutes)
  offNadirMinDeg: number;    // Min off-nadir angle (e.g. 0)
  offNadirMaxDeg: number;    // Max off-nadir angle (e.g. 45)
  requiredResolutionMeters?: number;
}

export interface CandidateResult {
  sat: TLEData;
  meta: SatelliteMetadata;
  matchTimestamp: Date;
  offNadirDeg: number;
  azimuthDeg: number;
  distanceKm: number;
  isDaylight: boolean;
}

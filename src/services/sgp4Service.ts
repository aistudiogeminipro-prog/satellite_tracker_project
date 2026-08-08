import * as satellite from 'satellite.js';
import { TLEData } from '../types/satellite';

export interface SatellitePosition {
  noradId: string;
  name: string;
  longitudeDeg: number;
  latitudeDeg: number;
  heightKm: number;
}

export interface OrbitTrajectory {
  pastPositions: { longitudeDeg: number; latitudeDeg: number; heightKm: number }[];
  futurePositions: { longitudeDeg: number; latitudeDeg: number; heightKm: number }[];
}

export function propagateSatellitePosition(tle: TLEData, date: Date): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
      return null;
    }

    const gstime = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(positionAndVelocity.position as satellite.EciVec3<number>, gstime);

    return {
      noradId: tle.noradId,
      name: tle.name,
      longitudeDeg: satellite.degreesLong(geodetic.longitude),
      latitudeDeg: satellite.degreesLat(geodetic.latitude),
      heightKm: geodetic.height,
    };
  } catch {
    return null;
  }
}

export function generateOrbitTrajectory(
  tle: TLEData,
  centerDate: Date,
  hours: number = 24,
  stepMinutes: number = 5
): OrbitTrajectory {
  const pastPositions: { longitudeDeg: number; latitudeDeg: number; heightKm: number }[] = [];
  const futurePositions: { longitudeDeg: number; latitudeDeg: number; heightKm: number }[] = [];

  const totalSteps = Math.floor((hours * 60) / stepMinutes);

  // Past 24h
  for (let i = totalSteps; i >= 0; i--) {
    const time = new Date(centerDate.getTime() - i * stepMinutes * 60 * 1000);
    const pos = propagateSatellitePosition(tle, time);
    if (pos) {
      pastPositions.push({
        longitudeDeg: pos.longitudeDeg,
        latitudeDeg: pos.latitudeDeg,
        heightKm: pos.heightKm,
      });
    }
  }

  // Future 24h
  for (let i = 1; i <= totalSteps; i++) {
    const time = new Date(centerDate.getTime() + i * stepMinutes * 60 * 1000);
    const pos = propagateSatellitePosition(tle, time);
    if (pos) {
      futurePositions.push({
        longitudeDeg: pos.longitudeDeg,
        latitudeDeg: pos.latitudeDeg,
        heightKm: pos.heightKm,
      });
    }
  }

  return { pastPositions, futurePositions };
}

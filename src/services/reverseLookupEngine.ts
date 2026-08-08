import { TLEData } from '../types/satellite';
import { SatelliteCategory } from '../types/metadata';
import { ReverseLookupQuery, CandidateResult } from '../types/reverseLookup';
import { getSatelliteMetadata } from './metadataService';
import { propagateSatellitePosition } from './sgp4Service';
import { calculateSolarPosition } from './sunService';

export function performReverseLookup(
  satellites: TLEData[],
  query: ReverseLookupQuery
): CandidateResult[] {
  const targetDate = new Date(query.timestampISO);
  if (isNaN(targetDate.getTime())) return [];

  // Check solar illumination at ground target
  const solarInfo = calculateSolarPosition(query.latitude, query.longitude, targetDate);
  const isTargetDaylight = solarInfo.isCivilDaylight;

  const results: CandidateResult[] = [];

  // Time window sampling steps (e.g. every 2 minutes within +/- timeWindowMinutes)
  const windowMs = query.timeWindowMinutes * 60 * 1000;
  const stepMs = 2 * 60 * 1000;

  satellites.forEach((sat) => {
    const meta = getSatelliteMetadata(sat);

    // NIGHTTIME FILTER: If target is in dark/night, exclude Optical satellites; retain SAR/Radar
    if (!isTargetDaylight && meta.category === SatelliteCategory.OPTICAL) {
      return;
    }

    let bestCandidateForSat: CandidateResult | null = null;
    let minOffNadirDiff = Infinity;

    for (let timeOffset = -windowMs; timeOffset <= windowMs; timeOffset += stepMs) {
      const sampleDate = new Date(targetDate.getTime() + timeOffset);
      const satPos = propagateSatellitePosition(sat, sampleDate);

      if (!satPos) continue;

      // Calculate slant range vector & off-nadir angle
      // Simplified spherical geometry for off-nadir calculation
      const dLat = satPos.latitudeDeg - query.latitude;
      const dLon = satPos.longitudeDeg - query.longitude;

      const groundDistKm =
        Math.sqrt(dLat * dLat + dLon * dLon) * 111.32; // approx 111.32km per degree

      const satHeightKm = satPos.heightKm;
      const slantDistKm = Math.sqrt(groundDistKm * groundDistKm + satHeightKm * satHeightKm);

      // Off-nadir angle theta = arctan(groundDist / satHeight) in degrees
      const offNadirDeg = (Math.atan2(groundDistKm, satHeightKm) * 180) / Math.PI;

      // Azimuth angle
      let azimuthDeg = (Math.atan2(dLon, dLat) * 180) / Math.PI;
      if (azimuthDeg < 0) azimuthDeg += 360;

      // Check if off-nadir falls within query range
      if (offNadirDeg >= query.offNadirMinDeg && offNadirDeg <= query.offNadirMaxDeg) {
        if (offNadirDeg < minOffNadirDiff) {
          minOffNadirDiff = offNadirDeg;
          bestCandidateForSat = {
            sat,
            meta,
            matchTimestamp: sampleDate,
            offNadirDeg: Math.round(offNadirDeg * 10) / 10,
            azimuthDeg: Math.round(azimuthDeg * 10) / 10,
            distanceKm: Math.round(slantDistKm),
            isDaylight: isTargetDaylight,
          };
        }
      }
    }

    if (bestCandidateForSat) {
      results.push(bestCandidateForSat);
    }
  });

  // Sort by smallest off-nadir angle
  return results.sort((a, b) => a.offNadirDeg - b.offNadirDeg);
}

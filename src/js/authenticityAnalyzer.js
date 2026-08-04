import { OrbitCalculator } from './orbitCalculator.js';

/**
 * AuthenticityAnalyzer - Analyzes satellite image acquisition feasibility & potential satellite matches to detect AI fakes or false metadata.
 */
export class AuthenticityAnalyzer {
  /**
   * Run full verification analysis
   * @param {Object} inputParams
   *   - targetLat: number (-90 to 90)
   *   - targetLon: number (-180 to 180)
   *   - targetDate: Date object
   *   - imageResolutionMeters: number (e.g. 0.5)
   *   - inputOffNadirDeg: number (e.g. 15.0)
   *   - inputAzimuthDeg: number (e.g. 120.0)
   * @param {Array} satelliteList - List of enriched satellite objects (with satrec)
   * @returns {Object} Analysis results: { solarInfo, candidateMatches, summary }
   */
  static analyze(inputParams, satelliteList) {
    const {
      targetLat,
      targetLon,
      targetDate,
      imageResolutionMeters = 0.5,
      inputOffNadirDeg = null,
      inputAzimuthDeg = null
    } = inputParams;

    // 1. Calculate Sun Position & Solar Elevation Angle
    const solarInfo = this.calculateSolarElevation(targetLat, targetLon, targetDate);

    // 2. Filter & Evaluate Satellites
    const candidateMatches = [];

    satelliteList.forEach(sat => {
      // Check if satellite has satrec for SGP4
      if (!sat.satrec) return;

      // Filter out satellites incapable of required resolution
      if (sat.maxResolutionMeters > imageResolutionMeters * 2) {
        return; // Resolution capacity too low
      }

      // Propagate satellite at targetDate
      const satPos = OrbitCalculator.getSatellitePositionAtDate(sat.satrec, targetDate);
      if (!satPos) return;

      // Calculate relative geometry
      const geom = this.calculateTargetGeometry(
        targetLat,
        targetLon,
        satPos.latitudeDeg,
        satPos.longitudeDeg,
        satPos.heightKm
      );

      // Evaluate match score
      let score = 100;
      let notes = [];

      // Solar lighting compatibility check
      if (sat.sensorType.includes('Optical') && solarInfo.elevationDeg < 0) {
        score -= 50;
        notes.push('⚠️ Target area in darkness (Sun elevation < 0°). Optical sensor acquisition unlikely.');
      }

      // Off-Nadir angle comparison
      if (inputOffNadirDeg !== null && !isNaN(inputOffNadirDeg)) {
        const offNadirDiff = Math.abs(geom.offNadirDeg - inputOffNadirDeg);
        if (offNadirDiff > 15) {
          score -= Math.min(40, offNadirDiff * 2);
          notes.push(`Off-nadir angle mismatch: Sat=${geom.offNadirDeg.toFixed(1)}°, Image=${inputOffNadirDeg}°`);
        } else {
          notes.push(`Off-nadir angle match: ${geom.offNadirDeg.toFixed(1)}°`);
        }
      }

      // Azimuth angle comparison
      if (inputAzimuthDeg !== null && !isNaN(inputAzimuthDeg)) {
        let azDiff = Math.abs(geom.azimuthDeg - inputAzimuthDeg) % 360;
        if (azDiff > 180) azDiff = 360 - azDiff;
        if (azDiff > 30) {
          score -= Math.min(30, azDiff * 0.5);
          notes.push(`Azimuth mismatch: Sat=${geom.azimuthDeg.toFixed(1)}°, Image=${inputAzimuthDeg}°`);
        } else {
          notes.push(`Azimuth match: ${geom.azimuthDeg.toFixed(1)}°`);
        }
      }

      // Max Resolution capability check
      if (sat.maxResolutionMeters <= imageResolutionMeters) {
        score += 10;
        notes.push(`Sensor native resolution (${sat.maxResolutionMeters}m) supports requested image resolution (${imageResolutionMeters}m).`);
      } else {
        score -= 20;
        notes.push(`Sensor native resolution (${sat.maxResolutionMeters}m) coarser than target image resolution (${imageResolutionMeters}m).`);
      }

      // Filter candidates within line-of-sight elevation > 10°
      if (geom.elevationDeg >= 10) {
        candidateMatches.push({
          satellite: sat,
          satPosition: satPos,
          geometry: geom,
          matchScore: Math.max(0, Math.min(100, Math.round(score))),
          notes: notes
        });
      }
    });

    // Sort by match score descending
    candidateMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Summary verdict
    let verdict = 'PROBABLE_AUTHENTIC';
    let summaryText = 'Found matching satellite pass(es) compatible with input acquisition conditions.';

    if (solarInfo.elevationDeg < -6) {
      verdict = 'HIGH_RISK_AI_FAKE';
      summaryText = `Target location was in darkness (Sun elevation ${solarInfo.elevationDeg.toFixed(1)}°) at input time. Visible optical acquisition is physically impossible. Highly likely AI-generated fake or false timestamp.`;
    } else if (candidateMatches.length === 0) {
      verdict = 'SUSPICIOUS_NO_MATCH';
      summaryText = 'No active optical/reconnaissance satellites were in range over the target location at input time with compatible geometry or resolution.';
    }

    return {
      solarInfo,
      candidateMatches,
      verdict,
      summaryText
    };
  }

  /**
   * Calculate Solar Elevation & Azimuth for a Lat/Lon & Date
   */
  static calculateSolarElevation(lat, lon, date) {
    const rad = Math.PI / 180;
    const dayOfYear = this._getDayOfYear(date);
    const declination = -23.44 * Math.cos((360 / 365) * (dayOfYear + 10) * rad);

    const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
    const solarTime = (utcHours + lon / 15 + 24) % 24;
    const hourAngle = (solarTime - 12) * 15;

    const latRad = lat * rad;
    const decRad = declination * rad;
    const haRad = hourAngle * rad;

    const sinElev = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const elevationDeg = Math.asin(Math.max(-1, Math.min(1, sinElev))) / rad;

    const isDaylight = elevationDeg > 0;
    const isCivilTwilight = elevationDeg > -6 && elevationDeg <= 0;

    return {
      elevationDeg: parseFloat(elevationDeg.toFixed(2)),
      isDaylight,
      isCivilTwilight,
      statusLabel: isDaylight ? 'Daylight (Sunlit)' : (isCivilTwilight ? 'Twilight' : 'Night (Darkness)')
    };
  }

  /**
   * Calculate Satellite-to-Target relative geometric angles
   */
  static calculateTargetGeometry(targetLat, targetLon, satLat, satLon, satAltKm) {
    const R_EARTH = 6371.0; // km
    const rad = Math.PI / 180;

    const dLat = (satLat - targetLat) * rad;
    const dLon = (satLon - targetLon) * rad;

    const tLatRad = targetLat * rad;
    const sLatRad = satLat * rad;

    // Great circle distance in km
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(tLatRad) * Math.cos(sLatRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const groundDistanceKm = R_EARTH * c;

    // Azimuth from target to satellite
    const y = Math.sin(dLon) * Math.cos(sLatRad);
    const x = Math.cos(tLatRad) * Math.sin(sLatRad) - Math.sin(tLatRad) * Math.cos(sLatRad) * Math.cos(dLon);
    let azimuthDeg = (Math.atan2(y, x) / rad + 360) % 360;

    // Satellite Slant Range
    const satRadius = R_EARTH + satAltKm;
    const slantRangeKm = Math.sqrt(R_EARTH * R_EARTH + satRadius * satRadius - 2 * R_EARTH * satRadius * Math.cos(c));

    // Target Elevation Angle above horizon
    const cosElev = (satRadius * Math.sin(c)) / slantRangeKm;
    const elevationDeg = Math.asin(Math.max(-1, Math.min(1, cosElev))) / rad;

    // Satellite Off-Nadir angle (look angle)
    const sinOffNadir = (R_EARTH * Math.sin(c)) / slantRangeKm;
    const offNadirDeg = Math.asin(Math.max(-1, Math.min(1, sinOffNadir))) / rad;

    return {
      groundDistanceKm: parseFloat(groundDistanceKm.toFixed(1)),
      slantRangeKm: parseFloat(slantRangeKm.toFixed(1)),
      elevationDeg: parseFloat(elevationDeg.toFixed(1)),
      offNadirDeg: parseFloat(offNadirDeg.toFixed(1)),
      azimuthDeg: parseFloat(azimuthDeg.toFixed(1))
    };
  }

  static _getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }
}

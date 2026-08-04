/**
 * OrbitCalculator - SGP4 orbital propagation & trajectory generation using satellite.js
 */
export class OrbitCalculator {
  /**
   * Propagate satellite position at a specific JS Date object
   * @param {Object} satRecord - satellite.js satrec object initialized from TLE
   * @param {Date} date - Target JS Date
   * @returns {Object|null} { latitudeDeg, longitudeDeg, heightKm, ecefPosition, positionEci }
   */
  static getSatellitePositionAtDate(satrec, date) {
    if (!satrec) return null;

    const positionAndVelocity = satellite.propagate(satrec, date);
    const positionEci = positionAndVelocity.position;
    if (!positionEci || typeof positionEci.x !== 'number' || isNaN(positionEci.x)) {
      return null;
    }

    const gmst = satellite.gstime(date);
    const geodetic = satellite.eciToGeodetic(positionEci, gmst);

    const latitudeDeg = satellite.degreesLat(geodetic.latitude);
    const longitudeDeg = satellite.degreesLong(geodetic.longitude);
    const heightKm = geodetic.height;

    // Convert to ECEF for Cesium Cartesian3
    const positionEcef = satellite.eciToEcf(positionEci, gmst);

    return {
      latitudeDeg,
      longitudeDeg,
      heightKm,
      positionEcef,
      positionEci
    };
  }

  /**
   * Generate trajectory points for past N hours and future N hours
   * @param {Object} satrec - satellite.js satrec
   * @param {Date} centerDate - Current/target date
   * @param {number} hoursPast - Past duration in hours (default 24)
   * @param {number} hoursFuture - Future duration in hours (default 24)
   * @param {number} stepMinutes - Sampling interval in minutes (default 5)
   * @returns {Object} { pastPoints: Array<Cartesian3/Geodetic>, futurePoints: Array<Cartesian3/Geodetic> }
   */
  static generateTrajectory(satrec, centerDate, hoursPast = 24, hoursFuture = 24, stepMinutes = 5) {
    if (!satrec) return { pastPoints: [], futurePoints: [] };

    const pastPoints = [];
    const futurePoints = [];

    const centerTimeMs = centerDate.getTime();
    const stepMs = stepMinutes * 60 * 1000;

    // Past sampling
    const pastSteps = Math.floor((hoursPast * 60) / stepMinutes);
    for (let i = pastSteps; i >= 0; i--) {
      const sampleDate = new Date(centerTimeMs - i * stepMs);
      const pos = this.getSatellitePositionAtDate(satrec, sampleDate);
      if (pos) {
        pastPoints.push({
          date: sampleDate,
          lat: pos.latitudeDeg,
          lon: pos.longitudeDeg,
          heightKm: pos.heightKm,
          ecef: pos.positionEcef
        });
      }
    }

    // Future sampling
    const futureSteps = Math.floor((hoursFuture * 60) / stepMinutes);
    for (let i = 1; i <= futureSteps; i++) {
      const sampleDate = new Date(centerTimeMs + i * stepMs);
      const pos = this.getSatellitePositionAtDate(satrec, sampleDate);
      if (pos) {
        futurePoints.push({
          date: sampleDate,
          lat: pos.latitudeDeg,
          lon: pos.longitudeDeg,
          heightKm: pos.heightKm,
          ecef: pos.positionEcef
        });
      }
    }

    return { pastPoints, futurePoints };
  }

  /**
   * Helper to parse TLE line 1 & 2 into satrec
   */
  static parseTLELines(tleLine1, tleLine2) {
    if (!tleLine1 || !tleLine2) return null;
    try {
      return satellite.twoline2satrec(tleLine1, tleLine2);
    } catch (err) {
      console.warn('Failed to parse TLE lines:', err);
      return null;
    }
  }
}

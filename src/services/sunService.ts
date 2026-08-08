/**
 * Computes solar elevation angle and daylight status for a given ground position & timestamp.
 */
export interface SolarPositionResult {
  elevationDeg: number;
  azimuthDeg: number;
  isDaylight: boolean; // Solar elevation > 0 deg
  isCivilDaylight: boolean; // Solar elevation > -6 deg (Civil Twilight)
}

export function calculateSolarPosition(
  latDeg: number,
  lonDeg: number,
  date: Date
): SolarPositionResult {
  const latRad = (latDeg * Math.PI) / 180;

  // Day of year
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  const hoursUTC = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Fractional year gamma in radians
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hoursUTC - 12) / 24);

  // Equation of time in minutes
  const eqtime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination in radians
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // Time offset in minutes
  const timeOffset = eqtime + 4 * lonDeg;

  // True solar time in minutes
  const tst = hoursUTC * 60 + timeOffset;

  // Solar hour angle in radians
  const haRad = (((tst / 4) - 180) * Math.PI) / 180;

  // Zenith angle (cosTheta)
  const cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
  const zenithRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));

  const elevationDeg = 90 - (zenithRad * 180) / Math.PI;

  // Solar Azimuth Angle
  const cosAzimuth =
    (Math.sin(decl) - Math.sin(latRad) * Math.sin(elevationDeg * Math.PI / 180)) /
    (Math.cos(latRad) * Math.cos(elevationDeg * Math.PI / 180));
  let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;

  if (Math.sin(haRad) > 0) {
    azimuthDeg = 360 - azimuthDeg;
  }

  return {
    elevationDeg,
    azimuthDeg,
    isDaylight: elevationDeg > 0,
    isCivilDaylight: elevationDeg > -6,
  };
}

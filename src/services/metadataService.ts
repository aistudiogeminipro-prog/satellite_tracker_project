import { TLEData } from '../types/satellite';
import { SatelliteMetadata, SatelliteCategory, OrbitType } from '../types/metadata';

// 內建知名前偵照與常見衛星靜態對照表
const STATIC_METADATA_DATABASE: Record<string, Partial<SatelliteMetadata>> = {
  '25544': {
    name: 'ISS (ZARYA)',
    operator: 'NASA / Roscosmos',
    country: '國際合作',
    category: SatelliteCategory.OTHER,
    launchDate: '1998-11-20',
    resolution: 'N/A',
    orbitType: OrbitType.LEO,
    launchVehicle: 'Proton-K',
    lifespanYears: '30年',
    civilOrMilitary: '民用',
  },
  '39634': {
    name: 'SENTINEL-1A',
    operator: 'ESA',
    country: '歐盟',
    category: SatelliteCategory.SAR,
    launchDate: '2014-04-03',
    resolution: '5m - 20m (C-band SAR)',
    orbitType: OrbitType.SSO,
    launchVehicle: 'Soyuz-STB',
    lifespanYears: '7年',
    civilOrMilitary: '民用',
  },
  '46324': {
    name: 'CAPELLA-2',
    operator: 'Capella Space',
    country: '美國',
    category: SatelliteCategory.SAR,
    launchDate: '2020-08-31',
    resolution: '0.5m (X-band SAR)',
    orbitType: OrbitType.SSO,
    launchVehicle: 'Electron',
    lifespanYears: '3年',
    civilOrMilitary: '軍民通用',
  },
};

export function deriveOrbitTypeFromTLE(line1: string, line2: string): OrbitType {
  try {
    const inclination = parseFloat(line2.substring(8, 16).trim());
    const meanMotion = parseFloat(line2.substring(52, 63).trim());

    // Calculate semi-major axis (a) in km using Kepler's 3rd law
    // mu = 398600.4418 km^3/s^2, n in rad/s
    const nRadSec = (meanMotion * 2 * Math.PI) / 86400;
    const semiMajorAxisKm = Math.cbrt(398600.4418 / (nRadSec * nRadSec));
    const meanAltitudeKm = semiMajorAxisKm - 6371; // Earth radius ~6371km

    if (meanAltitudeKm > 35000 && meanAltitudeKm < 36500 && inclination < 20) {
      return OrbitType.GEO;
    }
    if (inclination >= 95 && inclination <= 102 && meanAltitudeKm < 1200) {
      return OrbitType.SSO;
    }
    if (meanAltitudeKm < 2000) {
      return OrbitType.LEO;
    }
    if (meanAltitudeKm >= 2000 && meanAltitudeKm < 35000) {
      return OrbitType.MEO;
    }
    return OrbitType.HEO;
  } catch {
    return OrbitType.LEO;
  }
}

export function getSatelliteMetadata(tle: TLEData): SatelliteMetadata {
  const staticData = STATIC_METADATA_DATABASE[tle.noradId];
  const derivedOrbit = deriveOrbitTypeFromTLE(tle.line1, tle.line2);

  return {
    noradId: tle.noradId,
    name: staticData?.name || tle.name,
    operator: staticData?.operator || '未公開',
    country: staticData?.country || '未公開',
    category: staticData?.category || SatelliteCategory.OTHER,
    launchDate: staticData?.launchDate || '未公開',
    resolution: staticData?.resolution || '未公開',
    orbitType: staticData?.orbitType || derivedOrbit,
    launchVehicle: staticData?.launchVehicle || '未公開',
    lifespanYears: staticData?.lifespanYears || '未公開',
    civilOrMilitary: staticData?.civilOrMilitary || '未公開',
  };
}

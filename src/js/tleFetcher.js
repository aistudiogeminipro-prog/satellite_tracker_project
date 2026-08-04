/**
 * TLEFetcher - Fetches and parses TLE / GP satellite data from APIs and local catalogs.
 */
export class TLEFetcher {
  constructor(catalogData = {}) {
    this.catalog = catalogData;
    this.baseUrl = 'https://celestrak.org/NORAD/elements/gp.php';
  }

  setCatalog(catalogData) {
    this.catalog = catalogData || {};
  }

  async fetchGroup(group = 'active') {
    try {
      const url = `${this.baseUrl}?GROUP=${encodeURIComponent(group)}&FORMAT=json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CelesTrak API HTTP error ${response.status}`);
      }
      const rawData = await response.json();
      return this._enrichSatelliteList(rawData);
    } catch (err) {
      console.warn(`CelesTrak fetch failed for group ${group}:`, err);
      return [];
    }
  }

  parseTLEText(tleText) {
    const lines = tleText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const results = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('1 ') && i + 1 < lines.length && lines[i + 1].startsWith('2 ')) {
        const line1 = lines[i];
        const line2 = lines[i + 1];
        const name = (i > 0 && !lines[i - 1].startsWith('1 ') && !lines[i - 1].startsWith('2 ')) 
          ? lines[i - 1] 
          : 'UNKNOWN SATELLITE';

        const noradId = parseInt(line1.substring(2, 7).trim(), 10);
        results.push(this._enrichSatellite({
          OBJECT_NAME: name,
          NORAD_CAT_ID: noradId,
          TLE_LINE1: line1,
          TLE_LINE2: line2
        }));
      }
    }
    return results;
  }

  _enrichSatelliteList(rawList) {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(item => this._enrichSatellite(item));
  }

  _enrichSatellite(item) {
    const noradId = item.NORAD_CAT_ID || item.noradId;
    const catEntry = this.catalog[String(noradId)] || {};

    return {
      noradId: noradId,
      name: catEntry.name || item.OBJECT_NAME || `SAT-${noradId}`,
      cosparId: catEntry.cosparId || item.OBJECT_ID || 'N/A',
      company: catEntry.company || 'Unknown Operator',
      country: catEntry.country || 'Unknown',
      type: catEntry.type || 'General Satellite',
      sensorType: catEntry.sensorType || 'N/A',
      launchDate: catEntry.launchDate || (item.LAUNCH_DATE || 'N/A'),
      altitudeKm: catEntry.altitudeKm || 500,
      maxResolutionMeters: catEntry.maxResolutionMeters !== undefined ? catEntry.maxResolutionMeters : 10.0,
      orbitType: catEntry.orbitType || 'LEO',
      launchVehicle: catEntry.launchVehicle || 'Unknown Rocket',
      serviceLifeYears: catEntry.serviceLifeYears || 5,
      category: catEntry.category || 'Civilian / Commercial',
      description: catEntry.description || 'No detailed description available.',
      tleLine1: item.TLE_LINE1,
      tleLine2: item.TLE_LINE2,
      rawGP: item
    };
  }
}

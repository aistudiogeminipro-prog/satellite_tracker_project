import { TLEFetcher } from './tleFetcher.js';
import { OrbitCalculator } from './orbitCalculator.js';
import { CesiumViewerManager } from './cesiumViewer.js';
import { AuthenticityAnalyzer } from './authenticityAnalyzer.js';

class App {
  constructor() {
    this.cesiumMgr = null;
    this.tleFetcher = null;
    this.satellites = []; // Enriched satellite objects with satrec
    this.selectedSatellite = null;
    this.catalog = {};

    this.init();
  }

  async init() {
    // 1. Initialize Cesium Globe
    this.cesiumMgr = new CesiumViewerManager('cesiumContainer');

    // 2. Load Local Satellite Catalog JSON
    try {
      const res = await fetch('src/data/satelliteCatalog.json');
      if (res.ok) {
        this.catalog = await res.json();
      }
    } catch (e) {
      console.warn('Could not load satelliteCatalog.json, using defaults.', e);
    }

    this.tleFetcher = new TLEFetcher(this.catalog);

    // 3. Setup UI Event Listeners
    this.setupUIEvents();

    // 4. Default Load CelesTrak Active Satellites
    await this.loadActiveSatellites();

    // 5. Start Animation Loop for Satellite Orbit Propagation
    this.startRealtimeLoop();
  }

  async loadActiveSatellites() {
    const list = await this.tleFetcher.fetchGroup('active');
    
    // Parse satrec for each satellite
    this.satellites = list.map(sat => {
      if (sat.tleLine1 && sat.tleLine2) {
        sat.satrec = OrbitCalculator.parseTLELines(sat.tleLine1, sat.tleLine2);
      }
      return sat;
    }).filter(s => s.satrec !== null);

    this.updateSatelliteListView(this.satellites);
  }

  setupUIEvents() {
    // Tab Switching
    const tabFilterBtn = document.getElementById('tabFilterBtn');
    const tabAuthBtn = document.getElementById('tabAuthBtn');
    const tabFilterContent = document.getElementById('tabFilterContent');
    const tabAuthContent = document.getElementById('tabAuthContent');

    tabFilterBtn.addEventListener('click', () => {
      tabFilterBtn.classList.add('active', 'bg-blue-600', 'text-white');
      tabFilterBtn.classList.remove('bg-slate-800', 'text-slate-300');
      tabAuthBtn.classList.remove('active', 'bg-blue-600', 'text-white');
      tabAuthBtn.classList.add('bg-slate-800', 'text-slate-300');

      tabFilterContent.classList.remove('hidden');
      tabAuthContent.classList.add('hidden');
    });

    tabAuthBtn.addEventListener('click', () => {
      tabAuthBtn.classList.add('active', 'bg-blue-600', 'text-white');
      tabAuthBtn.classList.remove('bg-slate-800', 'text-slate-300');
      tabFilterBtn.classList.remove('active', 'bg-blue-600', 'text-white');
      tabFilterBtn.classList.add('bg-slate-800', 'text-slate-300');

      tabAuthContent.classList.remove('hidden');
      tabFilterContent.classList.add('hidden');
    });

    // Basemap Selection
    document.getElementById('basemapSelect').addEventListener('change', (e) => {
      this.cesiumMgr.setBasemap(e.target.value);
    });

    // Fetch CelesTrak Button
    document.getElementById('btnFetchActive').addEventListener('click', () => {
      this.loadActiveSatellites();
    });

    // Search and Filters
    document.getElementById('searchInput').addEventListener('input', () => this.filterSatellites());
    document.getElementById('filterTypeSelect').addEventListener('change', () => this.filterSatellites());
    document.getElementById('filterCountrySelect').addEventListener('change', () => this.filterSatellites());

    // Detail Card Close
    document.getElementById('closeDetailCardBtn').addEventListener('click', () => {
      document.getElementById('satelliteDetailCard').classList.add('hidden');
      this.cesiumMgr.clearOrbitTrajectories();
      this.selectedSatellite = null;
    });

    // Run Authenticity Check
    document.getElementById('btnRunAuthCheck').addEventListener('click', () => this.runAuthenticityCheck());

    // Cesium Entity Click Event Listener
    const handler = new Cesium.ScreenSpaceEventHandler(this.cesiumMgr.viewer.scene.canvas);
    handler.setInputAction((click) => {
      const pickedObject = this.cesiumMgr.viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.userData) {
        this.selectSatellite(pickedObject.id.userData);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Set Default Datetime Input in Auth Tab to now
    const nowISO = new Date().toISOString().slice(0, 16);
    document.getElementById('authTimeInput').value = nowISO;
  }

  filterSatellites() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const typeVal = document.getElementById('filterTypeSelect').value;
    const countryVal = document.getElementById('filterCountrySelect').value;

    const filtered = this.satellites.filter(sat => {
      const matchQuery = !query || sat.name.toLowerCase().includes(query) || String(sat.noradId).includes(query);
      const matchType = typeVal === 'ALL' || sat.sensorType.includes(typeVal) || sat.type.includes(typeVal);
      const matchCountry = countryVal === 'ALL' || sat.country.includes(countryVal);
      return matchQuery && matchType && matchCountry;
    });

    this.updateSatelliteListView(filtered);
  }

  updateSatelliteListView(satList) {
    const container = document.getElementById('satListView');
    document.getElementById('satCountText').innerText = satList.length;

    container.innerHTML = '';
    if (satList.length === 0) {
      container.innerHTML = '<li class="text-slate-500 text-center py-4">未找到符合條件之衛星</li>';
      return;
    }

    satList.slice(0, 50).forEach(sat => {
      const li = document.createElement('li');
      li.className = 'p-2 bg-slate-900/80 hover:bg-slate-800 rounded border border-slate-800/80 flex items-center justify-between cursor-pointer transition-all';
      li.innerHTML = `
        <div>
          <div class="font-bold text-slate-200">${sat.name}</div>
          <div class="text-[10px] text-slate-400">NORAD: ${sat.noradId} | ${sat.country} | ${sat.maxResolutionMeters}m</div>
        </div>
        <span class="text-xs text-blue-400 font-mono">定位 ›</span>
      `;
      li.addEventListener('click', () => this.selectSatellite(sat));
      container.appendChild(li);
    });
  }

  selectSatellite(satData) {
    this.selectedSatellite = satData;

    // 1. Calculate & Render Past/Future 24h Trajectories
    const now = new Date();
    const { pastPoints, futurePoints } = OrbitCalculator.generateTrajectory(satData.satrec, now, 24, 24, 10);
    this.cesiumMgr.renderOrbitTrajectories(pastPoints, futurePoints);

    // 2. Populate Detail Floating Card
    document.getElementById('cardSatName').innerText = satData.name;
    document.getElementById('cardSatNorad').innerText = `NORAD ID: ${satData.noradId} | COSPAR: ${satData.cosparId}`;
    document.getElementById('cardSatCompany').innerText = satData.company;
    document.getElementById('cardSatCountry').innerText = satData.country;
    document.getElementById('cardSatType').innerText = satData.type;
    document.getElementById('cardSatCategory').innerText = satData.category;
    document.getElementById('cardSatRes').innerText = `${satData.maxResolutionMeters} 米`;
    document.getElementById('cardSatAlt').innerText = `${satData.altitudeKm} km`;
    document.getElementById('cardSatLaunchDate').innerText = satData.launchDate;
    document.getElementById('cardSatRocket').innerText = satData.launchVehicle;
    document.getElementById('cardSatDesc').innerText = satData.description;

    document.getElementById('satelliteDetailCard').classList.remove('hidden');

    // 3. Fly Camera to Satellite Current Position
    const pos = OrbitCalculator.getSatellitePositionAtDate(satData.satrec, now);
    if (pos) {
      const cartesian = Cesium.Cartesian3.fromDegrees(pos.longitudeDeg, pos.latitudeDeg, pos.heightKm * 1000);
      this.cesiumMgr.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(pos.longitudeDeg, pos.latitudeDeg, pos.heightKm * 3000)
      });
    }
  }

  runAuthenticityCheck() {
    const lat = parseFloat(document.getElementById('authLatInput').value);
    const lon = parseFloat(document.getElementById('authLonInput').value);
    const dateStr = document.getElementById('authTimeInput').value;
    const resMeters = parseFloat(document.getElementById('authResInput').value);
    const offNadir = parseFloat(document.getElementById('authOffNadirInput').value);
    const azimuth = parseFloat(document.getElementById('authAzimuthInput').value);

    if (isNaN(lat) || isNaN(lon) || !dateStr) {
      alert('請輸入有效的經緯度與拍攝時間！');
      return;
    }

    const targetDate = new Date(dateStr);

    // 1. Set Cesium Clock & Place Marker
    this.cesiumMgr.setTime(targetDate);
    this.cesiumMgr.setTargetMarker(lat, lon, '影像宣稱拍攝地點');

    // 2. Run Authenticity Analysis Algorithm
    const analysis = AuthenticityAnalyzer.analyze({
      targetLat: lat,
      targetLon: lon,
      targetDate: targetDate,
      imageResolutionMeters: resMeters,
      inputOffNadirDeg: offNadir,
      inputAzimuthDeg: azimuth
    }, this.satellites);

    // 3. Render Results Box
    const resultBox = document.getElementById('authResultBox');
    const badge = document.getElementById('verdictBadge');
    const solarText = document.getElementById('solarStatusText');
    const summaryText = document.getElementById('summaryResultText');
    const candidateList = document.getElementById('candidateSatList');

    resultBox.classList.remove('hidden');

    solarText.innerText = `☀️ 目標地太陽狀態: ${analysis.solarInfo.statusLabel} (仰角: ${analysis.solarInfo.elevationDeg}°)`;
    summaryText.innerText = analysis.summaryText;

    if (analysis.verdict === 'HIGH_RISK_AI_FAKE') {
      badge.className = 'px-2 py-0.5 text-xs font-bold rounded-full bg-red-950 text-red-400 border border-red-700';
      badge.innerText = '高風險 AI 偽冒 / 時間造假';
    } else if (analysis.verdict === 'SUSPICIOUS_NO_MATCH') {
      badge.className = 'px-2 py-0.5 text-xs font-bold rounded-full bg-amber-950 text-amber-400 border border-amber-700';
      badge.innerText = '疑點：無匹配衛星';
    } else {
      badge.className = 'px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700';
      badge.innerText = '幾何光照吻合 (可信度高)';
    }

    // Populate Candidate Satellites
    candidateList.innerHTML = '';
    if (analysis.candidateMatches.length === 0) {
      candidateList.innerHTML = '<li class="text-slate-500 text-center py-2">無符合相容條件之衛星軌跡過境</li>';
    } else {
      analysis.candidateMatches.slice(0, 5).forEach(match => {
        const sat = match.satellite;
        const geom = match.geometry;
        const li = document.createElement('li');
        li.className = 'p-2 bg-slate-800/90 rounded border border-slate-700 cursor-pointer hover:border-amber-500 transition-all';
        li.innerHTML = `
          <div class="flex justify-between items-center font-bold text-slate-200">
            <span>${sat.name}</span>
            <span class="text-amber-400">${match.matchScore}% 吻合</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-1">
            推算拍攝角: ${geom.offNadirDeg}° | 方位角: ${geom.azimuthDeg}° | 仰角: ${geom.elevationDeg}°
          </div>
        `;
        li.addEventListener('click', () => {
          this.selectSatellite(sat);
          const cartesian = Cesium.Cartesian3.fromDegrees(match.satPosition.longitudeDeg, match.satPosition.latitudeDeg, match.satPosition.heightKm * 1000);
          this.cesiumMgr.drawSensorSightLine(cartesian, lat, lon);
        });
        candidateList.appendChild(li);
      });
    }
  }

  startRealtimeLoop() {
    const updatePositions = () => {
      const now = new Date();
      this.satellites.forEach(sat => {
        const pos = OrbitCalculator.getSatellitePositionAtDate(sat.satrec, now);
        if (pos) {
          const cartesian = Cesium.Cartesian3.fromDegrees(pos.longitudeDeg, pos.latitudeDeg, pos.heightKm * 1000);
          this.cesiumMgr.updateSatelliteEntity(sat, cartesian);
        }
      });
    };

    updatePositions();
    setInterval(updatePositions, 3000); // update every 3s
  }
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

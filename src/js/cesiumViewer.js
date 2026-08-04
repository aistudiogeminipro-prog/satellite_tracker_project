/**
 * CesiumViewerManager - Manages Cesium 3D Globe, Basemap Providers, Day/Night Lighting, Satellite Icons & Orbit Polyline Rendering
 */
export class CesiumViewerManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.viewer = null;
    this.satelliteEntities = new Map(); // noradId -> Entity
    this.orbitEntities = {
      pastPolyline: null,
      futurePolyline: null
    };
    this.targetMarker = null;
    this.sensorCone = null;

    this.initViewer();
  }

  initViewer() {
    // Set Cesium Ion default token to empty or demo
    if (window.Cesium) {
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZW1vIiwiaWF0IjoxNTAwMDAwMDAwfQ.demo';
    }

    // Default ESRI World Imagery provider
    const esriProvider = new Cesium.ArcGisMapServerImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    });

    this.viewer = new Cesium.Viewer(this.containerId, {
      imageryProvider: esriProvider,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      infoBox: false,
      selectionIndicator: true,
      timeline: true,
      animation: true,
      navigationHelpButton: false,
      sceneModePicker: true,
      shadows: true
    });

    // Enable Lighting and Day/Night Terminator
    this.viewer.scene.globe.enableLighting = true;
    this.viewer.scene.globe.showGroundAtmosphere = true;
    this.viewer.scene.skyAtmosphere.show = true;

    // Adjust Initial Camera
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(121.5, 23.5, 12000000.0) // Taiwan & East Asia view
    });
  }

  /**
   * Switch basemap layer
   * @param {string} layerKey - 'esri', 'osm', 'carto_dark'
   */
  setBasemap(layerKey) {
    const layers = this.viewer.imageryLayers;
    layers.removeAll();

    let provider;
    switch (layerKey) {
      case 'osm':
        provider = new Cesium.OpenStreetMapImageryProvider({
          url: 'https://a.tile.openstreetmap.org/'
        });
        break;
      case 'carto_dark':
        provider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
        });
        break;
      case 'esri':
      default:
        provider = new Cesium.ArcGisMapServerImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        });
        break;
    }
    layers.addImageryProvider(provider);
  }

  /**
   * Update or add a satellite entity on the globe
   */
  updateSatelliteEntity(satData, positionCartesian) {
    const noradId = satData.noradId;
    let entity = this.satelliteEntities.get(noradId);

    if (!entity) {
      entity = this.viewer.entities.add({
        id: `sat_${noradId}`,
        name: satData.name,
        position: positionCartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.NONE
        },
        label: {
          text: satData.name,
          font: '12px sans-serif',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -12),
          show: true
        }
      });
      entity.userData = satData;
      this.satelliteEntities.set(noradId, entity);
    } else {
      entity.position = positionCartesian;
    }
  }

  /**
   * Render Past 24h (Magenta) and Future 24h (Cyan) Orbit Trajectories
   */
  renderOrbitTrajectories(pastPoints, futurePoints) {
    this.clearOrbitTrajectories();

    if (pastPoints && pastPoints.length > 0) {
      const pastCartesians = pastPoints.map(p => 
        Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.heightKm * 1000)
      );
      this.orbitEntities.pastPolyline = this.viewer.entities.add({
        name: 'Past 24h Trajectory',
        polyline: {
          positions: pastCartesians,
          width: 2.5,
          material: new Cesium.ColorMaterialProperty(Cesium.Color.MAGENTA.withAlpha(0.85))
        }
      });
    }

    if (futurePoints && futurePoints.length > 0) {
      const futureCartesians = futurePoints.map(p => 
        Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.heightKm * 1000)
      );
      this.orbitEntities.futurePolyline = this.viewer.entities.add({
        name: 'Future 24h Trajectory',
        polyline: {
          positions: futureCartesians,
          width: 2.5,
          material: new Cesium.ColorMaterialProperty(Cesium.Color.CYAN.withAlpha(0.85))
        }
      });
    }
  }

  clearOrbitTrajectories() {
    if (this.orbitEntities.pastPolyline) {
      this.viewer.entities.remove(this.orbitEntities.pastPolyline);
      this.orbitEntities.pastPolyline = null;
    }
    if (this.orbitEntities.futurePolyline) {
      this.viewer.entities.remove(this.orbitEntities.futurePolyline);
      this.orbitEntities.futurePolyline = null;
    }
  }

  /**
   * Place or update target image verification location marker
   */
  setTargetMarker(lat, lon, label = 'Target Image Location') {
    if (this.targetMarker) {
      this.viewer.entities.remove(this.targetMarker);
    }

    const cartesian = Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    this.targetMarker = this.viewer.entities.add({
      name: label,
      position: cartesian,
      billboard: {
        image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%23FF3333"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.2
      },
      label: {
        text: label,
        font: '13px bold sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 3,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 5)
      }
    });

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 500000.0)
    });
  }

  /**
   * Draw visual Sensor Cone / Line-of-sight ray between candidate satellite and target point
   */
  drawSensorSightLine(satPosCartesian, targetLat, targetLon) {
    if (this.sensorCone) {
      this.viewer.entities.remove(this.sensorCone);
    }

    const targetCartesian = Cesium.Cartesian3.fromDegrees(targetLon, targetLat, 0);
    this.sensorCone = this.viewer.entities.add({
      name: 'Satellite Imaging Sight Line',
      polyline: {
        positions: [satPosCartesian, targetCartesian],
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
          dashLength: 16.0
        })
      }
    });
  }

  /**
   * Set Cesium clock to a historical/target Date
   */
  setTime(targetDate) {
    const julianDate = Cesium.JulianDate.fromDate(targetDate);
    this.viewer.clock.currentTime = julianDate;
  }
}

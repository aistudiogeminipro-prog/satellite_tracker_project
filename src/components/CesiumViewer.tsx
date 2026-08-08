import React, { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { BasemapType } from '../types/basemap';
import { TLEData } from '../types/satellite';
import { propagateSatellitePosition, generateOrbitTrajectory } from '../services/sgp4Service';
import styles from './CesiumViewer.module.css';

interface CesiumViewerProps {
  selectedBasemap: BasemapType;
  enableLighting: boolean;
  satellites: TLEData[];
  selectedNoradId: string | null;
  onSatelliteSelect?: (noradId: string | null) => void;
  restoredScenario?: {
    timestamp: Date;
    targetLat: number;
    targetLon: number;
  } | null;
}

export const CesiumViewer: React.FC<CesiumViewerProps> = ({
  selectedBasemap,
  enableLighting,
  satellites,
  selectedNoradId,
  onSatelliteSelect,
  restoredScenario,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null);
  const trajectoryDataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

  // Initialize Viewer
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      baseLayerPicker: false,
    });

    viewer.scene.globe.enableLighting = enableLighting;
    viewer.clock.shouldAnimate = true;

    const satDataSource = new Cesium.CustomDataSource('satellites');
    const trajDataSource = new Cesium.CustomDataSource('trajectories');

    viewer.dataSources.add(satDataSource);
    viewer.dataSources.add(trajDataSource);

    dataSourceRef.current = satDataSource;
    trajectoryDataSourceRef.current = trajDataSource;
    viewerRef.current = viewer;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.id) {
        const idStr = pickedObject.id.id as string;
        if (idStr.startsWith('sat-')) {
          const noradId = idStr.replace('sat-', '');
          if (onSatelliteSelect) onSatelliteSelect(noradId);
          return;
        }
      }
      if (onSatelliteSelect) onSatelliteSelect(null);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  // Handle Scenario Restoration (Clock jump & Camera FlyTo)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !restoredScenario) return;

    // Set Simulation Clock to historical timestamp
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(restoredScenario.timestamp);

    // Fly camera to ground target location
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        restoredScenario.targetLon,
        restoredScenario.targetLat,
        1500000 // 1,500 km altitude view
      ),
      duration: 2,
    });
  }, [restoredScenario]);

  // Handle Lighting Toggle
  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.globe.enableLighting = enableLighting;
    }
  }, [enableLighting]);

  // Handle Basemap Switch
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.imageryLayers.removeAll();

    if (selectedBasemap === BasemapType.OPEN_STREET_MAP) {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        })
      );
    } else {
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
        })
      );
    }
  }, [selectedBasemap]);

  // Render & Update Satellite Icons via SGP4 on Clock Tick
  useEffect(() => {
    const viewer = viewerRef.current;
    const ds = dataSourceRef.current;
    if (!viewer || !ds) return;

    ds.entities.removeAll();

    satellites.forEach((sat) => {
      const isSelected = sat.noradId === selectedNoradId;
      ds.entities.add({
        id: `sat-${sat.noradId}`,
        name: sat.name,
        point: {
          pixelSize: isSelected ? 12 : 8,
          color: isSelected ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: sat.name,
          font: '12px system-ui',
          pixelOffset: new Cesium.Cartesian2(0, -12),
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          scale: 0.8,
        },
      });
    });

    const removeTickListener = viewer.clock.onTick.addEventListener((clock) => {
      const date = Cesium.JulianDate.toDate(clock.currentTime);

      satellites.forEach((sat) => {
        const entity = ds.entities.getById(`sat-${sat.noradId}`);
        if (!entity) return;

        const pos = propagateSatellitePosition(sat, date);
        if (pos) {
          const cartesian = Cesium.Cartesian3.fromDegrees(
            pos.longitudeDeg,
            pos.latitudeDeg,
            pos.heightKm * 1000
          );
          entity.position = new Cesium.ConstantPositionProperty(cartesian);
        }
      });
    });

    return () => {
      removeTickListener();
    };
  }, [satellites, selectedNoradId]);

  // Draw 24h Past & Future Trajectories On-Demand when Selected
  useEffect(() => {
    const viewer = viewerRef.current;
    const trajDs = trajectoryDataSourceRef.current;
    if (!viewer || !trajDs) return;

    trajDs.entities.removeAll();

    if (!selectedNoradId) return;

    const selectedSat = satellites.find((s) => s.noradId === selectedNoradId);
    if (!selectedSat) return;

    const currentDate = Cesium.JulianDate.toDate(viewer.clock.currentTime);
    const trajectory = generateOrbitTrajectory(selectedSat, currentDate, 24, 5);

    const pastCartesianPositions = trajectory.pastPositions.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.longitudeDeg, p.latitudeDeg, p.heightKm * 1000)
    );

    const futureCartesianPositions = trajectory.futurePositions.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.longitudeDeg, p.latitudeDeg, p.heightKm * 1000)
    );

    trajDs.entities.add({
      id: `traj-past-${selectedNoradId}`,
      polyline: {
        positions: pastCartesianPositions,
        width: 3,
        material: Cesium.Color.CYAN.withAlpha(0.85),
      },
    });

    trajDs.entities.add({
      id: `traj-future-${selectedNoradId}`,
      polyline: {
        positions: futureCartesianPositions,
        width: 3,
        material: Cesium.Color.YELLOW.withAlpha(0.85),
      },
    });
  }, [selectedNoradId, satellites]);

  return <div ref={containerRef} className={styles.globeContainer} data-testid="cesium-container" />;
};

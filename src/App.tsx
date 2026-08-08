import React, { useState, useEffect } from 'react';
import { CesiumViewer } from './components/CesiumViewer';
import { LayerControl } from './components/LayerControl';
import { DataLoaderModal } from './components/DataLoaderModal';
import { SearchAndFilterPanel } from './components/SearchAndFilterPanel';
import { SatelliteDetailCard } from './components/SatelliteDetailCard';
import { ReverseLookupModal } from './components/ReverseLookupModal';
import { BasemapType } from './types/basemap';
import { DataSourceMode, FetchTLERequest, TLEData } from './types/satellite';
import { SatelliteMetadata } from './types/metadata';
import { CandidateResult } from './types/reverseLookup';
import { fetchTLEData } from './services/dataAdapter';
import { getSatelliteMetadata } from './services/metadataService';
import './App.css';

function App() {
  const [currentBasemap, setCurrentBasemap] = useState<BasemapType>(BasemapType.ESRI_WORLD_IMAGERY);
  const [enableLighting, setEnableLighting] = useState<boolean>(true);
  const [isDataLoaderOpen, setIsDataLoaderOpen] = useState<boolean>(false);
  const [isReverseLookupOpen, setIsReverseLookupOpen] = useState<boolean>(false);
  const [satelliteData, setSatelliteData] = useState<TLEData[]>([]);
  const [selectedNoradId, setSelectedNoradId] = useState<string | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<SatelliteMetadata | null>(null);
  const [restoredScenario, setRestoredScenario] = useState<{
    timestamp: Date;
    targetLat: number;
    targetLon: number;
  } | null>(null);

  useEffect(() => {
    fetchTLEData({ mode: DataSourceMode.SNAPSHOT })
      .then((data) => setSatelliteData(data))
      .catch((err) => console.error('Error loading default TLE:', err));
  }, []);

  const handleLoadData = async (req: FetchTLERequest) => {
    try {
      const data = await fetchTLEData(req);
      setSatelliteData(data);
    } catch (err) {
      alert(`載入失敗: ${(err as Error).message}`);
    }
  };

  const handleSelectSatellite = (noradId: string | null) => {
    setSelectedNoradId(noradId);
    if (!noradId) {
      setSelectedMetadata(null);
      return;
    }
    const sat = satelliteData.find((s) => s.noradId === noradId);
    if (sat) {
      setSelectedMetadata(getSatelliteMetadata(sat));
    }
  };

  const handleRestoreScenario = (candidate: CandidateResult, targetLat: number, targetLon: number) => {
    handleSelectSatellite(candidate.sat.noradId);
    setRestoredScenario({
      timestamp: candidate.matchTimestamp,
      targetLat,
      targetLon,
    });
  };

  return (
    <div className="app-container">
      <CesiumViewer
        selectedBasemap={currentBasemap}
        enableLighting={enableLighting}
        satellites={satelliteData}
        selectedNoradId={selectedNoradId}
        onSatelliteSelect={handleSelectSatellite}
        restoredScenario={restoredScenario}
      />
      <SearchAndFilterPanel
        satellites={satelliteData}
        onSelectSatellite={(sat) => handleSelectSatellite(sat.noradId)}
      />
      <LayerControl
        currentBasemap={currentBasemap}
        onBasemapChange={setCurrentBasemap}
        enableLighting={enableLighting}
        onLightingToggle={setEnableLighting}
        onOpenDataLoader={() => setIsDataLoaderOpen(true)}
        onOpenReverseLookup={() => setIsReverseLookupOpen(true)}
        satelliteCount={satelliteData.length}
      />
      <DataLoaderModal
        isOpen={isDataLoaderOpen}
        onClose={() => setIsDataLoaderOpen(false)}
        onLoadData={handleLoadData}
      />
      <ReverseLookupModal
        isOpen={isReverseLookupOpen}
        onClose={() => setIsReverseLookupOpen(false)}
        satellites={satelliteData}
        onRestoreScenario={handleRestoreScenario}
      />
      <SatelliteDetailCard
        metadata={selectedMetadata}
        onClose={() => handleSelectSatellite(null)}
      />
    </div>
  );
}

export default App;

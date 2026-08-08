import React from 'react';
import { BasemapType, BASEMAP_OPTIONS } from '../types/basemap';
import styles from './LayerControl.module.css';

interface LayerControlProps {
  currentBasemap: BasemapType;
  onBasemapChange: (basemap: BasemapType) => void;
  enableLighting: boolean;
  onLightingToggle: (enabled: boolean) => void;
  onOpenDataLoader: () => void;
  onOpenReverseLookup: () => void;
  satelliteCount: number;
}

export const LayerControl: React.FC<LayerControlProps> = ({
  currentBasemap,
  onBasemapChange,
  enableLighting,
  onLightingToggle,
  onOpenDataLoader,
  onOpenReverseLookup,
  satelliteCount,
}) => {
  return (
    <div className={styles.controlPanel} data-testid="layer-control-panel">
      <h3 className={styles.title}>底圖與工具面板</h3>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>系統工具功能</div>
        <div style={{ marginBottom: '8px', fontSize: '13px', color: '#38bdf8' }}>
          已載入衛星數: {satelliteCount} 顆
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onOpenDataLoader}
            style={{
              width: '100%',
              padding: '8px',
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            data-testid="open-data-loader-btn"
          >
            設定資料來源 (Data Adapter)
          </button>
          <button
            onClick={onOpenReverseLookup}
            style={{
              width: '100%',
              padding: '8px',
              background: '#059669',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            data-testid="open-reverse-lookup-btn"
          >
            衛星影像偽冒反查引擎
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>底圖選擇</div>
        <div className={styles.radioGroup}>
          {BASEMAP_OPTIONS.map((opt) => (
            <label key={opt.id} className={styles.label}>
              <input
                type="radio"
                name="basemap"
                value={opt.id}
                checked={currentBasemap === opt.id}
                onChange={() => onBasemapChange(opt.id)}
                data-testid={`basemap-radio-${opt.id}`}
              />
              <span>{opt.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>太陽光照 / 日夜區域</div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={enableLighting}
            onChange={(e) => onLightingToggle(e.target.checked)}
            data-testid="lighting-checkbox"
          />
          <span>顯示太陽光照與陰影</span>
        </label>
      </div>
    </div>
  );
};

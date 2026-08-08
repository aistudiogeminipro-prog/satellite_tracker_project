import React, { useState } from 'react';
import { TLEData } from '../types/satellite';
import { ReverseLookupQuery, CandidateResult } from '../types/reverseLookup';
import { performReverseLookup } from '../services/reverseLookupEngine';
import styles from './ReverseLookupModal.module.css';

interface ReverseLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  satellites: TLEData[];
  onRestoreScenario: (candidate: CandidateResult, targetLat: number, targetLon: number) => void;
}

export const ReverseLookupModal: React.FC<ReverseLookupModalProps> = ({
  isOpen,
  onClose,
  satellites,
  onRestoreScenario,
}) => {
  const [lat, setLat] = useState<number>(25.033);
  const [lon, setLon] = useState<number>(121.565);
  const [timestampISO, setTimestampISO] = useState<string>('2024-05-10T14:00:00.000Z');
  const [timeWindowMin, setTimeWindowMin] = useState<number>(30);
  const [offNadirMin, setOffNadirMin] = useState<number>(10);
  const [offNadirMax, setOffNadirMax] = useState<number>(45);
  const [results, setResults] = useState<CandidateResult[] | null>(null);

  if (!isOpen) return null;

  const handleSearch = () => {
    const query: ReverseLookupQuery = {
      latitude: lat,
      longitude: lon,
      altitudeMeters: 0,
      timestampISO,
      timeWindowMinutes: timeWindowMin,
      offNadirMinDeg: offNadirMin,
      offNadirMaxDeg: offNadirMax,
    };

    const res = performReverseLookup(satellites, query);
    setResults(res);
  };

  return (
    <div className={styles.modalOverlay} data-testid="reverse-lookup-modal">
      <div className={styles.modalContent}>
        <h3 className={styles.title}>衛星影像偽冒反查引擎 (Reverse Lookup)</h3>

        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>拍攝點緯度 (Latitude)</label>
            <input
              type="number"
              step="0.001"
              className={styles.input}
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              data-testid="input-lat"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>拍攝點經度 (Longitude)</label>
            <input
              type="number"
              step="0.001"
              className={styles.input}
              value={lon}
              onChange={(e) => setLon(parseFloat(e.target.value))}
              data-testid="input-lon"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>拍攝時間戳 (UTC Timestamp)</label>
            <input
              type="text"
              className={styles.input}
              value={timestampISO}
              onChange={(e) => setTimestampISO(e.target.value)}
              data-testid="input-timestamp"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>時間搜尋公差 (± 分鐘)</label>
            <input
              type="number"
              className={styles.input}
              value={timeWindowMin}
              onChange={(e) => setTimeWindowMin(parseInt(e.target.value) || 0)}
              data-testid="input-time-window"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>最小拍攝角 Min Off-Nadir (°)</label>
            <input
              type="number"
              className={styles.input}
              value={offNadirMin}
              onChange={(e) => setOffNadirMin(parseFloat(e.target.value) || 0)}
              data-testid="input-offnadir-min"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>最大拍攝角 Max Off-Nadir (°)</label>
            <input
              type="number"
              className={styles.input}
              value={offNadirMax}
              onChange={(e) => setOffNadirMax(parseFloat(e.target.value) || 0)}
              data-testid="input-offnadir-max"
            />
          </div>
        </div>

        <div className={styles.btnGroup}>
          <button className={styles.cancelBtn} onClick={onClose}>
            關閉
          </button>
          <button className={styles.submitBtn} onClick={handleSearch} data-testid="run-reverse-lookup-btn">
            執行反查比對
          </button>
        </div>

        {results !== null && (
          <div className={styles.resultsArea} data-testid="lookup-results-area">
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#38bdf8' }}>
              反查候選衛星清單 ({results.length} 顆)
            </h4>
            {results.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                在指定時間公差與角度範圍內未找到符合條件之衛星。
              </p>
            ) : (
              results.map((item) => (
                <div key={item.sat.noradId} className={styles.resultItem}>
                  <div className={styles.candidateInfo}>
                    <span className={styles.candidateTitle}>{item.meta.name}</span>
                    <span className={item.isDaylight ? styles.badgeDay : styles.badgeNight}>
                      {item.isDaylight ? '白晝成像' : '夜間 SAR'}
                    </span>
                    <div className={styles.candidateDetails}>
                      拍攝角: {item.offNadirDeg}° | 方位角: {item.azimuthDeg}° | 斜距: {item.distanceKm} km |{' '}
                      {item.meta.category}
                    </div>
                  </div>
                  <button
                    className={styles.restoreBtn}
                    onClick={() => {
                      onRestoreScenario(item, lat, lon);
                      onClose();
                    }}
                    data-testid={`restore-btn-${item.sat.noradId}`}
                  >
                    情境還原
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

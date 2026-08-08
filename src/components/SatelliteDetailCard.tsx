import React from 'react';
import { SatelliteMetadata } from '../types/metadata';
import styles from './SatelliteDetailCard.module.css';

interface SatelliteDetailCardProps {
  metadata: SatelliteMetadata | null;
  onClose: () => void;
}

export const SatelliteDetailCard: React.FC<SatelliteDetailCardProps> = ({
  metadata,
  onClose,
}) => {
  if (!metadata) return null;

  return (
    <div className={styles.card} data-testid="satellite-detail-card">
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{metadata.name}</h3>
          <div className={styles.subtitle}>NORAD ID: {metadata.noradId}</div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} data-testid="close-detail-card-btn">
          ✕
        </button>
      </div>

      <div className={styles.grid}>
        <div>
          <div className={styles.fieldLabel}>衛星類別</div>
          <div className={styles.fieldValue}>
            <span className={styles.badge}>{metadata.category}</span>
          </div>
        </div>

        <div>
          <div className={styles.fieldLabel}>軌道類型</div>
          <div className={styles.fieldValue}>{metadata.orbitType}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>營運公司 / 單位</div>
          <div className={styles.fieldValue}>{metadata.operator}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>國家 / 地區</div>
          <div className={styles.fieldValue}>{metadata.country}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>空間解析度</div>
          <div className={styles.fieldValue}>{metadata.resolution || '未公開'}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>軍用 / 民用</div>
          <div className={styles.fieldValue}>{metadata.civilOrMilitary}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>發射日期</div>
          <div className={styles.fieldValue}>{metadata.launchDate}</div>
        </div>

        <div>
          <div className={styles.fieldLabel}>搭載火箭</div>
          <div className={styles.fieldValue}>{metadata.launchVehicle}</div>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.pastDot} />
          <span>過去 24h 軌跡</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.futureDot} />
          <span>未來 24h 軌跡</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { TLEData } from '../types/satellite';
import { SatelliteCategory, SatelliteMetadata } from '../types/metadata';
import { getSatelliteMetadata } from '../services/metadataService';
import styles from './SearchAndFilterPanel.module.css';

interface SearchAndFilterPanelProps {
  satellites: TLEData[];
  onSelectSatellite?: (sat: TLEData, meta: SatelliteMetadata) => void;
}

export const SearchAndFilterPanel: React.FC<SearchAndFilterPanelProps> = ({
  satellites,
  onSelectSatellite,
}) => {
  const [keyword, setKeyword] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<SatelliteCategory[]>([]);

  // Compute enriched satellites with metadata
  const enrichedList = useMemo(() => {
    return satellites.map((tle) => ({
      tle,
      meta: getSatelliteMetadata(tle),
    }));
  }, [satellites]);

  // Filter logic
  const filteredSatellites = useMemo(() => {
    return enrichedList.filter(({ tle, meta }) => {
      const matchKeyword =
        !keyword ||
        tle.name.toLowerCase().includes(keyword.toLowerCase()) ||
        tle.noradId.includes(keyword) ||
        meta.operator.toLowerCase().includes(keyword.toLowerCase());

      const matchCategory =
        selectedCategories.length === 0 || selectedCategories.includes(meta.category);

      return matchKeyword && matchCategory;
    });
  }, [enrichedList, keyword, selectedCategories]);

  const toggleCategory = (cat: SatelliteCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className={styles.panel} data-testid="search-filter-panel">
      <h3 className={styles.title}>衛星檢索與分類篩選</h3>

      <input
        type="text"
        placeholder="搜尋 NORAD ID / 名稱 / 營運單位..."
        className={styles.searchInput}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        data-testid="search-input"
      />

      <div className={styles.filterHeader}>
        <span>類型篩選</span>
        {selectedCategories.length > 0 && (
          <span
            style={{ color: '#38bdf8', cursor: 'pointer', textTransform: 'none' }}
            onClick={() => setSelectedCategories([])}
          >
            重設
          </span>
        )}
      </div>

      <div className={styles.categoryGroup}>
        {Object.values(SatelliteCategory).map((cat) => (
          <label key={cat} className={styles.catLabel}>
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => toggleCategory(cat)}
              data-testid={`cat-checkbox-${cat}`}
            />
            <span>{cat}</span>
          </label>
        ))}
      </div>

      <div className={styles.filterHeader}>
        <span>搜尋結果 ({filteredSatellites.length})</span>
      </div>

      <div className={styles.resultsList}>
        {filteredSatellites.map(({ tle, meta }) => (
          <div
            key={tle.noradId}
            className={styles.resultItem}
            onClick={() => onSelectSatellite && onSelectSatellite(tle, meta)}
            data-testid={`sat-item-${tle.noradId}`}
          >
            <div className={styles.satName}>
              {meta.name} ({meta.noradId})
            </div>
            <div className={styles.satMeta}>
              {meta.category} | {meta.orbitType} | {meta.country}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

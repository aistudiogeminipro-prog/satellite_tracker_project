import React, { useState } from 'react';
import { DataSourceMode, FetchTLERequest } from '../types/satellite';
import styles from './DataLoaderModal.module.css';

interface DataLoaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadData: (req: FetchTLERequest) => void;
}

export const DataLoaderModal: React.FC<DataLoaderModalProps> = ({
  isOpen,
  onClose,
  onLoadData,
}) => {
  const [mode, setMode] = useState<DataSourceMode>(DataSourceMode.SNAPSHOT);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [serverlessUrl, setServerlessUrl] = useState<string>('');
  const [apiToken, setApiToken] = useState<string>('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    onLoadData({
      mode,
      fileContent,
      serverlessUrl,
      apiToken,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} data-testid="data-loader-modal">
      <div className={styles.modalContent}>
        <h3 className={styles.title}>資料來源設定 (Data Adapter)</h3>

        <div className={styles.modeGroup}>
          <button
            className={`${styles.modeButton} ${mode === DataSourceMode.SNAPSHOT ? styles.modeButtonActive : ''}`}
            onClick={() => setMode(DataSourceMode.SNAPSHOT)}
            data-testid="mode-snapshot-btn"
          >
            預設快取
          </button>
          <button
            className={`${styles.modeButton} ${mode === DataSourceMode.CUSTOM_UPLOAD ? styles.modeButtonActive : ''}`}
            onClick={() => setMode(DataSourceMode.CUSTOM_UPLOAD)}
            data-testid="mode-upload-btn"
          >
            檔案上載
          </button>
          <button
            className={`${styles.modeButton} ${mode === DataSourceMode.SERVERLESS_PROXY ? styles.modeButtonActive : ''}`}
            onClick={() => setMode(DataSourceMode.SERVERLESS_PROXY)}
            data-testid="mode-serverless-btn"
          >
            API / Proxy
          </button>
        </div>

        {mode === DataSourceMode.SNAPSHOT && (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            載入系統每日預設更新之靜態 TLE 快取資料庫 (`tle-snapshot.json`)。
          </p>
        )}

        {mode === DataSourceMode.CUSTOM_UPLOAD && (
          <div className={styles.fileDropZone}>
            <input
              type="file"
              accept=".tle,.txt,.json"
              onChange={handleFileUpload}
              data-testid="file-input"
            />
            {fileName && <p style={{ margin: '8px 0 0 0', color: '#38bdf8' }}>已選擇: {fileName}</p>}
          </div>
        )}

        {mode === DataSourceMode.SERVERLESS_PROXY && (
          <div>
            <input
              type="text"
              placeholder="Serverless API Endpoint URL"
              className={styles.inputField}
              value={serverlessUrl}
              onChange={(e) => setServerlessUrl(e.target.value)}
              data-testid="serverless-url-input"
            />
            <input
              type="password"
              placeholder="Authorization Bearer Token (選填)"
              className={styles.inputField}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              data-testid="api-token-input"
            />
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>
            取消
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} data-testid="submit-load-btn">
            載入資料
          </button>
        </div>
      </div>
    </div>
  );
};

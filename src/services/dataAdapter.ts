import { TLEData, DataSourceMode, FetchTLERequest } from '../types/satellite';
import { parseTLEText } from './tleParser';

export async function fetchTLEData(req: FetchTLERequest): Promise<TLEData[]> {
  switch (req.mode) {
    case DataSourceMode.CUSTOM_UPLOAD: {
      if (!req.fileContent) {
        throw new Error('未上傳檔案內容');
      }
      try {
        const parsedJson = JSON.parse(req.fileContent);
        if (Array.isArray(parsedJson)) {
          return parsedJson as TLEData[];
        }
      } catch {
        // Not JSON, parse as TLE text
      }
      return parseTLEText(req.fileContent);
    }

    case DataSourceMode.SERVERLESS_PROXY: {
      if (!req.serverlessUrl) {
        throw new Error('請輸入 Serverless Proxy URL');
      }
      const response = await fetch(req.serverlessUrl, {
        headers: req.apiToken ? { Authorization: `Bearer ${req.apiToken}` } : {},
      });
      if (!response.ok) {
        throw new Error(`伺服器回應錯誤: ${response.statusText}`);
      }
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) return json;
      } catch {
        // Fallback to text parsing
      }
      return parseTLEText(text);
    }

    case DataSourceMode.SNAPSHOT:
    default: {
      const response = await fetch('./data/tle-snapshot.json');
      if (!response.ok) {
        throw new Error('無法載入預設 TLE 快取檔案');
      }
      return (await response.json()) as TLEData[];
    }
  }
}

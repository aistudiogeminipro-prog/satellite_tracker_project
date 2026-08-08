import { TLEData } from '../types/satellite';
import { parseTLEText } from './tleParser';

export async function fetchHistoricalTLE(
  targetDate: Date,
  serverlessProxyUrl?: string,
  token?: string
): Promise<TLEData[]> {
  const dateStr = targetDate.toISOString().split('T')[0];

  if (serverlessProxyUrl) {
    try {
      const url = `${serverlessProxyUrl}?date=${dateStr}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (Array.isArray(json)) return json;
        } catch {
          return parseTLEText(text);
        }
      }
    } catch {
      console.warn('Historical TLE proxy request failed, falling back to local snapshot');
    }
  }

  // Fallback to static snapshot
  const res = await fetch('./data/tle-snapshot.json');
  if (!res.ok) {
    throw new Error('無法載入歷史/備援 TLE 快取檔案');
  }
  return (await res.json()) as TLEData[];
}

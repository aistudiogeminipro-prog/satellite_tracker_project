import { TLEData } from '../types/satellite';

export function parseTLEText(rawText: string): TLEData[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results: TLEData[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].startsWith('1 ') && i + 1 < lines.length && lines[i + 1].startsWith('2 ')) {
      // 2-line format without name
      const line1 = lines[i];
      const line2 = lines[i + 1];
      const noradId = line1.substring(2, 7).trim();
      results.push({
        name: `SATELLITE-${noradId}`,
        line1,
        line2,
        noradId,
      });
      i += 2;
    } else if (
      i + 2 < lines.length &&
      lines[i + 1].startsWith('1 ') &&
      lines[i + 2].startsWith('2 ')
    ) {
      // 3-line format with name line
      const name = lines[i].replace(/^0\s+/, '').trim();
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      const noradId = line1.substring(2, 7).trim();
      results.push({
        name,
        line1,
        line2,
        noradId,
      });
      i += 3;
    } else {
      i++;
    }
  }

  return results;
}

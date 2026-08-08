import { describe, it, expect, vi } from 'vitest';
import { fetchHistoricalTLE } from './historicalTleService';

describe('historicalTleService', () => {
  it('falls back to snapshot when no proxy is provided', async () => {
    const mockTles = [
      {
        name: 'ISS (ZARYA)',
        noradId: '25544',
        line1: '1 25544U...',
        line2: '2 25544...',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockTles),
    } as any);

    const result = await fetchHistoricalTLE(new Date('2024-05-10T14:00:00Z'));
    expect(result).toHaveLength(1);
    expect(result[0].noradId).toBe('25544');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createNextDataSource } from '../src/createNextDataSource';

describe('createNextDataSource', () => {
  it('POSTs DataGridQuery and returns DataGridResult', async () => {
    const fetcher = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ rows: [{ id: 1 }], totalRowCount: 1 })
      } as Response;
    });

    const ds = createNextDataSource<{ id: number }>({
      endpoint: '/api/test',
      fetcher: fetcher as any
    });

    const result = await ds.fetch({
      page: { index: 0, size: 10 },
      sort: [],
      filters: []
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.rows).toHaveLength(1);
    expect(result.totalRowCount).toBe(1);
  });

  it('throws when response is not ok', async () => {
    const fetcher = vi.fn(async () => {
      return {
        ok: false,
        status: 500,
        json: async () => ({})
      } as Response;
    });

    const ds = createNextDataSource<{ id: number }>({
      endpoint: '/api/test',
      fetcher: fetcher as any
    });

    await expect(ds.fetch({})).rejects.toThrow('fetch failed (500)');
  });
});

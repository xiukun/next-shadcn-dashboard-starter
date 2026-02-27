import type {
  DataGridQuery,
  DataGridResult,
  DataSource
} from '@maita-table/core';

export interface CreateNextDataSourceOptions {
  endpoint: string;
  fetcher?: typeof fetch;
}

export function createNextDataSource<Row>(
  options: CreateNextDataSourceOptions | string
): DataSource<Row> {
  const resolved: CreateNextDataSourceOptions =
    typeof options === 'string' ? { endpoint: options } : options;

  const fetcher = resolved.fetcher ?? fetch;

  return {
    async fetch(
      query: DataGridQuery,
      signal?: AbortSignal
    ): Promise<DataGridResult<Row>> {
      const res = await fetcher(resolved.endpoint, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      if (!res.ok) {
        throw new Error(`@maita-table/next: fetch failed (${res.status})`);
      }

      return (await res.json()) as DataGridResult<Row>;
    }
  };
}

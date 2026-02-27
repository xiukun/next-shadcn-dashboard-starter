import { NextResponse } from 'next/server';
import type { DataGridQuery, DataGridResult } from '@maita-table/core';

type DemoRow = {
  id: number;
  name: string;
  price: number;
  change: number; // 变化率，-1.0 ~ 1.0
  status: 'active' | 'archived';
};

const TOTAL = 10000;

function makeRow(id: number): DemoRow {
  return {
    id,
    name: `Row ${id}`,
    price: (id % 1000) / 10,
    change: ((id % 21) - 10) / 10, // -1.0 ~ 1.0，包含负数与正数
    status: id % 10 === 0 ? 'archived' : 'active'
  };
}

export async function POST(req: Request) {
  const query = (await req.json().catch(() => ({}))) as DataGridQuery;

  const pageIndex = query.page?.index ?? 0;
  const pageSize = query.page?.size ?? TOTAL;

  const start = Math.max(0, pageIndex * pageSize);
  const end = Math.min(TOTAL, start + pageSize);

  const rows: DemoRow[] = [];
  for (let id = start + 1; id <= end; id += 1) {
    rows.push(makeRow(id));
  }

  const result: DataGridResult<DemoRow> = {
    rows,
    totalRowCount: TOTAL
  };

  return NextResponse.json(result);
}

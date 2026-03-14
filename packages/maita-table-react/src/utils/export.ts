import type { ColumnConfig } from '@maita-table/core';

/**
 * 导出数据为 CSV 格式
 */
export function exportToCSV<Row>(
  rows: Row[],
  columns: ColumnConfig<Row>[],
  options?: {
    filename?: string;
    includeHeaders?: boolean;
    delimiter?: string;
  }
): void {
  const {
    filename = 'export.csv',
    includeHeaders = true,
    delimiter = ','
  } = options || {};

  // 获取可见列（按顺序）
  const visibleColumns = columns.filter((col) => {
    // 假设列配置中有 visible 属性，如果没有则默认可见
    return col.meta?.visible !== false;
  });

  // 构建 CSV 内容
  const lines: string[] = [];

  // 添加表头
  if (includeHeaders) {
    const headers = visibleColumns.map((col) =>
      escapeCSVValue(col.header || col.id)
    );
    lines.push(headers.join(delimiter));
  }

  // 添加数据行
  rows.forEach((row) => {
    const values = visibleColumns.map((col) => {
      const value = col.accessor(row);
      return escapeCSVValue(formatCSVValue(value));
    });
    lines.push(values.join(delimiter));
  });

  // 创建 Blob 并下载
  const csvContent = lines.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], {
    type: 'text/csv;charset=utf-8;'
  }); // BOM for Excel
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 转义 CSV 值（处理逗号、引号、换行符）
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // 如果包含逗号、引号或换行符，需要用引号包裹并转义引号
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * 格式化 CSV 值
 */
function formatCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * 导出选中的行
 */
export function exportSelectedRowsToCSV<Row>(
  rows: Row[],
  selectedRowKeys: string[],
  columns: ColumnConfig<Row>[],
  options?: {
    filename?: string;
    includeHeaders?: boolean;
    delimiter?: string;
  }
): void {
  // 假设 row 有 id 属性，需要根据实际数据结构调整
  const selectedRows = rows.filter((row) => {
    const rowId = (row as any).id?.toString() || String(row);
    return selectedRowKeys.includes(rowId);
  });

  exportToCSV(selectedRows, columns, {
    ...options,
    filename: options?.filename || 'selected-rows.csv'
  });
}

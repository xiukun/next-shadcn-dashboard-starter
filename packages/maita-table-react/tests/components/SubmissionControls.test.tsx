import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmissionControls } from '../../src/components/SubmissionControls';
import type { ReactDataGridStore } from '../../src/store';
import type { ColumnConfig, DataGridControllerState } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

function createMockStore(pendingCount: number = 0): ReactDataGridStore<Row> {
  const state: DataGridControllerState<Row> = {
    view: {
      columns: [],
      sort: [],
      filters: [],
      globalSearch: undefined,
      groupBy: [],
      paginationMode: 'page',
      pageIndex: 0,
      pageSize: 20,
      density: 'comfortable'
    },
    runtime: {
      loading: false,
      selection: new Set(),
      expandedRowKeys: new Set(),
      editingDraftValues: {},
      validationErrors: {},
      scrollTop: 0,
      scrollLeft: 0,
      pendingEdits: Array.from({ length: pendingCount }, (_, i) => ({
        rowKey: String(i),
        rowIndex: i,
        originalRow: { id: i, name: `Product ${i}` },
        editedRow: { name: `New Name ${i}` },
        timestamp: Date.now()
      })),
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {}
    },
    data: {
      rows: [],
      totalRowCount: 0
    }
  };

  return {
    getState: () => state,
    setState: vi.fn(),
    subscribe: vi.fn(() => () => {}),
    controller: {
      buildQuery: vi.fn(),
      reduce: vi.fn((s) => s)
    },
    dispatch: vi.fn()
  } as any;
}

describe('SubmissionControls', () => {
  it('should render pending count when there are pending edits', () => {
    const mockStore = createMockStore(3);
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const columns: ColumnConfig<Row>[] = [];

    render(
      <SubmissionControls
        store={mockStore}
        columns={columns}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText(/待提交.*3.*行/)).toBeInTheDocument();
  });

  it('should not show pending count when there are no pending edits', () => {
    const mockStore = createMockStore(0);
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const columns: ColumnConfig<Row>[] = [];

    const { container } = render(
      <SubmissionControls
        store={mockStore}
        columns={columns}
        onSubmit={mockOnSubmit}
      />
    );

    // 检查容器内是否有"待提交"文本
    const pendingText = container.textContent;
    expect(pendingText).not.toContain('待提交');
  });

  it('should disable submit button when submitting', () => {
    const mockStore = createMockStore(2);
    const mockState = mockStore.getState();
    mockState.runtime.submission.status = 'submitting';
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const columns: ColumnConfig<Row>[] = [];

    const { container } = render(
      <SubmissionControls
        store={mockStore}
        columns={columns}
        onSubmit={mockOnSubmit}
      />
    );

    // 查找提交按钮（应该显示"提交中..."）
    const submitButtons = container.querySelectorAll(
      'button[aria-label="提交全部"]'
    );
    expect(submitButtons.length).toBeGreaterThan(0);
    const submitButton = submitButtons[0] as HTMLButtonElement;
    expect(submitButton).toBeDisabled();
    expect(submitButton.textContent).toContain('提交中...');
  });
});

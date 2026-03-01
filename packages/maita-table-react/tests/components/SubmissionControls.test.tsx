import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmissionControls } from '../../src/components/SubmissionControls';
import { createDataGridStore, createInitialState } from '../../src/store';
import type { ColumnConfig, PendingEdit } from '@maita-table/core';

interface Row {
  id: number;
  name: string;
}

const columns: ColumnConfig<Row>[] = [
  { id: 'id', header: 'ID', accessor: (row) => row.id },
  { id: 'name', header: 'Name', accessor: (row) => row.name }
];

function createMockStore(pendingCount: number = 0) {
  const pendingEdits: PendingEdit<Row>[] = Array.from(
    { length: pendingCount },
    (_, i) => ({
      rowKey: String(i),
      rowIndex: i,
      originalRow: { id: i, name: `Product ${i}` },
      editedRow: { name: `New Name ${i}` },
      timestamp: Date.now()
    })
  );

  return createDataGridStore(
    createInitialState(columns, {
      runtime: {
        pendingEdits
      }
    })
  );
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
    // Set submission status to 'submitting'
    mockStore.getState().startSubmission(['0', '1']);
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

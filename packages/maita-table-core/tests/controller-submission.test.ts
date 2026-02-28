import { describe, it, expect } from 'vitest';
import { createDefaultController } from '../src/controller';
import type { DataGridControllerState } from '../src/state';

interface Row {
  id: number;
  name: string;
  price: number;
}

function createInitialState(): DataGridControllerState<Row> {
  return {
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
      pendingEdits: [],
      submission: {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      },
      rowValidationErrors: {}
    },
    data: {
      rows: [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 }
      ],
      totalRowCount: 2
    }
  };
}

describe('controller submission events', () => {
  describe('edit/queue', () => {
    it('should add edit to queue', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();

      const newState = controller.reduce(state, {
        type: 'edit/queue',
        cell: { rowKey: '1', columnId: 'name' },
        value: 'New Name'
      });

      expect(newState.runtime.pendingEdits).toHaveLength(1);
      expect(newState.runtime.pendingEdits[0]?.rowKey).toBe('1');
      expect(newState.runtime.pendingEdits[0]?.editedRow.name).toBe('New Name');
    });

    it('should update existing edit in queue', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();
      state.runtime.pendingEdits = [
        {
          rowKey: '1',
          rowIndex: 0,
          originalRow: { id: 1, name: 'Product 1', price: 100 },
          editedRow: { name: 'Old Name' },
          timestamp: Date.now()
        }
      ];

      const newState = controller.reduce(state, {
        type: 'edit/queue',
        cell: { rowKey: '1', columnId: 'name' },
        value: 'New Name'
      });

      expect(newState.runtime.pendingEdits).toHaveLength(1);
      expect(newState.runtime.pendingEdits[0]?.editedRow.name).toBe('New Name');
    });
  });

  describe('edit/queueRow', () => {
    it('should queue entire row edit', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();

      const newState = controller.reduce(state, {
        type: 'edit/queueRow',
        rowKey: '1',
        editedRow: { name: 'New Name', price: 150 }
      });

      expect(newState.runtime.pendingEdits).toHaveLength(1);
      expect(newState.runtime.pendingEdits[0]?.editedRow.name).toBe('New Name');
      expect(newState.runtime.pendingEdits[0]?.editedRow.price).toBe(150);
    });
  });

  describe('edit/removeFromQueue', () => {
    it('should remove edit from queue', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();
      state.runtime.pendingEdits = [
        {
          rowKey: '1',
          rowIndex: 0,
          originalRow: { id: 1, name: 'Product 1', price: 100 },
          editedRow: { name: 'New Name' },
          timestamp: Date.now()
        }
      ];

      const newState = controller.reduce(state, {
        type: 'edit/removeFromQueue',
        rowKey: '1'
      });

      expect(newState.runtime.pendingEdits).toHaveLength(0);
    });
  });

  describe('submission/start', () => {
    it('should set submission status to submitting', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();

      const newState = controller.reduce(state, {
        type: 'submission/start',
        rowKeys: ['1']
      });

      expect(newState.runtime.submission.status).toBe('submitting');
      expect(newState.runtime.submission.submittedRows).toEqual(['1']);
    });
  });

  describe('submission/success', () => {
    it('should set submission status to success', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();
      state.runtime.submission = {
        status: 'submitting',
        submittedRows: ['1'],
        failedRows: []
      };

      const newState = controller.reduce(state, {
        type: 'submission/success',
        rowKeys: ['1']
      });

      expect(newState.runtime.submission.status).toBe('success');
    });
  });

  describe('submission/error', () => {
    it('should set submission status to error', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();
      state.runtime.submission = {
        status: 'submitting',
        submittedRows: ['1'],
        failedRows: []
      };

      const newState = controller.reduce(state, {
        type: 'submission/error',
        rowKeys: ['1'],
        errors: [{ rowKey: '1', error: 'Validation failed' }]
      });

      expect(newState.runtime.submission.status).toBe('error');
      expect(newState.runtime.submission.failedRows).toHaveLength(1);
      expect(newState.runtime.submission.failedRows[0]?.error).toBe(
        'Validation failed'
      );
    });
  });

  describe('submission/reset', () => {
    it('should reset submission state', () => {
      const controller = createDefaultController<Row>();
      const state = createInitialState();
      state.runtime.submission = {
        status: 'success',
        submittedRows: ['1'],
        failedRows: []
      };

      const newState = controller.reduce(state, {
        type: 'submission/reset'
      });

      expect(newState.runtime.submission.status).toBe('idle');
      expect(newState.runtime.submission.submittedRows).toEqual([]);
      expect(newState.runtime.submission.failedRows).toEqual([]);
    });
  });
});

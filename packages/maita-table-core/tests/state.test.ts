import { describe, it, expect } from 'vitest';
import type {
  DataGridRuntimeState,
  PendingEdit,
  SubmissionState
} from '../src/state';

describe('DataGridRuntimeState', () => {
  describe('PendingEdit', () => {
    it('should have correct structure', () => {
      const edit: PendingEdit<any> = {
        rowKey: 'row1',
        rowIndex: 0,
        originalRow: { id: 1, name: 'Original' },
        editedRow: { name: 'Edited' },
        timestamp: Date.now()
      };

      expect(edit.rowKey).toBe('row1');
      expect(edit.rowIndex).toBe(0);
      expect(edit.originalRow).toEqual({ id: 1, name: 'Original' });
      expect(edit.editedRow).toEqual({ name: 'Edited' });
      expect(typeof edit.timestamp).toBe('number');
    });
  });

  describe('SubmissionState', () => {
    it('should have correct structure', () => {
      const submission: SubmissionState = {
        status: 'idle',
        submittedRows: [],
        failedRows: []
      };

      expect(submission.status).toBe('idle');
      expect(submission.submittedRows).toEqual([]);
      expect(submission.failedRows).toEqual([]);
    });

    it('should support all status values', () => {
      const statuses: SubmissionState['status'][] = [
        'idle',
        'submitting',
        'success',
        'error'
      ];

      statuses.forEach((status) => {
        const submission: SubmissionState = {
          status,
          submittedRows: [],
          failedRows: []
        };
        expect(submission.status).toBe(status);
      });
    });
  });

  describe('DataGridRuntimeState', () => {
    it('should include new fields', () => {
      const state: DataGridRuntimeState<any> = {
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
      };

      expect(state.pendingEdits).toEqual([]);
      expect(state.submission.status).toBe('idle');
      expect(state.rowValidationErrors).toEqual({});
    });
  });
});

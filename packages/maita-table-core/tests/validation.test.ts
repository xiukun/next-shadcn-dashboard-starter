import { describe, it, expect } from 'vitest';
import { createColumnSchema, createRowSchema } from '../src/validation';
import type { ColumnConfig, ColumnMeta } from '../src/column';

describe('validation', () => {
  describe('createColumnSchema', () => {
    it('should create number schema with min/max', () => {
      const column: ColumnConfig<any, number> = {
        id: 'price',
        header: 'Price',
        accessor: (row) => row.price,
        meta: {
          type: 'number',
          min: 0,
          max: 1000
        }
      };

      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse(100)).toBe(100);
      expect(() => schema.parse(-1)).toThrow();
      expect(() => schema.parse(2000)).toThrow();
    });

    it('should create string schema', () => {
      const column: ColumnConfig<any, string> = {
        id: 'name',
        header: 'Name',
        accessor: (row) => row.name,
        meta: { type: 'string', required: true }
      };

      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse('test')).toBe('test');
      expect(() => schema.parse(undefined)).toThrow();
    });

    it('should create boolean schema', () => {
      const column: ColumnConfig<any, boolean> = {
        id: 'active',
        header: 'Active',
        accessor: (row) => row.active,
        meta: { type: 'boolean' }
      };

      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });

    it('should support optional fields', () => {
      const column: ColumnConfig<any, string> = {
        id: 'description',
        header: 'Description',
        accessor: (row) => row.description,
        meta: { type: 'string', required: false }
      };

      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse(undefined)).toBeUndefined();
      expect(schema.parse('test')).toBe('test');
    });

    it('should support custom zodSchema', () => {
      const { z } = require('zod');
      const column: ColumnConfig<any, string> = {
        id: 'email',
        header: 'Email',
        accessor: (row) => row.email,
        meta: {
          type: 'string',
          zodSchema: z.string().email()
        }
      };

      const schema = createColumnSchema(column, column.meta);
      expect(schema.parse('test@example.com')).toBe('test@example.com');
      expect(() => schema.parse('invalid-email')).toThrow();
    });
  });

  describe('createRowSchema', () => {
    it('should create row schema from columns', () => {
      const columns: ColumnConfig<any>[] = [
        {
          id: 'name',
          header: 'Name',
          accessor: (row) => row.name,
          meta: { type: 'string', required: true }
        },
        {
          id: 'price',
          header: 'Price',
          accessor: (row) => row.price,
          meta: { type: 'number', min: 0 }
        }
      ];

      const schema = createRowSchema(columns);
      const result = schema.safeParse({ name: 'Test', price: 100 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test');
        expect(result.data.price).toBe(100);
      }
    });

    it('should validate row with errors', () => {
      const columns: ColumnConfig<any>[] = [
        {
          id: 'name',
          header: 'Name',
          accessor: (row) => row.name,
          meta: { type: 'string', required: true }
        }
      ];

      const schema = createRowSchema(columns);
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

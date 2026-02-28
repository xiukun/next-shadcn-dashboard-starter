import { z } from 'zod';
import type { ColumnConfig, ColumnMeta } from './column';

export function createColumnSchema<Row, Value>(
  column: ColumnConfig<Row, Value>,
  meta?: ColumnMeta<Row, Value>
): z.ZodType<Value> {
  // 如果提供了自定义 zodSchema，直接使用
  if (meta?.zodSchema) {
    return meta.zodSchema as z.ZodType<Value>;
  }

  let schema: z.ZodType<Value>;

  // 基础类型
  switch (meta?.type) {
    case 'number':
    case 'integer':
      schema = z.number() as z.ZodType<Value>;
      if (meta?.min !== undefined) {
        schema = (schema as z.ZodNumber).min(meta.min) as z.ZodType<Value>;
      }
      if (meta?.max !== undefined) {
        schema = (schema as z.ZodNumber).max(meta.max) as z.ZodType<Value>;
      }
      if (meta?.type === 'integer') {
        schema = (schema as z.ZodNumber).int() as z.ZodType<Value>;
      }
      break;
    case 'string':
      schema = z.string() as z.ZodType<Value>;
      // 如果 required 为 true，确保非空字符串
      if (meta?.required === true) {
        schema = (schema as z.ZodString).min(1) as z.ZodType<Value>;
      }
      break;
    case 'boolean':
      schema = z.boolean() as z.ZodType<Value>;
      break;
    case 'date':
    case 'datetime':
      schema = z.date() as z.ZodType<Value>;
      break;
    default:
      schema = z.unknown() as z.ZodType<Value>;
  }

  // 必填验证
  if (meta?.required === false) {
    schema = schema.optional() as z.ZodType<Value>;
  }

  // 自定义验证（向后兼容）
  if (meta?.validate && !meta?.zodSchema) {
    schema = schema.refine(
      (val) => {
        const result = meta.validate!(val, {} as Row);
        return result === null || result === undefined;
      },
      { message: (meta.validate as any).toString() }
    ) as z.ZodType<Value>;
  }

  return schema;
}

export function createRowSchema<Row>(
  columns: ColumnConfig<Row>[]
): z.ZodType<Row> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const col of columns) {
    if (col.meta?.editable !== false) {
      shape[col.id] = createColumnSchema(col, col.meta);
    }
  }

  return z.object(shape) as z.ZodType<Row>;
}

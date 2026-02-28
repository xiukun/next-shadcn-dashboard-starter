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

  // 内部构建时使用更宽松的类型，最后再统一收窄为 ZodType<Value>
  let schema: z.ZodTypeAny;

  // 基础类型
  switch (meta?.type) {
    case 'number':
    case 'integer': {
      let numberSchema = z.number();
      if (meta?.min !== undefined) {
        numberSchema = numberSchema.min(meta.min);
      }
      if (meta?.max !== undefined) {
        numberSchema = numberSchema.max(meta.max);
      }
      if (meta?.type === 'integer') {
        numberSchema = numberSchema.int();
      }
      schema = numberSchema;
      break;
    }
    case 'string': {
      let stringSchema = z.string();
      // 如果 required 为 true，确保非空字符串
      if (meta?.required === true) {
        stringSchema = stringSchema.min(1);
      }
      schema = stringSchema;
      break;
    }
    case 'boolean': {
      // 对于带 trueValue/falseValue 的布尔列，既允许 boolean，也允许底层字符串值
      const hasMappedValues =
        meta &&
        (meta as any).trueValue !== undefined &&
        (meta as any).falseValue !== undefined;

      if (hasMappedValues) {
        const trueValue = (meta as any).trueValue as string;
        const falseValue = (meta as any).falseValue as string;
        schema = z.union([
          z.boolean(),
          z.literal(trueValue),
          z.literal(falseValue)
        ]);
      } else {
        schema = z.boolean();
      }
      break;
    }
    case 'date':
    case 'datetime':
      schema = z.date();
      break;
    default:
      schema = z.unknown();
  }

  // 必填验证
  if (meta?.required === false) {
    schema = schema.optional();
  }

  // 兼容期提示：存在 legacy validate 但未提供 zodSchema 时，仅在开发环境给出警告，
  // 实际校验仍完全由 Zod Schema 决定（即不再依赖 meta.validate 执行结构化校验）
  if (
    meta?.validate &&
    !meta?.zodSchema &&
    process.env.NODE_ENV !== 'production'
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `[maita-table] Column "${column.id}" 使用了 meta.validate，但校验已收敛为 Zod-only。` +
        '请改用 meta.zodSchema 定义结构化验证规则。'
    );
  }

  return schema as z.ZodType<Value>;
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

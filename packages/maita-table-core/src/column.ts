export type ColumnMeta<Row = any, Value = any> = {
  type?:
    | 'string'
    | 'number'
    | 'integer'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'badge'
    | 'tag'
    | 'custom';
  editable?: boolean;
  required?: boolean;
  /**
   * 针对数值列的最小/最大值约束
   */
  min?: number;
  max?: number;
  /**
   * 针对数值列的小数位精度（例如 2 表示保留两位小数）
   */
  decimals?: number;
  /**
   * 数值编辑时的步进值（用于键盘上下箭头调整），默认 1
   */
  step?: number;
  /**
   * 是否允许负数，默认 true
   */
  allowNegative?: boolean;
  /**
   * 列对齐方式，默认为 left
   */
  align?: 'left' | 'right' | 'center';
  access?: {
    roles?: string[];
    permissions?: string[];
  };
  formatter?: (value: Value, row: Row) => unknown;
  validate?: (value: Value, row: Row) => string | null | undefined;
  editorType?: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'custom';
  /**
   * 可选的 Zod Schema，用于结构化验证
   * 如果提供，将优先使用此 Schema 进行验证
   */
  zodSchema?: import('zod').ZodType<Value>;
  // 业务自定义元数据
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface ColumnConfig<Row = any, Value = any> {
  id: string;
  header: string;
  accessor: (row: Row) => Value;
  meta?: ColumnMeta<Row, Value>;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  width?: number | 'auto' | 'fill';
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  visible?: boolean;
  pinnable?: boolean;
  pinned?: 'left' | 'right';
  groupable?: boolean;
}

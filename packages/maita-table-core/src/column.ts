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
  access?: {
    roles?: string[];
    permissions?: string[];
  };
  formatter?: (value: Value, row: Row) => unknown;
  validate?: (value: Value, row: Row) => string | null | undefined;
  editorType?: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'custom';
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

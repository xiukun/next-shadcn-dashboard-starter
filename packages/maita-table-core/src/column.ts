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
  /**
   * @deprecated 请改用 zodSchema 进行结构化验证
   */
  validate?: (value: Value, row: Row) => string | null | undefined;
  editorType?: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'custom';
  /**
   * 可选的 Zod Schema，用于结构化验证
   * 如果提供，将优先使用此 Schema 进行验证
   */
  zodSchema?: import('zod').ZodType<Value>;
  // === 排序配置 ===
  /**
   * 是否启用排序功能（默认使用 ColumnConfig.enableSorting）
   */
  enableSorting?: boolean;
  /**
   * 默认排序方向
   */
  defaultSort?: 'asc' | 'desc';
  // === 过滤配置 ===
  /**
   * 是否启用过滤功能（默认使用 ColumnConfig.enableFiltering）
   */
  enableFiltering?: boolean;
  /**
   * 过滤器类型：'text' | 'number' | 'date' | 'set' | 'custom'
   */
  filterType?: 'text' | 'number' | 'date' | 'set' | 'custom';
  /**
   * 过滤输入框占位符
   */
  filterPlaceholder?: string;
  /**
   * 是否启用浮动过滤器（在表头下方显示输入框）
   */
  enableFloatingFilter?: boolean;
  /**
   * 集过滤器选项（用于 filterType: 'set'）
   * 可以是字符串数组，或返回选项列表的函数
   */
  setFilterOptions?: string[] | ((rows: Row[]) => string[] | Promise<string[]>);
  /**
   * 集过滤器是否支持搜索
   */
  setFilterSearchable?: boolean;
  // === 分组配置 ===
  /**
   * 是否启用分组功能（默认使用 ColumnConfig.groupable）
   */
  enableGrouping?: boolean;
  /**
   * 分组显示名称（如果与列标题不同）
   */
  groupDisplayName?: string;
  /**
   * 分组比较器（用于自定义分组排序）
   */
  groupComparator?: (a: Value, b: Value) => number;
  // === 聚合配置 ===
  /**
   * 是否启用聚合功能
   */
  enableAggregation?: boolean;
  /**
   * 可用的聚合函数列表
   */
  aggregationFunctions?: ('sum' | 'min' | 'max' | 'avg' | 'count')[];
  /**
   * 默认聚合函数
   */
  defaultAggregation?: 'sum' | 'min' | 'max' | 'avg' | 'count';
  /**
   * 聚合值格式化函数
   */
  aggregationFormatter?: (value: number, type: string) => string;
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

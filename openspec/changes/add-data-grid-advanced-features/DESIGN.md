# DataGrid 高级功能设计文档

## 设计原则

1. **列属性驱动**：通过 `ColumnConfig.meta` 控制列头功能显示
2. **组件拆分清晰**：每个功能点独立组件，但不过度抽象
3. **用户体验优先**：参考 AG Grid，保证操作流畅
4. **性能优化**：虚拟化、防抖、懒加载
5. **代码易读**：避免过度抽象，保持代码直观

## 组件架构设计

### 1. 列头组件层次结构

```
DataGrid
└── TableHeader
    └── TableHeaderRow
        ├── SelectionCheckbox (已存在)
        └── ColumnHeader (新增)
            ├── ColumnHeaderContent
            │   ├── ColumnTitle
            │   └── ColumnHeaderActions
            │       ├── SortIndicator
            │       ├── FilterIndicator
            │       └── ColumnMenuTrigger
            ├── FloatingFilter (可选，在表头下方)
            └── ColumnMenu (Popover)
                ├── SortMenu
                ├── FilterMenu
                │   ├── TextFilter
                │   ├── NumberFilter
                │   ├── DateFilter
                │   └── SetFilter
                └── GroupMenu
```

### 2. 列属性扩展设计

```typescript
// packages/maita-table-core/src/column.ts

export interface ColumnMeta<Row = any, Value = any> {
  // ... 现有属性

  // === 排序配置 ===
  enableSorting?: boolean; // 移到 meta，更灵活
  defaultSort?: 'asc' | 'desc';
  
  // === 过滤配置 ===
  enableFiltering?: boolean; // 移到 meta
  filterType?: 'text' | 'number' | 'date' | 'set' | 'custom';
  filterPlaceholder?: string;
  // 浮动过滤器（在表头下方显示输入框）
  enableFloatingFilter?: boolean;
  // 集过滤器配置（用于枚举值）
  setFilterOptions?: string[] | ((row: Row) => string[]);
  setFilterSearchable?: boolean;
  
  // === 分组配置 ===
  enableGrouping?: boolean; // 移到 meta
  groupDisplayName?: string; // 分组显示名称
  groupComparator?: (a: Value, b: Value) => number;
  
  // === 聚合配置 ===
  enableAggregation?: boolean;
  aggregationFunctions?: ('sum' | 'min' | 'max' | 'avg' | 'count')[];
  defaultAggregation?: 'sum' | 'min' | 'max' | 'avg' | 'count';
  aggregationFormatter?: (value: number, type: string) => string;
}
```

### 3. 组件拆分方案（基于现有库优化）

#### 3.1 列头核心组件

**`ColumnHeader.tsx`** - 列头容器组件
- 职责：管理列头布局、固定列样式、事件处理
- 位置：`packages/maita-table-react/src/components/ColumnHeader.tsx`
- 复杂度：中（约 150 行）
- **使用库**：无（纯布局组件）

**`ColumnHeaderContent.tsx`** - 列头内容组件
- 职责：显示列标题和操作按钮
- 位置：`packages/maita-table-react/src/components/ColumnHeaderContent.tsx`
- 复杂度：低（约 80 行）
- **使用库**：无（纯展示组件）

#### 3.2 排序功能组件

**`SortIndicator.tsx`** - 排序指示器
- 职责：显示排序状态图标（升序/降序/无），点击切换排序
- 位置：`packages/maita-table-react/src/components/SortIndicator.tsx`
- 复杂度：低（约 50 行）
- **使用库**：无（纯展示组件）

**`useColumnSorting.ts`** - 排序逻辑 Hook
- 职责：处理排序状态和变更，集成 TanStack Table 的排序
- 位置：`packages/maita-table-react/src/hooks/useColumnSorting.ts`
- 复杂度：中（约 100 行）
- **使用库**：`@tanstack/react-table` 的 `getSortedRowModel`

#### 3.3 过滤功能组件

**`FilterIndicator.tsx`** - 过滤指示器
- 职责：显示过滤状态（有过滤条件时显示图标），点击打开过滤菜单
- 位置：`packages/maita-table-react/src/components/FilterIndicator.tsx`
- 复杂度：低（约 40 行）
- **使用库**：无（纯展示组件）

**`FloatingFilter.tsx`** - 浮动过滤器
- 职责：在表头下方显示实时过滤输入框
- 位置：`packages/maita-table-react/src/components/FloatingFilter.tsx`
- 复杂度：中（约 120 行）
- **使用库**：`@/components/ui/input`（shadcn/ui）

**`ColumnMenu.tsx`** - 列菜单容器
- 职责：使用 Popover 展示排序、过滤、分组等菜单项
- 位置：`packages/maita-table-react/src/components/ColumnMenu.tsx`
- 复杂度：中（约 150 行）
- **使用库**：`@/components/ui/popover`（shadcn/ui，底层使用 @floating-ui/react）

**`FilterMenu.tsx`** - 过滤菜单
- 职责：根据 filterType 渲染对应的过滤器组件
- 位置：`packages/maita-table-react/src/components/FilterMenu.tsx`
- 复杂度：中（约 100 行）
- **使用库**：`@/components/ui/input`, `@/components/ui/select`（shadcn/ui）

**`SetFilter.tsx`** - 集过滤器组件
- 职责：多选复选框过滤器（类似 Excel），支持搜索
- 位置：`packages/maita-table-react/src/components/SetFilter.tsx`
- 复杂度：中高（约 200 行）
- **使用库**：
  - `@/components/ui/command`（cmdk，用于搜索）
  - `@/components/ui/checkbox`（shadcn/ui，用于多选）
  - `@/components/ui/scroll-area`（shadcn/ui，用于长列表）

**`useColumnFiltering.ts`** - 过滤逻辑 Hook
- 职责：处理过滤状态和变更，集成 TanStack Table 的过滤
- 位置：`packages/maita-table-react/src/hooks/useColumnFiltering.ts`
- 复杂度：中高（约 150 行）
- **使用库**：`@tanstack/react-table` 的 `getFilteredRowModel`

#### 3.4 分组功能组件

**`GroupIndicator.tsx`** - 分组指示器
- 职责：显示当前列是否用于分组
- 位置：`packages/maita-table-react/src/components/GroupIndicator.tsx`
- 复杂度：低（约 40 行）
- **使用库**：无（纯展示组件）

**`GroupRow.tsx`** - 分组行组件
- 职责：渲染分组行（可折叠/展开）
- 位置：`packages/maita-table-react/src/components/GroupRow.tsx`
- 复杂度：中（约 150 行）
- **使用库**：
  - `@/components/ui/collapsible`（shadcn/ui，用于展开/折叠）
  - `@tanstack/react-table` 的 `getGroupedRowModel`

**`useRowGrouping.ts`** - 分组逻辑 Hook
- 职责：处理分组状态、展开/折叠，集成 TanStack Table 的分组
- 位置：`packages/maita-table-react/src/hooks/useRowGrouping.ts`
- 复杂度：中高（约 200 行）
- **使用库**：`@tanstack/react-table` 的 `getGroupedRowModel`

#### 3.5 聚合功能组件

**`AggregationCell.tsx`** - 聚合单元格
- 职责：在分组行或表尾显示聚合值
- 位置：`packages/maita-table-react/src/components/AggregationCell.tsx`
- 复杂度：中（约 100 行）
- **使用库**：无（纯展示组件，使用 TanStack Table 的聚合数据）

**`useAggregation.ts`** - 聚合计算 Hook
- 职责：计算 sum, min, max, avg, count，集成 TanStack Table 的聚合
- 位置：`packages/maita-table-react/src/hooks/useAggregation.ts`
- 复杂度：中（约 150 行）
- **使用库**：`@tanstack/react-table` 的 `aggregationFns`

### 4. 数据流设计

```
用户操作
  ↓
UI 组件（ColumnHeader, FilterMenu 等）
  ↓
Hook（useColumnSorting, useColumnFiltering 等）
  ↓
Store（更新 DataGridViewState）
  ↓
DataSource（发送 DataGridQuery）
  ↓
后端 API / 前端计算
  ↓
更新表格数据
```

### 5. 性能优化策略

1. **防抖处理**：浮动过滤器输入使用防抖（300ms），使用现有的 `useDebouncedCallback`
2. **虚拟化**：分组行也使用 `@tanstack/react-virtual` 虚拟化渲染
3. **懒加载**：集过滤器的选项列表按需加载，使用 `cmdk` 的搜索功能
4. **Memo 优化**：使用 React.memo 和 useMemo 减少重渲染
5. **计算缓存**：TanStack Table 内置聚合结果缓存，只在数据变化时重新计算
6. **浮动定位优化**：使用 `@floating-ui/react`（Radix UI 底层）自动处理定位和碰撞检测

### 6. 用户体验设计

#### 6.1 列头交互
- **排序**：点击列头标题切换排序（升序 → 降序 → 无）
- **过滤**：点击过滤图标打开过滤菜单
- **浮动过滤**：在表头下方显示输入框，实时过滤
- **列菜单**：点击列头右侧菜单图标，打开完整菜单

#### 6.2 视觉反馈
- 排序状态：显示 ↑ ↓ 图标
- 过滤状态：显示过滤图标（有过滤条件时高亮）
- 分组状态：分组列显示分组图标
- Hover 效果：列头 hover 时显示操作按钮

### 7. 实施优先级

**阶段 1：列头重构 + 排序增强**
- 拆分 ColumnHeader 组件
- 增强排序功能（多列排序）
- 优化列头布局

**阶段 2：浮动过滤 + 基础过滤**
- 实现浮动过滤器
- 实现文本、数字、日期过滤器
- 集成到列头

**阶段 3：集过滤器**
- 实现 SetFilter 组件
- 支持搜索和多选
- 性能优化

**阶段 4：分组 + 聚合**
- 实现行分组
- 实现值聚合
- 分组行 UI

**阶段 5：树形数据（可选）**
- 基于分组扩展
- 父子关系处理

## 代码示例

### 列配置示例

```typescript
const columns: ColumnConfig<Product>[] = [
  {
    id: 'name',
    header: '产品名称',
    accessor: (row) => row.name,
    meta: {
      enableSorting: true,
      enableFiltering: true,
      filterType: 'text',
      enableFloatingFilter: true, // 显示浮动过滤器
      filterPlaceholder: '搜索产品...'
    }
  },
  {
    id: 'status',
    header: '状态',
    accessor: (row) => row.status,
    meta: {
      enableSorting: true,
      enableFiltering: true,
      filterType: 'set', // 使用集过滤器
      setFilterOptions: ['active', 'inactive', 'pending'],
      setFilterSearchable: true
    }
  },
  {
    id: 'price',
    header: '价格',
    accessor: (row) => row.price,
    meta: {
      type: 'number',
      enableSorting: true,
      enableFiltering: true,
      filterType: 'number',
      enableGrouping: true,
      enableAggregation: true,
      aggregationFunctions: ['sum', 'avg', 'min', 'max'],
      defaultAggregation: 'sum'
    }
  }
];
```

### 组件使用示例（基于现有库）

```tsx
// ColumnHeader.tsx - 使用 shadcn/ui Popover
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

function ColumnHeader({ column, header, ... }) {
  const meta = column.meta;
  const hasSorting = meta?.enableSorting;
  const hasFiltering = meta?.enableFiltering;

  return (
    <th className="mt-grid-th">
      <ColumnHeaderContent>
        <ColumnTitle>{header}</ColumnTitle>
        <ColumnHeaderActions>
          {hasSorting && <SortIndicator columnId={column.id} />}
          {hasFiltering && <FilterIndicator columnId={column.id} />}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <ColumnMenuContent column={column} />
            </PopoverContent>
          </Popover>
        </ColumnHeaderActions>
      </ColumnHeaderContent>
      {meta?.enableFloatingFilter && (
        <FloatingFilter columnId={column.id} filterType={meta.filterType} />
      )}
    </th>
  );
}

// SetFilter.tsx - 使用 cmdk 和 shadcn/ui
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';

function SetFilter({ columnId, options, ... }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(opt => 
      opt.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <Command className="w-64">
      <CommandInput 
        placeholder="搜索选项..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandItem onSelect={() => handleSelectAll()}>
          <Checkbox checked={selected.size === options.length} />
          (全选)
        </CommandItem>
        {filteredOptions.map(option => (
          <CommandItem 
            key={option}
            onSelect={() => handleToggle(option)}
          >
            <Checkbox checked={selected.has(option)} />
            {option}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
```

### TanStack Table 集成示例

```tsx
// useDataGrid.tsx - 集成 TanStack Table 功能
import { 
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel
} from '@tanstack/react-table';

const table = useReactTable({
  data: state.data.rows,
  columns: columnDefs,
  getCoreRowModel: getCoreRowModel(),
  // 启用排序
  getSortedRowModel: getSortedRowModel(),
  // 启用过滤
  getFilteredRowModel: getFilteredRowModel(),
  // 启用分组
  getGroupedRowModel: getGroupedRowModel(),
  // 启用展开/折叠
  getExpandedRowModel: getExpandedRowModel(),
  // 状态管理
  state: {
    sorting: state.view.sort,
    columnFilters: state.view.filters,
    grouping: state.view.groupBy,
    expanded: state.runtime.expandedRowKeys
  },
  // 状态更新
  onSortingChange: (updater) => {
    // 更新 store
  },
  onColumnFiltersChange: (updater) => {
    // 更新 store
  },
  onGroupingChange: (updater) => {
    // 更新 store
  }
});
```

## 使用的开源库总结

### 核心库（已安装）
1. **@tanstack/react-table** - 表格核心功能
   - `getSortedRowModel` - 排序
   - `getFilteredRowModel` - 过滤
   - `getGroupedRowModel` - 分组
   - `getExpandedRowModel` - 展开/折叠
   - `aggregationFns` - 聚合函数

2. **@radix-ui/react-popover** - 浮动层（底层使用 @floating-ui/react）
   - 自动定位、碰撞检测、自适应
   - 完整的 A11y 支持
   - 通过 shadcn/ui Popover 使用

3. **@radix-ui/react-dropdown-menu** - 下拉菜单
   - 用于列菜单的某些场景
   - 通过 shadcn/ui DropdownMenu 使用

4. **cmdk** - 命令面板（用于集过滤器搜索）
   - 高性能搜索
   - 键盘导航
   - 通过 shadcn/ui Command 使用

5. **@tanstack/react-virtual** - 虚拟化（已使用）
   - 行虚拟化
   - 分组行虚拟化

### shadcn/ui 组件（已安装）
- `Popover` - 列菜单容器
- `DropdownMenu` - 某些菜单场景
- `Command` - 集过滤器搜索
- `Input` - 浮动过滤器输入框
- `Checkbox` - 集过滤器多选
- `Select` - 过滤操作符选择
- `ScrollArea` - 长列表滚动
- `Collapsible` - 分组行展开/折叠
- `Button` - 各种按钮

### 不需要额外安装的库
- ✅ **@floating-ui/react** - 已通过 Radix UI 间接使用
- ✅ 所有 UI 组件 - 已通过 shadcn/ui 提供

## 总结

这个设计方案的优点：
1. ✅ **充分利用现有库**：TanStack Table + shadcn/ui + Radix UI
2. ✅ **列属性驱动**：通过 meta 配置控制功能
3. ✅ **组件拆分清晰**：每个功能独立组件，易维护
4. ✅ **不过度抽象**：保持代码直观易读
5. ✅ **性能优化**：防抖、虚拟化、缓存、自动定位优化
6. ✅ **用户体验好**：参考 AG Grid，操作流畅
7. ✅ **零额外依赖**：所有库都已安装，无需新增

## 新增需求

### 需求：列头功能集成（Column Header Features Integration）

系统必须在列头提供统一的排序、过滤、分组等功能入口，通过列属性（`ColumnMeta`）控制功能显示，并充分利用现有开源库（TanStack Table、shadcn/ui、Radix UI）实现。

#### 场景：列头操作按钮显示
- **当** `ColumnConfig.meta.enableSorting` 为 `true` 时
- **那么** 列头右侧必须显示排序指示器（↑ ↓ 图标）
- **并且** 点击列头标题或排序指示器可以切换排序状态（升序 → 降序 → 无）

#### 场景：列头过滤按钮显示
- **当** `ColumnConfig.meta.enableFiltering` 为 `true` 时
- **那么** 列头右侧必须显示过滤指示器（过滤图标）
- **并且** 有过滤条件时，过滤指示器必须高亮显示
- **并且** 点击过滤指示器可以打开过滤菜单（Popover）

#### 场景：列头菜单
- **当** 用户点击列头右侧的菜单按钮时
- **那么** 必须打开列菜单（Popover），包含排序、过滤、分组等选项
- **并且** 列菜单必须使用 shadcn/ui 的 `Popover` 组件（底层使用 @floating-ui/react）
- **并且** 列菜单必须自动处理定位、碰撞检测和自适应

### 需求：增强排序功能（Enhanced Sorting）

系统必须提供增强的排序功能，支持多列排序和排序状态可视化，并充分利用 TanStack Table 的内置排序功能。

#### 场景：单列排序
- **当** 用户点击列头标题或排序指示器时
- **那么** 如果当前未排序，则按升序排序；如果已升序，则按降序排序；如果已降序，则取消排序
- **并且** 排序状态必须通过 `DataGridQuery.sort` 协议推送到数据源
- **并且** 排序状态必须使用 TanStack Table 的 `getSortedRowModel` 进行前端计算（如果数据源支持）

#### 场景：多列排序
- **当** 用户按住 Ctrl（Mac: Cmd）键并点击另一列的排序指示器时
- **那么** 系统必须保留之前的排序，并添加新的排序列
- **并且** 排序优先级按照点击顺序确定（最后点击的列优先级最高）
- **并且** 排序状态必须正确显示在多个列的排序指示器上

#### 场景：排序状态可视化
- **当** 列处于排序状态时
- **那么** 排序指示器必须显示对应的图标（↑ 升序，↓ 降序）
- **并且** 排序指示器必须使用清晰的视觉样式（例如高亮颜色）
- **并且** 多列排序时，每个排序列的指示器必须显示排序序号（1, 2, 3...）

### 需求：浮动过滤器（Floating Filters）

系统必须在表头下方提供浮动过滤器输入框，实现实时过滤，参考 AG Grid 的浮动过滤器设计。

#### 场景：显示浮动过滤器
- **当** `ColumnConfig.meta.enableFloatingFilter` 为 `true` 时
- **那么** 表头下方必须显示一个输入框（浮动过滤器）
- **并且** 浮动过滤器必须固定在表头下方，不受滚动影响
- **并且** 浮动过滤器必须使用 shadcn/ui 的 `Input` 组件

#### 场景：实时过滤
- **当** 用户在浮动过滤器中输入文本时
- **那么** 系统必须使用防抖（300ms）更新过滤条件
- **并且** 过滤条件必须通过 `DataGridQuery.filters` 协议推送到数据源
- **并且** 如果数据源支持，可以使用 TanStack Table 的 `getFilteredRowModel` 进行前端过滤

#### 场景：过滤类型支持
- **当** `ColumnConfig.meta.filterType` 为 `'text'` 时
- **那么** 浮动过滤器必须支持文本过滤（contains, startsWith, equals）
- **当** `ColumnConfig.meta.filterType` 为 `'number'` 时
- **那么** 浮动过滤器必须支持数字过滤（>, <, =, between）
- **当** `ColumnConfig.meta.filterType` 为 `'date'` 时
- **那么** 浮动过滤器必须支持日期过滤（date picker）

### 需求：集过滤器（Set Filter）

系统必须提供集过滤器（类似 Excel 的多选复选框过滤），支持搜索和多选，充分利用 cmdk 和 shadcn/ui 组件。

#### 场景：显示集过滤器
- **当** `ColumnConfig.meta.filterType` 为 `'set'` 且用户打开过滤菜单时
- **那么** 过滤菜单必须显示集过滤器组件
- **并且** 集过滤器必须显示所有可用的选项（从 `meta.setFilterOptions` 或数据源获取）

#### 场景：集过滤器搜索
- **当** `ColumnConfig.meta.setFilterSearchable` 为 `true` 时
- **那么** 集过滤器顶部必须显示搜索输入框
- **并且** 搜索必须使用 shadcn/ui 的 `Command` 组件（cmdk）
- **并且** 搜索必须支持模糊匹配和实时过滤选项列表

#### 场景：集过滤器多选
- **当** 用户在集过滤器中选择选项时
- **那么** 系统必须支持多选（使用 shadcn/ui 的 `Checkbox` 组件）
- **并且** 必须提供"全选"功能
- **并且** 选中的选项必须通过 `FilterOperator: 'in'` 协议推送到数据源

#### 场景：集过滤器选项获取
- **当** `ColumnConfig.meta.setFilterOptions` 为数组时
- **那么** 系统必须使用该数组作为选项列表
- **当** `ColumnConfig.meta.setFilterOptions` 为函数时
- **那么** 系统必须调用该函数获取选项列表（支持异步）
- **当** `ColumnConfig.meta.setFilterOptions` 未设置时
- **那么** 系统必须从数据源获取唯一值列表（如果数据源支持）

### 需求：行分组（Row Grouping）

系统必须支持按列对数据进行分组，支持多级分组和展开/折叠，充分利用 TanStack Table 的分组功能。

#### 场景：启用分组
- **当** `ColumnConfig.meta.enableGrouping` 为 `true` 时
- **那么** 列菜单必须显示"按此列分组"选项
- **并且** 用户可以通过列菜单或拖拽启用分组

#### 场景：分组显示
- **当** 数据按某列分组时
- **那么** 表格必须显示分组行（Group Row）
- **并且** 分组行必须显示分组键值和聚合值（如果启用聚合）
- **并且** 分组行必须支持展开/折叠（使用 shadcn/ui 的 `Collapsible` 组件）

#### 场景：多级分组
- **当** 用户按多个列分组时
- **那么** 系统必须支持多级分组（嵌套分组）
- **并且** 分组层级必须通过缩进或视觉样式区分
- **并且** 每个分组级别都可以独立展开/折叠

#### 场景：分组状态管理
- **当** 用户展开/折叠分组时
- **那么** 展开状态必须存储在 `DataGridRuntimeState.expandedRowKeys` 中
- **并且** 分组状态必须通过 `DataGridQuery.groupBy` 协议推送到数据源
- **并且** 分组计算必须使用 TanStack Table 的 `getGroupedRowModel`

### 需求：值聚合（Value Aggregation）

系统必须在分组行或表尾显示聚合值（sum, min, max, avg, count），充分利用 TanStack Table 的聚合功能。

#### 场景：启用聚合
- **当** `ColumnConfig.meta.enableAggregation` 为 `true` 时
- **那么** 列菜单必须显示聚合选项（sum, min, max, avg, count）
- **并且** 用户可以选择聚合函数类型

#### 场景：分组行聚合
- **当** 数据按某列分组且该列启用聚合时
- **那么** 分组行必须显示该列的聚合值
- **并且** 聚合值必须使用 `meta.aggregationFormatter` 格式化（如果提供）
- **并且** 聚合计算必须使用 TanStack Table 的 `aggregationFns`

#### 场景：表尾聚合
- **当** 表格启用聚合且用户选择显示表尾时
- **那么** 表尾必须显示所有启用聚合的列的聚合值
- **并且** 表尾聚合值必须计算所有数据（不受过滤影响，除非明确指定）

#### 场景：聚合函数支持
- **当** 用户选择聚合函数时
- **那么** 系统必须支持以下聚合函数：
  - `sum` - 求和
  - `min` - 最小值
  - `max` - 最大值
  - `avg` - 平均值
  - `count` - 计数
- **并且** 聚合函数必须通过 `meta.aggregationFunctions` 配置可用函数列表
- **并且** 默认聚合函数必须通过 `meta.defaultAggregation` 设置

### 需求：组件拆分与重构（Component Refactoring）

系统必须将 `DataGrid.tsx` 中的列头渲染逻辑拆分为独立组件，提高代码可维护性，但不过度抽象。

#### 场景：列头组件拆分
- **当** 重构列头渲染逻辑时
- **那么** 必须创建 `ColumnHeader` 组件，管理列头布局和样式
- **并且** 必须创建 `ColumnHeaderContent` 组件，显示列标题和操作按钮
- **并且** `DataGrid.tsx` 的代码行数必须减少 30%+

#### 场景：功能组件独立
- **当** 实现排序、过滤、分组功能时
- **那么** 每个功能必须使用独立的组件和 Hook
- **并且** 组件必须职责单一，代码行数控制在 50-200 行
- **并且** 组件必须易于理解和测试

#### 场景：库集成
- **当** 实现浮动层、搜索、表格功能时
- **那么** 必须使用现有的开源库（shadcn/ui、TanStack Table、cmdk）
- **并且** 不得重复实现已有功能
- **并且** 代码必须保持简洁易读

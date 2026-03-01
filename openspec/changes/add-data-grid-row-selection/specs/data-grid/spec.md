## 新增需求

### 需求：行选择模型（Row Selection Model）

系统必须提供统一的行选择状态管理，支持单选和多选模式，并暴露选择状态变更回调。

#### 场景：单选模式
- **当** `DataGrid` 的 `selectionMode` 属性为 `'single'` 时
- **那么** 用户只能选择一行，选择新行时自动取消之前的选择
- **并且** 选择状态存储在 `DataGridRuntimeState.selection` 中（Set<RowKey>）

#### 场景：多选模式（默认）
- **当** `DataGrid` 的 `selectionMode` 属性为 `'multiple'` 或未设置时
- **那么** 用户可以选择多行，点击已选中的行可取消选择
- **并且** 选择状态存储在 `DataGridRuntimeState.selection` 中（Set<RowKey>）

#### 场景：选择状态回调
- **当** 用户选择或取消选择行时
- **那么** 系统必须触发 `onSelectionChange(selectedRowKeys: RowKey[])` 回调
- **并且** 回调参数包含当前所有选中行的 key 数组

#### 场景：受控选择状态
- **当** `DataGrid` 的 `selectedRowKeys` prop 被设置时
- **那么** 表格必须使用该 prop 的值作为选择状态（受控模式）
- **并且** 用户的选择操作必须通过 `onSelectionChange` 回调通知父组件，由父组件更新 `selectedRowKeys`

### 需求：Checkbox 选择列（Selection Checkbox Column）

系统必须在表格最左侧提供固定的 checkbox 列，用于选择行，该列不受列虚拟化影响，始终可见。

#### 场景：显示选择列
- **当** `DataGrid` 的 `enableRowSelection` 属性为 `true`（默认）时
- **那么** 表格必须在最左侧显示一个固定的 checkbox 列
- **并且** 该列必须始终可见，不受列虚拟化、列隐藏、列顺序调整影响

#### 场景：行 checkbox 选择
- **当** 用户点击某行的 checkbox 时
- **那么** 如果该行未选中，则选中该行；如果已选中，则取消选择
- **并且** 选中行的视觉样式必须改变（例如行背景色高亮）
- **并且** checkbox 必须显示勾选状态

#### 场景：表头 checkbox 全选
- **当** 用户点击表头的 checkbox 时
- **那么** 如果当前页有未选中的行，则选中当前页所有行；如果当前页所有行都已选中，则取消选择当前页所有行
- **并且** 表头 checkbox 必须显示正确的状态：
  - 当前页所有行都选中：显示勾选状态
  - 当前页部分行选中：显示半选状态（indeterminate）
  - 当前页没有行选中：显示未勾选状态

#### 场景：选择列宽度
- **当** 选择列渲染时
- **那么** 选择列的宽度必须固定为合理值（例如 48px），不受列宽调整影响
- **并且** 选择列必须位于所有固定列（pinned left）之前

### 需求：范围选择（Range Selection）

系统必须支持通过 Shift + Click 选择连续的行区间。

#### 场景：Shift + Click 范围选择
- **当** 用户按住 Shift 键并点击某行的 checkbox 时
- **那么** 系统必须选择从上次选中的行到当前行的所有行（连续区间）
- **并且** 如果之前没有选中任何行，则仅选择当前行
- **并且** 范围选择必须遵循当前的 `selectionMode`（单选模式下仅选择区间内的第一行）

#### 场景：范围选择跨页
- **当** 用户在当前页选中一行，然后滚动到其他页，按住 Shift 并点击另一行时
- **那么** 系统必须选择从上次选中行到当前行的所有行（包括跨页的行）
- **并且** 如果数据源支持，必须正确选择跨页的行；如果不支持，则仅选择当前页范围内的行

### 需求：选择状态持久化（Selection Persistence）

系统必须支持将选择状态持久化到 localStorage，以便在页面刷新或切换视图后恢复选择状态。

#### 场景：保存选择状态
- **当** `DataGrid` 的 `enableSelectionPersistence` 属性为 `true`（默认）且用户选择或取消选择行时
- **那么** 系统必须将当前选择状态保存到 `localStorage`（key: `grid-${gridId}-selection`）
- **并且** 保存的数据格式必须为 `RowKey[]`（选中行的 key 数组）

#### 场景：恢复选择状态
- **当** `DataGrid` 初始化且 `enableSelectionPersistence` 为 `true` 时
- **那么** 系统必须从 `localStorage` 读取上次保存的选择状态
- **并且** 仅恢复那些在当前数据源中仍然存在的行（通过 `rowKey` 匹配）
- **并且** 如果数据源为空或行 key 不匹配，则忽略持久化的选择状态

#### 场景：清除持久化状态
- **当** 用户点击"清除选择"或所有行都被取消选择时
- **那么** 系统必须清除 `localStorage` 中的选择状态
- **并且** 下次初始化时不会恢复任何选择

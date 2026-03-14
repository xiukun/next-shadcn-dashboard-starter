## 新增需求

### 需求：CSV 导出功能

DataGrid 必须提供 CSV 导出功能，支持导出全部数据或选中数据。

#### 场景：导出全部数据
- **当** 用户点击"导出全部 CSV"按钮时
- **那么** 系统必须导出表格中的所有数据为 CSV 文件
- **并且** 导出文件应包含表头和所有数据行

#### 场景：导出选中数据
- **当** 用户选择多行后点击"导出选中"按钮时
- **那么** 系统必须仅导出选中的数据行
- **并且** 导出文件应包含表头和选中的数据行

**实现方式**：
- 提供 `exportToCSV<Row>(rows, columns, options)` 函数
- 提供 `exportSelectedRowsToCSV<Row>(rows, selectedRowKeys, columns, options)` 函数
- 支持自定义文件名、是否包含表头、分隔符等配置
- 自动处理 CSV 转义（逗号、引号、换行符）
- 添加 BOM 标记确保 Excel 兼容性

**配置示例**：
```typescript
import { exportToCSV } from '@maita-table/react';

exportToCSV(allRows, columns, {
  filename: 'export.csv',
  includeHeaders: true,
  delimiter: ','
});
```

### 需求：行分组功能（Row Grouping）

DataGrid 必须支持按一个或多个字段对数据进行分组，并显示分组汇总信息。

#### 场景：按字段分组
- **当** 用户在 `initialViewState` 中设置 `groupBy` 数组时
- **那么** 表格必须按指定字段对数据进行分组
- **并且** 显示分组行，包含分组值和子行数量

#### 场景：展开/折叠分组
- **当** 用户点击分组行前的展开/折叠按钮时
- **那么** 系统必须切换该分组的展开/折叠状态
- **并且** 只影响当前分组，不影响其他分组

**实现方式**：
- 通过 `initialViewState.groupBy` 指定分组字段数组
- 分组行显示：分组值 + 子行数量 `(N)`
- 支持展开/折叠操作
- 根据分组层级自动缩进（`row.depth * 16px`）
- 通过 `defaultGroupExpanded` 控制分组行默认展开/折叠状态

**配置示例**：
```typescript
<DataGrid
  initialViewState={{
    groupBy: ['department']
  }}
  defaultGroupExpanded={true}
/>
```

### 需求：列聚合功能（Aggregation）

DataGrid 必须支持在分组行中显示各数值列的聚合结果（总和、平均值、最大值、最小值、计数等）。

#### 场景：显示聚合结果
- **当** 表格启用分组且列配置了聚合属性时
- **那么** 分组行必须显示各数值列的聚合结果
- **并且** 聚合结果应根据配置的聚合函数计算

#### 场景：自定义聚合格式化
- **当** 列配置了 `aggregationFormatter` 函数时
- **那么** 分组行必须使用该函数格式化聚合结果
- **并且** 格式化结果应清晰展示聚合类型和值

**实现方式**：
- 通过列 `meta` 配置聚合行为：
  - `enableAggregation`：是否启用聚合（默认 false）
  - `defaultAggregation`：聚合函数类型（'sum' | 'avg' | 'min' | 'max' | 'count'）
  - `aggregationFormatter`：聚合值格式化函数 `(value: number, type: string) => string`
- 分组行自动显示各列的聚合结果
- 非数值列或不启用聚合的列在分组行中留空

**配置示例**：
```typescript
const columns: ColumnConfig<Row>[] = [
  {
    id: 'salary',
    header: '薪资',
    accessor: (row) => row.salary,
    meta: {
      type: 'number',
      enableAggregation: true,
      defaultAggregation: 'avg',
      aggregationFormatter: (value, type) =>
        `平均薪资：${value.toLocaleString()}`
    }
  }
];
```

**聚合函数说明**：
- `sum`：求和
- `avg`：平均值
- `min`：最小值
- `max`：最大值
- `count`：计数

### 需求：分组默认展开控制

DataGrid 必须提供 `defaultGroupExpanded` 属性，控制分组行在初始渲染时的展开/折叠状态。

#### 场景：默认展开所有分组
- **当** `defaultGroupExpanded` 设置为 `true` 时
- **那么** 所有分组行在初始渲染时必须处于展开状态
- **并且** 用户后续可以手动折叠分组

#### 场景：默认折叠所有分组
- **当** `defaultGroupExpanded` 设置为 `false` 时
- **那么** 所有分组行在初始渲染时必须处于折叠状态
- **并且** 用户后续可以手动展开分组

**实现方式**：
- `defaultGroupExpanded?: boolean` 属性
- `true`：所有分组行默认展开
- `false`：所有分组行默认折叠
- 默认值只影响初始渲染，不影响用户后续的展开/折叠操作

**配置示例**：
```typescript
<DataGrid
  initialViewState={{ groupBy: ['department'] }}
  defaultGroupExpanded={true}  // 默认全部展开
/>
```

### 需求：性能测试页面

必须提供一个专门的性能测试页面，用于测试和展示 DataGrid 的各项功能。

#### 场景：调整数据量
- **当** 用户点击不同数据量按钮（1K、5K、10K、50K）时
- **那么** 系统必须生成对应数量的模拟数据
- **并且** 显示数据加载和渲染时间

#### 场景：测试功能
- **当** 用户在性能测试页面操作时
- **那么** 系统必须展示所有新功能（CSV 导出、分组、聚合）
- **并且** 提供功能对比清单

**实现方式**：
- 创建 `/dashboard/table-performance-demo` 页面
- 支持动态调整数据量（1K、5K、10K、50K）
- 显示渲染时间统计
- 集成所有新功能（CSV 导出、分组、聚合）
- 展示功能对比清单（与 ag-grid 对比）

**功能要求**：
- 数据量控制：快速切换不同数据量进行测试
- 性能指标：显示数据加载和渲染时间
- 功能演示：展示 CSV 导出、分组、聚合等功能
- 对比清单：清晰展示已实现和待实现的功能

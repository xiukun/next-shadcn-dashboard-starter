# DataGrid 规范

## 新增需求

### CSV 导出功能

#### 场景：用户需要导出表格数据为 CSV 格式

**需求**：DataGrid 应提供 CSV 导出功能，支持导出全部数据或选中数据。

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

### 行分组功能（Row Grouping）

#### 场景：用户需要按字段对数据进行分组展示

**需求**：DataGrid 应支持按一个或多个字段对数据进行分组，并显示分组汇总信息。

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

**交互要求**：
- 点击分组行前的展开/折叠按钮可切换该组的展开状态
- 默认展开状态只影响初始渲染，不影响用户后续操作
- 分组行应显示分组值，其他列显示聚合结果或留空

### 列聚合功能（Aggregation）

#### 场景：用户需要在分组行中查看各列的聚合值

**需求**：DataGrid 应支持在分组行中显示各数值列的聚合结果（总和、平均值、最大值、最小值、计数等）。

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

### 分组默认展开控制

#### 场景：用户需要控制分组行的默认展开状态

**需求**：DataGrid 应提供 `defaultGroupExpanded` 属性，控制分组行在初始渲染时的展开/折叠状态。

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

### 性能测试页面

#### 场景：需要验证 DataGrid 在大数据量下的性能表现

**需求**：应提供一个专门的性能测试页面，用于测试和展示 DataGrid 的各项功能。

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

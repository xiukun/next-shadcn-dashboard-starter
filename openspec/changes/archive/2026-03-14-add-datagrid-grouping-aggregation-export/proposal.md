# 增强 DataGrid 分组、聚合与导出能力

## 为什么

当前 `data-grid` 已具备基础的表格渲染、排序、过滤能力，但在企业级数据分析场景下，用户需要更强大的数据处理能力：

- **缺少分组功能**：无法按字段对数据进行分组展示，无法快速查看分组汇总信息
- **缺少聚合功能**：分组后无法显示各列的聚合值（总和、平均值、最大值等）
- **缺少导出功能**：无法将表格数据导出为 CSV 格式，限制了数据的二次分析能力
- **性能测试不足**：缺少专门的大数据量性能测试页面，无法验证虚拟滚动等性能优化效果

这些能力的缺失限制了 `data-grid` 在数据分析、报表、BI 等场景下的可用性，无法与 ag-grid 等商业化组件竞争。

## 变更内容

### 1. CSV 导出功能

- **导出全部数据**：`exportToCSV()` 函数，支持导出当前表格的所有数据
- **导出选中数据**：`exportSelectedRowsToCSV()` 函数，支持导出用户选中的行
- **自定义配置**：
  - `filename`：自定义文件名
  - `includeHeaders`：是否包含表头
  - `delimiter`：分隔符（默认逗号）
- **Excel 兼容**：添加 BOM 标记，确保 Excel 正确识别 UTF-8 编码

### 2. 行分组功能（Row Grouping）

- **分组配置**：通过 `initialViewState.groupBy` 指定分组字段
- **分组显示**：
  - 分组行显示分组值 + 子行数量 `(N)`
  - 支持展开/折叠操作
  - 根据分组层级自动缩进
- **默认展开控制**：通过 `defaultGroupExpanded` 控制分组行默认展开/折叠状态
- **交互优化**：点击分组按钮可正常切换展开/折叠状态，不受默认值限制

### 3. 列聚合功能（Aggregation）

- **聚合配置**：通过列 `meta` 配置聚合行为
  - `enableAggregation`：是否启用聚合
  - `defaultAggregation`：聚合函数类型（sum, avg, min, max, count）
  - `aggregationFormatter`：聚合值格式化函数
- **聚合显示**：
  - 分组行自动显示各数值列的聚合结果
  - 支持自定义聚合值的显示格式（如"平均薪资：xxx"）
- **多列聚合**：支持同时为多个列配置不同的聚合方式

### 4. 性能测试页面

- **创建测试页面**：`/dashboard/table-performance-demo`
- **数据量控制**：支持 1K、5K、10K、50K 数据量测试
- **性能指标**：显示渲染时间统计
- **功能对比**：展示与 ag-grid 的功能对比清单
- **集成测试**：集成 CSV 导出、分组、聚合等新功能进行综合测试

## 影响

### 受影响规范
- `data-grid`（新增分组、聚合、导出相关需求）

### 受影响代码

**新增文件**：
- `packages/maita-table-react/src/utils/export.ts`（CSV 导出工具函数）
- `src/app/[locale]/dashboard/table-performance-demo/page.tsx`（性能测试页面）

**修改文件**：
- `packages/maita-table-react/src/DataGrid.tsx`（添加 `defaultGroupExpanded` 属性）
- `packages/maita-table-react/src/hooks/useTableInstance.ts`（集成分组和聚合功能）
- `packages/maita-table-react/src/hooks/useTableColumns.ts`（配置列聚合函数）
- `packages/maita-table-react/src/components/DataGridCell.tsx`（渲染分组行和聚合单元格）
- `packages/maita-table-react/src/index.ts`（导出 CSV 工具函数）
- `src/config/nav-config.ts`（添加性能测试页面导航项）

### 新增依赖

**无需新增依赖**！所有需要的库都已安装：
- ✅ `@tanstack/react-table` - 提供分组和聚合功能（`getGroupedRowModel`, `getExpandedRowModel`）
- ✅ 浏览器原生 API - `Blob`, `URL.createObjectURL` 用于文件下载

## 实施策略

1. **先实现 CSV 导出**：基础功能，快速验证
2. **再实现分组功能**：核心功能，需要与 TanStack Table 深度集成
3. **最后实现聚合功能**：在分组基础上增强，提供数据分析能力
4. **创建测试页面**：综合测试所有新功能，验证性能表现

## 验收标准

1. ✅ CSV 导出功能正常工作，支持全部和选中数据导出
2. ✅ 分组功能正常工作，支持展开/折叠操作
3. ✅ 默认展开控制正常工作，不影响用户手动操作
4. ✅ 聚合功能正常工作，支持多种聚合函数和自定义格式化
5. ✅ 性能测试页面正常工作，可测试大数据量场景
6. ✅ 所有功能通过列属性（meta）和组件属性控制
7. ✅ 性能测试：10,000+ 行数据下流畅操作

## 参考

- [AG Grid Examples](https://ag-grid.com/example/)
- [AG Grid Grouping](https://www.ag-grid.com/react-data-grid/grouping/)
- [AG Grid Aggregation](https://www.ag-grid.com/react-data-grid/aggregation/)
- [TanStack Table Grouping](https://tanstack.com/table/latest/docs/guide/grouping)
- [TanStack Table Aggregation](https://tanstack.com/table/latest/docs/guide/aggregation)

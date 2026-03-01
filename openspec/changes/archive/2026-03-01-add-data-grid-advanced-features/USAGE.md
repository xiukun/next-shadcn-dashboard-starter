# DataGrid 高级功能使用指南

本文档说明如何使用 DataGrid 的高级功能：排序、过滤、浮动过滤器等。

## 快速开始

### 1. 基本配置

```tsx
import { DataGrid } from '@maita-table/react';
import { createNextDataSource } from '@maita-table/next';

const dataSource = createNextDataSource<YourRowType>('/api/your-endpoint');

const columns: ColumnConfig<YourRowType>[] = [
  {
    id: 'name',
    header: '名称',
    accessor: (row) => row.name,
    enableSorting: true, // 启用排序
    meta: {
      enableFiltering: true, // 启用过滤
      filterType: 'text', // 文本过滤
      enableFloatingFilter: true, // 启用浮动过滤器
      filterPlaceholder: '搜索名称...'
    }
  }
];

<DataGrid
  id="my-grid"
  columns={columns}
  dataSource={dataSource}
/>
```

## 功能详解

### 排序功能

#### 启用排序

在列配置中设置 `enableSorting: true`：

```tsx
{
  id: 'name',
  header: '名称',
  accessor: (row) => row.name,
  enableSorting: true
}
```

#### 使用方式

- **单列排序**：点击列头标题或排序图标，切换排序状态（升序 → 降序 → 无）
- **多列排序**：按住 `Ctrl`（Mac: `Cmd`）键并点击另一列的排序图标，添加新的排序列
- **清除排序**：通过列菜单中的"清除排序"选项

#### 排序状态可视化

- 升序：显示 ↑ 图标
- 降序：显示 ↓ 图标
- 多列排序：每个排序列显示排序序号（1, 2, 3...）

### 过滤功能

#### 启用过滤

在列配置的 `meta` 中设置：

```tsx
{
  id: 'name',
  header: '名称',
  accessor: (row) => row.name,
  meta: {
    enableFiltering: true,
    filterType: 'text', // 'text' | 'number' | 'date'
    enableFloatingFilter: true, // 可选：启用浮动过滤器
    filterPlaceholder: '搜索名称...'
  }
}
```

#### 过滤类型

##### 文本过滤 (`filterType: 'text'`)

支持的操作符：
- `contains` - 包含
- `startsWith` - 以...开始
- `endsWith` - 以...结束
- `equals` - 等于
- `notEquals` - 不等于

##### 数字过滤 (`filterType: 'number'`)

支持的操作符：
- `gt` - 大于
- `lt` - 小于
- `gte` - 大于等于
- `lte` - 小于等于
- `eq` - 等于
- `ne` - 不等于
- `between` - 范围

##### 日期过滤 (`filterType: 'date'`)

支持日期选择器和日期范围过滤。

#### 浮动过滤器

浮动过滤器在表头下方显示输入框，实现实时过滤：

```tsx
meta: {
  enableFloatingFilter: true,
  filterPlaceholder: '搜索...'
}
```

特点：
- 固定在表头下方，不受滚动影响
- 使用防抖（300ms）优化性能
- 实时更新过滤条件

#### 过滤菜单

点击列头的过滤图标打开过滤菜单，可以：
- 选择过滤操作符
- 输入过滤值
- 清除过滤条件

### 列菜单

列菜单提供完整的列操作功能：

- **排序**：升序、降序、清除排序
- **过滤**：打开过滤菜单、清除过滤
- **固定列**：固定到左侧、固定到右侧、取消固定
- **列宽调整**：自动调整列宽

## 国际化（i18n）

### 配置翻译

1. 创建翻译文件：

```json
// src/messages/zh/data-grid.json
{
  "columnMenu": {
    "sortAsc": "升序排序",
    "sortDesc": "降序排序",
    "clearSort": "清除排序",
    "filter": "过滤",
    "clearFilter": "清除过滤",
    "pinLeft": "固定到左侧",
    "pinRight": "固定到右侧",
    "unpin": "取消固定",
    "autoResizeColumn": "自动调整列宽"
  }
}
```

2. 在页面中使用：

```tsx
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('data-grid');

  return (
    <DataGrid
      id="my-grid"
      columns={columns}
      dataSource={dataSource}
      columnMenuLabels={{
        sortAsc: t('columnMenu.sortAsc'),
        sortDesc: t('columnMenu.sortDesc'),
        clearSort: t('columnMenu.clearSort'),
        filter: t('columnMenu.filter'),
        clearFilter: t('columnMenu.clearFilter'),
        pinLeft: t('columnMenu.pinLeft'),
        pinRight: t('columnMenu.pinRight'),
        unpin: t('columnMenu.unpin'),
        autoResizeColumn: t('columnMenu.autoResizeColumn')
      }}
    />
  );
}
```

## 完整示例

参考 `src/app/[locale]/dashboard/table-filter-demo/page.tsx` 查看完整的使用示例。

## 注意事项

1. **性能优化**：浮动过滤器使用防抖处理，避免频繁更新
2. **前端过滤**：如果数据源支持，可以使用 TanStack Table 的 `getFilteredRowModel` 进行前端过滤
3. **状态管理**：排序和过滤状态通过 `DataGridQuery` 协议推送到数据源
4. **列属性驱动**：所有功能通过列配置的 `meta` 属性控制

## 相关文档

- [OpenSpec 变更提案](./proposal.md)
- [设计文档](./DESIGN.md)
- [库使用说明](./LIBRARY_USAGE.md)

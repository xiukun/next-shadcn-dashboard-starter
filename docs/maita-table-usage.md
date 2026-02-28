# @maita-table 使用指南

本文档说明如何在项目中使用 `@maita-table` 表格组件库。

## 安装

`@maita-table` 是 monorepo 内的 workspace 包，无需额外安装。确保 `pnpm-workspace.yaml` 已正确配置：

```yaml
packages:
  - 'packages/*'
  - '.'
```

## 快速开始

### 1. 定义数据类型

```typescript
type ProductRow = {
  id: number;
  name: string;
  price: number;
  status: 'active' | 'archived';
};
```

### 2. 创建数据源

使用 `@maita-table/next` 创建 Next.js 数据源：

```typescript
import { createNextDataSource } from '@maita-table/next';

const dataSource = createNextDataSource<ProductRow>('/api/products');
```

### 3. 定义列配置

```typescript
import type { ColumnConfig } from '@maita-table/core';

const columns: ColumnConfig<ProductRow>[] = [
  {
    id: 'id',
    header: 'ID',
    accessor: (row) => row.id
  },
  {
    id: 'name',
    header: '名称',
    accessor: (row) => row.name,
    meta: {
      type: 'string',
      editable: true,
      editorType: 'text',
      validate: (value: string) => {
        if (!value?.trim()) return '名称不能为空';
        if (value.length > 50) return '名称长度不能超过 50 个字符';
        return null;
      }
    }
  },
  {
    id: 'price',
    header: '价格',
    accessor: (row) => row.price,
    meta: {
      type: 'number',
      editable: true,
      editorType: 'number',
      min: 0,
      decimals: 2,
      formatStyle: 'currency',
      currency: 'CNY',
      locale: 'zh-CN'
    }
  }
];
```

### 4. 使用 DataGrid 组件

```typescript
import { DataGrid } from '@maita-table/react';

export default function ProductsPage() {
  return (
    <DataGrid<ProductRow>
      id='products-grid'
      columns={columns}
      dataSource={dataSource}
      initialViewState={{ pageSize: 100 }}
    />
  );
}
```

## API Route 实现

数据源需要对应的 Next.js API Route：

```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { DataGridQuery, DataGridResult } from '@maita-table/core';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 解析查询参数
  const page = parseInt(searchParams.get('page') || '0');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  // 获取数据（示例）
  const products = await getProducts({ page, pageSize });
  
  const result: DataGridResult<ProductRow> = {
    rows: products,
    totalRowCount: await getTotalCount()
  };
  
  return NextResponse.json(result);
}
```

## 列配置选项

### 基础配置

- `id`: 列唯一标识
- `header`: 列标题（支持函数）
- `accessor`: 数据访问函数
- `visible`: 是否可见（默认 `true`）

### 编辑配置（meta）

- `editable`: 是否可编辑
- `editorType`: 编辑器类型（`'text'` | `'number'` | `'checkbox'`）
- `validate`: 校验函数，返回错误消息或 `null`

### 数值列配置（meta）

- `min` / `max`: 数值范围
- `decimals`: 小数位数
- `step`: 步进值
- `allowNegative`: 是否允许负数
- `formatStyle`: 格式样式（`'decimal'` | `'currency'` | `'percent'`）
- `currency`: 货币代码（如 `'CNY'`）
- `locale`: 本地化字符串
- `thousandSeparator`: 是否使用千分位分隔符
- `colorBySign`: 是否根据正负值着色

### 文本列配置（meta）

- `maxLength`: 最大长度
- `placeholder`: 占位符文本

## 编辑交互

### 键盘快捷键

- **Enter**: 提交编辑
- **Esc**: 取消编辑
- **Tab**: 移动到下一个可编辑单元格
- **Shift+Tab**: 移动到上一个可编辑单元格
- **↑/↓**: 数值列步进（仅 `editorType: 'number'`）

### 编辑状态管理

- 点击单元格进入编辑模式
- 双击单元格进入编辑模式
- 点击其他单元格自动取消当前编辑
- 点击空白区域取消当前编辑
- 校验失败时保持编辑状态并显示错误

## 性能优化

### 虚拟化

`DataGrid` 自动启用行虚拟化，支持渲染大量数据：

```typescript
<DataGrid
  id='large-grid'
  columns={columns}
  dataSource={dataSource}
  initialViewState={{ pageSize: 10000 }} // 支持万行数据
  estimateRowHeight={36} // 可选：估算行高
/>
```

### 分页

通过 `initialViewState` 配置分页：

```typescript
initialViewState={{
  pageIndex: 0,
  pageSize: 50
}}
```

## 多语言支持

使用 `next-intl` 进行多语言配置：

```typescript
import { useTranslations } from 'next-intl';

const t = useTranslations('products');

const columns: ColumnConfig<ProductRow>[] = [
  {
    id: 'name',
    header: t('columns.name'),
    // ...
  }
];
```

## 完整示例

参考 `src/app/[locale]/dashboard/table-demo/page.tsx` 查看完整示例。

## 故障排除

### 数据不显示

1. 检查 API Route 是否正确实现
2. 检查 `DataSource.fetch` 返回格式是否符合 `DataGridResult`
3. 检查列 `accessor` 函数是否正确

### 编辑不生效

1. 检查列 `meta.editable` 是否为 `true`
2. 检查 `meta.editorType` 是否匹配数据类型
3. 检查校验函数返回值格式

### 性能问题

1. 确保使用虚拟化（默认启用）
2. 减少初始 `pageSize`
3. 优化 `accessor` 函数，避免复杂计算

## 相关文档

- [实现计划](./plans/maita-table-implementation.md)
- OpenSpec 变更: `openspec/changes/add-maita-table-library/`
- OpenSpec 编辑功能: `openspec/changes/add-maita-table-editing/`

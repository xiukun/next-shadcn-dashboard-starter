# 库使用说明

## 核心原则

**充分利用现有库，避免重复造轮子**

## 已安装的库及其用途

### 1. TanStack Table（@tanstack/react-table）

**用途**：表格核心功能
- ✅ `getSortedRowModel()` - 排序功能
- ✅ `getFilteredRowModel()` - 过滤功能
- ✅ `getGroupedRowModel()` - 分组功能
- ✅ `getExpandedRowModel()` - 展开/折叠功能
- ✅ `aggregationFns` - 内置聚合函数（sum, min, max, avg, count）

**优势**：
- 性能优化（内置缓存、批量更新）
- 类型安全（完整的 TypeScript 支持）
- 功能强大（支持复杂场景）

**使用示例**：
```tsx
import { 
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel
} from '@tanstack/react-table';

const table = useReactTable({
  data: rows,
  columns: columnDefs,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(), // 启用排序
  getFilteredRowModel: getFilteredRowModel(), // 启用过滤
  getGroupedRowModel: getGroupedRowModel(), // 启用分组
});
```

### 2. Radix UI + @floating-ui/react（通过 shadcn/ui）

**用途**：浮动层定位和交互
- ✅ `Popover` - 列菜单、过滤菜单
- ✅ `DropdownMenu` - 某些菜单场景
- ✅ `Tooltip` - 提示信息

**优势**：
- 自动定位和碰撞检测（@floating-ui/react）
- 完整的 A11y 支持（Radix UI）
- 开箱即用（shadcn/ui 封装）

**使用示例**：
```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

<Popover>
  <PopoverTrigger asChild>
    <Button>打开菜单</Button>
  </PopoverTrigger>
  <PopoverContent align="start" className="w-64">
    {/* 菜单内容 */}
  </PopoverContent>
</Popover>
```

**注意**：Radix UI 底层使用 @floating-ui/react，无需直接安装

### 3. cmdk（通过 shadcn/ui Command）

**用途**：高性能搜索和命令面板
- ✅ 集过滤器的搜索功能
- ✅ 快速过滤选项列表

**优势**：
- 高性能搜索（虚拟化、防抖）
- 键盘导航支持
- 模糊匹配

**使用示例**：
```tsx
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';

<Command>
  <CommandInput placeholder="搜索选项..." />
  <CommandList>
    {filteredOptions.map(option => (
      <CommandItem key={option}>{option}</CommandItem>
    ))}
  </CommandList>
</Command>
```

### 4. shadcn/ui 组件库

**已安装的组件及其用途**：

| 组件 | 用途 | 位置 |
|------|------|------|
| `Popover` | 列菜单容器 | ColumnMenu.tsx |
| `Command` | 集过滤器搜索 | SetFilter.tsx |
| `Input` | 浮动过滤器输入 | FloatingFilter.tsx |
| `Checkbox` | 集过滤器多选 | SetFilter.tsx |
| `Select` | 过滤操作符选择 | FilterMenu.tsx |
| `ScrollArea` | 长列表滚动 | SetFilter.tsx |
| `Collapsible` | 分组行展开/折叠 | GroupRow.tsx |
| `Button` | 各种按钮 | 所有组件 |
| `Separator` | 菜单分隔线 | ColumnMenu.tsx |

### 5. @tanstack/react-virtual

**用途**：虚拟化渲染
- ✅ 行虚拟化（已在使用）
- ✅ 分组行虚拟化
- ✅ 集过滤器选项列表虚拟化（如果选项很多）

**优势**：
- 高性能（只渲染可见项）
- 已集成到项目中

## 架构优势

### 1. 零额外依赖
- 所有需要的库都已安装
- 无需 `npm install` 新包
- 减少包体积和依赖冲突

### 2. 统一的设计系统
- 所有 UI 组件使用 shadcn/ui
- 一致的视觉风格
- 统一的交互模式

### 3. 性能优化
- TanStack Table 内置性能优化
- @floating-ui/react 自动优化定位
- cmdk 高性能搜索
- react-virtual 虚拟化渲染

### 4. 类型安全
- 所有库都有完整的 TypeScript 支持
- 类型推断和自动补全
- 编译时错误检查

## 实施建议

### 阶段 1：列头重构
- 使用 `Popover` 组件
- 使用 `Button` 组件
- 保持简单，不过度抽象

### 阶段 2：过滤功能
- 使用 `Input` 组件（浮动过滤）
- 使用 `Popover` + `Command`（集过滤器）
- 使用 `Select`（过滤操作符）

### 阶段 3：分组聚合
- 使用 TanStack Table 的 `getGroupedRowModel`
- 使用 `Collapsible` 组件（展开/折叠）
- 使用 TanStack Table 的 `aggregationFns`

## 总结

通过充分利用现有库，我们可以：
1. ✅ **减少开发时间** - 无需实现底层功能
2. ✅ **提高代码质量** - 使用经过验证的库
3. ✅ **保持一致性** - 统一的设计系统
4. ✅ **优化性能** - 库内置的性能优化
5. ✅ **零额外成本** - 无需安装新依赖

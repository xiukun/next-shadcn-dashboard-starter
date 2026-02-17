# 规范：侧边栏折叠行为配置

**规范 ID**: `layout/sidebar-collapse-behavior`  
**变更 ID**: `20260217155832-optimize-sidebar-collapse-behavior`  
**创建时间**: 2026-02-17

## 概述

本规范定义了侧边栏在折叠状态下的两种显示模式，以及用户如何通过设置面板进行选择。

## 新增需求

### 需求：侧边栏折叠模式配置

系统**必须**提供侧边栏折叠模式配置功能，**必须**支持两种模式：图标模式和展开子项模式，**必须**允许用户在设置面板中选择模式。

#### 场景：用户在设置面板中选择侧边栏折叠效果

**前置条件**:
- 用户已登录
- 用户已打开设置面板
- 用户在"布局"标签页

**操作步骤**:
1. 用户在设置面板的"侧边栏"区域看到"折叠效果"选项
2. 用户选择"图标模式"或"展开子项模式"
3. 设置立即生效，侧边栏行为改变

**预期结果**:
- 选择"图标模式"时，侧边栏折叠时只显示图标，子菜单隐藏
- 选择"展开子项模式"时，侧边栏折叠时只显示图标，鼠标悬停时通过 HoverCard 显示子菜单项
- 设置保存到本地存储，刷新页面后保持

#### 场景：侧边栏在图标模式下折叠

**前置条件**:
- `sidebarCollapseMode` 设置为 `'icon'`
- 侧边栏处于折叠状态

**操作步骤**:
1. 用户点击侧边栏折叠按钮
2. 侧边栏折叠，只显示图标
3. 用户点击某个有子菜单的菜单项图标

**预期结果**:
- 侧边栏展开
- 子菜单显示
- 用户可以访问子菜单项

#### 场景：侧边栏在展开子项模式下折叠

**前置条件**:
- `sidebarCollapseMode` 设置为 `'expanded-submenu'`
- 侧边栏处于折叠状态

**操作步骤**:
1. 用户点击侧边栏折叠按钮
2. 侧边栏折叠，只显示图标
3. 用户将鼠标悬停在有子菜单的菜单项图标上
4. 用户点击子菜单项

**预期结果**:
- 侧边栏折叠，只显示图标
- 子菜单项默认隐藏
- 鼠标悬停时，右侧显示 HoverCard 弹框，展示所有子菜单项
- 点击子菜单项可以导航，侧边栏保持折叠状态
- 点击父菜单项不会展开侧边栏

## 折叠模式定义

### 模式 1: 图标模式（Icon Mode）

**标识**: `'icon'`  
**默认值**: 是

**行为描述**:
- 侧边栏折叠时，只显示菜单项的图标
- 子菜单项（`SidebarMenuSub`）完全隐藏
- 用户需要点击菜单项图标，展开侧边栏后，才能看到子菜单项
- 这是当前系统的默认行为

**适用场景**:
- 需要最大化主内容区域
- 用户熟悉菜单结构，不需要频繁查看子菜单
- 移动端或小屏幕设备

### 模式 2: 展开子项模式（Expanded Submenu Mode）

**标识**: `'expanded-submenu'`  
**默认值**: 否

**行为描述**:
- 侧边栏折叠时，只显示菜单项的图标
- 子菜单项（`SidebarMenuSub`）默认隐藏
- 鼠标悬停在有子菜单的菜单项图标上时，通过 `HoverCard` 弹框显示所有子菜单项
- 点击子菜单项可以导航，侧边栏保持折叠状态
- 点击父菜单项不会展开侧边栏

**适用场景**:
- 需要快速访问多级菜单
- 菜单结构复杂，需要频繁切换子菜单
- 桌面端大屏幕设备

## 数据结构

### UserPreferences 接口扩展

```typescript
interface UserPreferences {
  // ... 现有字段
  
  /**
   * 侧边栏折叠模式
   * 'icon': 图标模式，折叠时只显示图标，子菜单隐藏
   * 'expanded-submenu': 展开子项模式，折叠时显示图标和所有子菜单项
   * 默认值: 'icon'
   */
  sidebarCollapseMode: 'icon' | 'expanded-submenu';
}
```

### UserPreferencesStore 接口扩展

```typescript
interface UserPreferencesStore extends UserPreferences {
  // ... 现有方法
  
  /**
   * 设置侧边栏折叠模式
   * @param mode - 折叠模式：'icon' 或 'expanded-submenu'
   */
  setSidebarCollapseMode: (mode: 'icon' | 'expanded-submenu') => void;
}
```

## 组件行为规范

### SidebarMenuSub 组件

**当前实现**:
```tsx
className={cn(
  'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
  'group-data-[collapsible=icon]:hidden', // 折叠时始终隐藏
  className
)}
```

**新实现要求**:
- 当 `sidebarCollapseMode === 'icon'` 时，保持当前行为（折叠时隐藏）
- 当 `sidebarCollapseMode === 'expanded-submenu'` 时，折叠时也应显示
- 需要根据 `sidebarCollapseMode` 动态调整样式类

### SidebarMenuSubButton 组件

**当前实现**:
```tsx
className={cn(
  // ... 基础样式
  'group-data-[collapsible=icon]:hidden', // 折叠时始终隐藏
  className
)}
```

**新实现要求**:
- 当 `sidebarCollapseMode === 'icon'` 时，保持当前行为
- 当 `sidebarCollapseMode === 'expanded-submenu'` 时，折叠时也应显示
- 可能需要调整折叠状态下的样式（如宽度、内边距等）

### AppSidebar 组件

**行为要求**:
1. 读取 `sidebarCollapseMode` 设置
2. 将设置传递给子组件或用于条件渲染
3. 在展开子项模式下，`Collapsible` 组件的 `defaultOpen` 应始终为 `true`
4. 在展开子项模式下，可以禁用 `Collapsible` 的折叠功能，或始终保持展开状态

## 设置面板规范

### UI 位置

- **标签页**: "布局"标签页
- **位置**: 在"标签栏"设置区域之后，新增"侧边栏"设置区域

### UI 结构

```tsx
<div className='space-y-4'>
  <div className='space-y-2'>
    <h3 className='text-sm font-medium'>侧边栏</h3>
  </div>

  <div className='space-y-2'>
    <Label>折叠效果</Label>
    <p className='text-muted-foreground text-sm'>
      选择侧边栏折叠时的显示方式
    </p>
    <RadioGroup
      value={sidebarCollapseMode}
      onValueChange={(value) =>
        setSidebarCollapseMode(value as 'icon' | 'expanded-submenu')
      }
    >
      <div className='flex items-center space-x-2'>
        <RadioGroupItem value='icon' id='icon-mode' />
        <Label htmlFor='icon-mode' className='cursor-pointer font-normal'>
          图标模式
        </Label>
      </div>
      <div className='flex items-center space-x-2'>
        <RadioGroupItem value='expanded-submenu' id='expanded-submenu-mode' />
        <Label htmlFor='expanded-submenu-mode' className='cursor-pointer font-normal'>
          展开子项模式
        </Label>
      </div>
    </RadioGroup>
  </div>
</div>
```

### 选项说明

- **图标模式**: "折叠时只显示图标，点击展开子菜单"
- **展开子项模式**: "折叠时显示图标和所有子菜单项"

## 样式规范

### 展开子项模式下的样式要求

1. **子菜单容器** (`SidebarMenuSub`):
   - 在折叠状态下保持可见
   - 可能需要调整左边距，以适应折叠状态下的图标宽度
   - 保持与展开状态一致的视觉层次

2. **子菜单项** (`SidebarMenuSubButton`):
   - 在折叠状态下保持可见
   - 文字可能需要截断或使用省略号
   - 保持 hover 和 active 状态的交互效果

3. **布局调整**:
   - 确保子菜单项不会与侧边栏边界重叠
   - 保持合理的间距和缩进

## 交互规范

### 模式切换

1. **即时生效**: 用户选择模式后，侧边栏行为立即改变
2. **无刷新**: 不需要刷新页面
3. **状态保持**: 切换模式时，侧边栏的展开/折叠状态应保持

### 展开子项模式下的交互

1. **子菜单访问**: 用户可以直接点击子菜单项进行导航
2. **父菜单点击**: 点击父菜单项时，如果侧边栏是折叠状态，应该展开侧边栏并导航到父菜单项
3. **折叠/展开**: 侧边栏的折叠/展开操作不影响子菜单的显示

## 性能考虑

1. **渲染优化**: 展开子项模式下会渲染更多 DOM 节点，需要确保性能不受影响
2. **样式计算**: 避免频繁的样式重计算
3. **状态更新**: 使用 React 的优化机制，避免不必要的重渲染

## 兼容性要求

1. **向后兼容**: 默认值为 `'icon'`，保持现有行为
2. **浏览器兼容**: 支持所有主流浏览器
3. **响应式**: 在移动端和桌面端都能正常工作

## 测试要求

### 功能测试

1. ✅ 图标模式下，折叠时子菜单隐藏
2. ✅ 展开子项模式下，折叠时子菜单显示
3. ✅ 模式切换立即生效
4. ✅ 设置持久化存储
5. ✅ 刷新页面后设置保持

### 视觉测试

1. ✅ 两种模式下的样式正确
2. ✅ 子菜单项对齐和间距合理
3. ✅ 交互状态（hover、active）正常
4. ✅ 不同屏幕尺寸下布局正常

### 性能测试

1. ✅ 展开子项模式下渲染性能正常
2. ✅ 模式切换响应迅速
3. ✅ 无内存泄漏

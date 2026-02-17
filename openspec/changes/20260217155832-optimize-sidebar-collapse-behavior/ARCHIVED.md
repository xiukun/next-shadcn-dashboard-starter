# 变更归档：优化侧边栏折叠行为

**变更 ID**: `20260217155832-optimize-sidebar-collapse-behavior`  
**创建时间**: 2026-02-17  
**归档时间**: 2026-02-17  
**状态**: 已完成并归档

## 变更总结

本次变更成功实现了侧边栏折叠行为的优化，提供了两种折叠模式供用户选择：

1. **图标模式**（默认）：折叠时只显示图标，点击展开子菜单
2. **展开子项模式**：折叠时只显示图标，鼠标悬停时通过 HoverCard 显示子菜单项

## 实施内容

### 1. 用户偏好设置扩展

- **文件**: `src/lib/user-preferences-store.ts`
- **变更**:
  - 新增 `sidebarCollapseMode` 字段：`'icon' | 'expanded-submenu'`
  - 新增 `setSidebarCollapseMode` 方法
  - 默认值：`'icon'`（保持向后兼容）

### 2. 导航组件优化

- **文件**: `src/components/layout/app-sidebar.tsx`
- **变更**:
  - 集成 `HoverCard` 组件用于悬停显示子菜单
  - 使用 `useSidebar` hook 获取侧边栏状态
  - 在展开子项模式且折叠状态下：
    - 子菜单默认隐藏
    - 鼠标悬停时通过 HoverCard 显示子菜单
    - 点击菜单项不会展开侧边栏

### 3. 设置面板扩展

- **文件**: `src/components/layout/settings-panel.tsx`
- **变更**:
  - 在"布局"标签页中新增"侧边栏折叠效果"设置项
  - 使用 RadioGroup 提供两个选项
  - 添加详细的说明文字

## 技术实现细节

### HoverCard 集成

- 使用 Radix UI 的 `HoverCard` 组件
- 悬停延迟：200ms
- 关闭延迟：100ms
- 弹框位置：右侧对齐，起始位置对齐
- 弹框宽度：224px（w-56）

### 条件渲染逻辑

```typescript
const shouldUseHoverOnly =
  sidebarCollapseMode === 'expanded-submenu' && isCollapsed;

if (shouldUseHoverOnly && hasSubmenu) {
  // 使用 HoverCard 显示子菜单
  return <HoverCard>...</HoverCard>;
}
```

### 样式处理

- 在展开子项模式下，子菜单默认隐藏
- 通过 HoverCard 弹框显示，避免占用侧边栏空间
- 保持与侧边栏子菜单一致的样式和交互

## 验收结果

✅ 所有验收标准均已满足：
1. 设置面板中新增"侧边栏折叠效果"选项
2. 图标模式行为正确
3. 展开子项模式行为正确（悬停显示）
4. 设置立即生效
5. 设置持久化存储
6. 默认值保持向后兼容
7. 点击菜单项不展开侧边栏

## 测试验证

- ✅ TypeScript 类型检查通过
- ✅ 构建成功
- ✅ OpenSpec 规范验证通过
- ✅ 无 linter 错误

## 文件变更清单

1. `src/lib/user-preferences-store.ts` - 扩展用户偏好设置
2. `src/components/layout/app-sidebar.tsx` - 实现折叠模式逻辑
3. `src/components/layout/settings-panel.tsx` - 添加设置选项
4. `openspec/changes/20260217155832-optimize-sidebar-collapse-behavior/` - OpenSpec 文档

## 后续建议

1. 可以考虑添加更多折叠模式选项
2. 优化 HoverCard 的动画过渡效果
3. 考虑添加键盘导航支持

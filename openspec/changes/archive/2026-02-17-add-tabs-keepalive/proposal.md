# 变更提案：实现 Tabs 页面 Keep-Alive DOM 缓存

**变更 ID**: `add-tabs-keepalive`  
**创建时间**: 2026-02-17  
**状态**: 进行中

## 变更概述

为路由标签页（Tabs）系统实现 Keep-Alive DOM 缓存功能，允许用户在切换标签页时保留页面状态和 DOM 结构，提升用户体验。同时提供设置开关，允许用户开启/关闭此功能。

## 为什么

### 问题背景

1. **页面状态丢失**：当前切换标签页时，Next.js 会重新渲染页面组件，导致页面状态（滚动位置、表单输入、组件状态等）丢失
2. **性能问题**：频繁切换标签页时，重复的组件挂载/卸载和数据请求影响性能
3. **用户体验不佳**：用户在多个标签页间切换时，需要重新加载和定位内容，影响工作效率
4. **缺乏控制选项**：用户无法根据自己的需求选择是否启用缓存功能

### 解决方案

参考 `admin-shadcn-nextjs` 项目的实现，采用 React Portal 和 DOM 操作的方式实现 Keep-Alive 机制：

1. **Keep-Alive Provider**：在 dashboard layout 中包裹页面内容，管理所有路由的缓存
2. **DOM 缓存策略**：使用 `createPortal` 和 DOM 操作，将缓存的页面 DOM 节点移动到隐藏容器，切换时再移回显示容器
3. **设置控制**：在用户偏好设置中添加开关，允许用户控制是否启用 Keep-Alive
4. **Next.js 16 适配**：充分利用 App Router 的 Server/Client Component 特性，确保 SSR 兼容性

## 变更原因

1. **用户体验提升**：保留页面状态，减少重复操作，提升工作效率
2. **性能优化**：减少不必要的组件重新渲染和数据请求
3. **功能完整性**：完善标签页系统的功能，使其更接近桌面应用的体验
4. **用户控制权**：提供设置选项，让用户根据需求选择是否启用

## 变更内容

### 1. 创建 Keep-Alive 核心组件

#### 1.1 KeepAliveProvider 组件
- **文件**: `src/components/layout/keep-alive-provider.tsx`
- **功能**:
  - 管理所有路由的 DOM 缓存
  - 监听路由变化，决定是否缓存当前页面
  - 根据用户设置决定是否启用 Keep-Alive
  - 使用 React Portal 和 DOM 操作实现缓存机制

#### 1.2 KeepAliveRoute 组件
- **文件**: `src/components/layout/keep-alive-route.tsx`
- **功能**:
  - 管理单个路由的缓存状态
  - 使用 `createPortal` 将缓存的 DOM 渲染到隐藏容器
  - 根据激活状态控制 DOM 节点的显示/隐藏

### 2. 扩展用户偏好设置

- **文件**: `src/stores/user-preferences-store.ts`
- **新增字段**:
  - `enableKeepAlive: boolean` - 是否启用 Keep-Alive（默认值：`true`）
  - `setEnableKeepAlive: (value: boolean) => void` - 设置方法

### 3. 扩展设置面板

- **文件**: `src/components/layout/settings-panel.tsx`
- **新增内容**:
  - 在"布局"标签页的"标签栏"部分添加"启用页面缓存"开关
  - 提供说明文字，解释 Keep-Alive 的作用

### 4. 集成到 Dashboard Layout

- **文件**: `src/app/dashboard/layout.tsx`
- **修改内容**:
  - 使用 `KeepAliveProvider` 包裹 `children`
  - 根据 `enableKeepAlive` 设置决定是否启用缓存

### 5. 路由缓存管理

- **文件**: `src/stores/route-tabs-store.ts`（可选扩展）
- **考虑**:
  - 当标签页关闭时，清理对应的缓存
  - 当缓存数量达到上限时，清理最久未使用的缓存

## 影响范围

### 受影响的组件

1. `src/components/layout/keep-alive-provider.tsx` - 新建，核心缓存逻辑
2. `src/components/layout/keep-alive-route.tsx` - 新建，单个路由缓存管理
3. `src/stores/user-preferences-store.ts` - 扩展状态字段
4. `src/components/layout/settings-panel.tsx` - 新增设置选项
5. `src/app/dashboard/layout.tsx` - 集成 Keep-Alive Provider

### 向后兼容性

- ✅ 默认启用 Keep-Alive，但用户可关闭
- ✅ 关闭 Keep-Alive 时，行为与当前实现一致
- ✅ 不影响现有路由和页面组件
- ✅ 不影响 SSR 和 SEO

## 验收标准

1. ✅ 创建 `KeepAliveProvider` 和 `KeepAliveRoute` 组件
2. ✅ 在用户偏好设置中添加 `enableKeepAlive` 字段
3. ✅ 在设置面板中添加"启用页面缓存"开关
4. ✅ 在 dashboard layout 中集成 Keep-Alive Provider
5. ✅ 启用 Keep-Alive 时，切换标签页保留页面状态和 DOM
6. ✅ 关闭 Keep-Alive 时，行为与当前实现一致
7. ✅ 设置保存后立即生效，无需刷新页面
8. ✅ 设置持久化存储，刷新页面后保持用户选择
9. ✅ 标签页关闭时，清理对应的缓存
10. ✅ 兼容 Next.js 16 App Router 的 SSR 特性

## 技术考虑

### 实现方式

1. **DOM 缓存策略**：
   - 使用 `useRef` 存储缓存的 React 节点
   - 使用 `createPortal` 将缓存的 DOM 渲染到隐藏容器
   - 使用 DOM 操作（`appendChild`/`removeChild`）控制显示/隐藏

2. **路由监听**：
   - 使用 `usePathname` 监听路由变化
   - 根据路由路径生成缓存 key
   - 判断当前路由是否需要缓存（基于标签页状态）

3. **缓存清理**：
   - 监听标签页关闭事件，清理对应缓存
   - 可选的 LRU 策略，限制缓存数量

4. **Next.js 16 适配**：
   - Keep-Alive 组件必须是 Client Component（`'use client'`）
   - 确保 SSR 时不会出错（使用 `useEffect` 和 `useState`）
   - 处理 hydration 不匹配问题

### 潜在风险

1. **内存占用**：缓存多个页面的 DOM 可能增加内存使用
2. **SSR 兼容性**：需要确保 SSR 时不会出错
3. **状态同步**：缓存的页面状态可能与实际路由状态不同步
4. **性能影响**：DOM 操作可能影响性能，需要优化
5. **React 18+ 兼容性**：确保与 React 19 和 Next.js 16 兼容

### 参考实现

参考 `admin-shadcn-nextjs/src/router` 的实现：
- `keep-alive.tsx` - 主缓存逻辑
- `keep-alive-route.tsx` - 单个路由缓存管理
- `keep-alive-sign.tsx` - 路由注册（本项目可能不需要）

## 后续优化

1. 添加缓存数量限制（LRU 策略）
2. 添加缓存统计和监控
3. 优化大页面的缓存性能
4. 考虑添加"清除所有缓存"功能
5. 添加缓存失效策略（基于时间或事件）

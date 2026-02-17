# 需求核对清单

**变更 ID**: `add-tabs-keepalive`  
**创建时间**: 2026-02-17  
**状态**: 待实施

## 需求拆解与验收标准

### 1. Keep-Alive Provider 组件
- **验收标准**：
  - ✅ 组件可以管理所有路由的 DOM 缓存
  - ✅ 根据 `enableKeepAlive` 设置决定是否启用缓存
  - ✅ 监听路由变化，自动缓存/显示页面
  - ✅ 标签页关闭时，清理对应缓存
- **文件**: `src/components/layout/keep-alive-provider.tsx`（新建）

### 2. Keep-Alive Route 组件
- **验收标准**：
  - ✅ 使用 `createPortal` 渲染缓存的 DOM
  - ✅ 根据激活状态控制 DOM 节点的显示/隐藏
  - ✅ 使用 DOM 操作管理 DOM 节点
- **文件**: `src/components/layout/keep-alive-route.tsx`（新建）

### 3. 用户偏好设置扩展
- **验收标准**：
  - ✅ 添加 `enableKeepAlive: boolean` 字段（默认值：`true`）
  - ✅ 添加 `setEnableKeepAlive` 方法
  - ✅ 设置持久化存储正常工作
- **文件**: `src/lib/user-preferences-store.ts`（修改）

### 4. 设置面板 UI 扩展
- **验收标准**：
  - ✅ 在"布局"标签页的"标签栏"部分添加"启用页面缓存"开关
  - ✅ 添加说明文字
  - ✅ 开关可以正常切换，设置立即生效
- **文件**: `src/components/layout/settings-panel.tsx`（修改）

### 5. Dashboard Layout 集成
- **验收标准**：
  - ✅ 使用 `KeepAliveProvider` 包裹 `children`
  - ✅ SSR 兼容，无 hydration 错误
  - ✅ 功能正常工作
- **文件**: `src/app/dashboard/layout.tsx`（修改）

## 需要修改/新增的文件列表

### 新建文件
1. `src/components/layout/keep-alive-provider.tsx` - Keep-Alive Provider 组件
2. `src/components/layout/keep-alive-route.tsx` - Keep-Alive Route 组件

### 修改文件
1. `src/lib/user-preferences-store.ts` - 添加 `enableKeepAlive` 字段和方法
2. `src/components/layout/settings-panel.tsx` - 添加 Keep-Alive 开关
3. `src/app/dashboard/layout.tsx` - 集成 KeepAliveProvider

## 风险点与回滚策略

### 风险点

1. **内存占用**：缓存多个页面的 DOM 可能增加内存使用
   - **缓解措施**：可选实现 LRU 策略，限制缓存数量
   - **回滚策略**：关闭 Keep-Alive 功能，恢复原有实现

2. **SSR 兼容性**：Next.js 16 App Router 的 SSR 可能导致 hydration 错误
   - **缓解措施**：使用 `useState` 和 `useEffect` 确保只在客户端执行
   - **回滚策略**：移除 KeepAliveProvider，恢复直接渲染 children

3. **性能影响**：DOM 操作可能影响性能
   - **缓解措施**：使用 `requestAnimationFrame` 优化，避免不必要的操作
   - **回滚策略**：关闭 Keep-Alive 功能

4. **状态同步**：缓存的页面状态可能与实际路由状态不同步
   - **缓解措施**：确保路由变化时正确更新缓存
   - **回滚策略**：关闭 Keep-Alive 功能

### 回滚策略

如果出现问题，可以：
1. 在设置面板中关闭 Keep-Alive 功能（用户可控制）
2. 移除 `KeepAliveProvider` 包裹，恢复直接渲染（代码回滚）
3. 删除相关组件文件（完全回滚）

## 变更如何逐条满足需求

### 需求 1：Keep-Alive Provider 组件
- ✅ 创建 `KeepAliveProvider` 组件，实现缓存管理逻辑
- ✅ 监听路由变化，决定是否缓存当前页面
- ✅ 根据 `enableKeepAlive` 设置决定是否启用缓存
- ✅ 使用 React Portal 和 DOM 操作实现缓存机制

### 需求 2：Keep-Alive Route 组件
- ✅ 创建 `KeepAliveRoute` 组件，管理单个路由的缓存
- ✅ 使用 `createPortal` 将缓存的 DOM 渲染到指定容器
- ✅ 根据激活状态控制 DOM 节点的显示/隐藏

### 需求 3：用户偏好设置扩展
- ✅ 在 `user-preferences-store.ts` 中添加 `enableKeepAlive` 字段
- ✅ 添加 `setEnableKeepAlive` 方法
- ✅ 确保持久化存储正常工作

### 需求 4：设置面板 UI 扩展
- ✅ 在设置面板的"布局"标签页中添加"启用页面缓存"开关
- ✅ 添加说明文字
- ✅ 绑定到 `enableKeepAlive` 状态

### 需求 5：Dashboard Layout 集成
- ✅ 在 `dashboard/layout.tsx` 中使用 `KeepAliveProvider` 包裹 `children`
- ✅ 确保 SSR 兼容

## 技术实现要点

1. **Next.js 16 App Router 适配**：
   - 所有 Keep-Alive 组件必须是 Client Component（`'use client'`）
   - 使用 `useState` 和 `useEffect` 确保只在客户端执行
   - 处理 hydration 不匹配问题

2. **缓存策略**：
   - 使用 `Map<string, React.ReactNode>` 存储缓存的 React 节点
   - 缓存 key 使用路由路径（`pathname`）
   - 当标签页关闭时，清理对应的缓存

3. **DOM 操作**：
   - 使用 `createPortal` 将缓存的 DOM 渲染到隐藏容器
   - 使用 DOM 操作（`appendChild`/`removeChild`）控制显示/隐藏
   - 使用 `useMemo` 创建 DOM 容器元素

4. **性能优化**：
   - 避免不必要的重新渲染
   - 使用 `requestAnimationFrame` 优化 DOM 操作（如需要）
   - 限制缓存数量（可选）

## 验收测试清单

- [ ] Keep-Alive Provider 组件正常工作
- [ ] Keep-Alive Route 组件正常工作
- [ ] 用户偏好设置中可以切换 Keep-Alive 开关
- [ ] 设置面板中显示 Keep-Alive 开关
- [ ] 启用 Keep-Alive 时，切换标签页保留页面状态
- [ ] 关闭 Keep-Alive 时，行为与当前实现一致
- [ ] 设置保存后立即生效，无需刷新页面
- [ ] 设置持久化存储，刷新页面后保持用户选择
- [ ] 标签页关闭时，清理对应的缓存
- [ ] SSR 兼容，无 hydration 错误
- [ ] 无性能问题，切换流畅

# 实施任务清单：实现 Tabs 页面 Keep-Alive DOM 缓存

**变更 ID**: `add-tabs-keepalive`  
**创建时间**: 2026-02-17

## 任务状态说明

- ⏳ 待开始
- 🔄 进行中
- ✅ 已完成
- ❌ 已取消

---

## 阶段 1：准备工作

### 任务 1.1：扩展用户偏好设置 Store
- **状态**: ✅
- **文件**: `src/stores/user-preferences-store.ts`
- **内容**:
  - 添加 `enableKeepAlive: boolean` 字段（默认值：`true`）
  - 添加 `setEnableKeepAlive: (value: boolean) => void` 方法
  - 确保持久化存储正常工作
- **验收**: Store 中有新字段和方法，默认值为 `true`

### 任务 1.2：在设置面板中添加开关
- **状态**: ✅
- **文件**: `src/components/layout/settings-panel.tsx`
- **内容**:
  - 在"布局"标签页的"标签栏"部分添加"启用页面缓存"开关
  - 添加说明文字："启用后，切换标签页时保留页面状态和 DOM 结构"
  - 绑定到 `enableKeepAlive` 状态
- **验收**: 设置面板中可以看到开关，可以切换，设置会保存

---

## 阶段 2：核心组件实现

### 任务 2.1：创建 KeepAliveRoute 组件
- **状态**: ✅
- **文件**: `src/components/layout/keep-alive-route.tsx`
- **内容**:
  - 创建 Client Component
  - 实现 `createPortal` 逻辑，将缓存的 DOM 渲染到指定容器
  - 根据 `activeKey` 和 `pageKey` 控制显示/隐藏
  - 使用 DOM 操作（`appendChild`/`removeChild`）管理 DOM 节点
  - 使用 `useMemo` 创建 DOM 容器元素
  - 使用 `useEffect` 管理 DOM 节点的添加/移除
- **验收**: 组件可以正确渲染缓存的 DOM，切换时显示/隐藏正常

### 任务 2.2：创建 KeepAliveProvider 组件
- **状态**: ✅
- **文件**: `src/components/layout/keep-alive-provider.tsx`
- **内容**:
  - 创建 Client Component
  - 使用 `useRef` 存储缓存的 React 节点（`Map<string, React.ReactNode>`）
  - 使用 `usePathname` 监听路由变化
  - 读取 `enableKeepAlive` 设置，决定是否启用缓存
  - 读取 `route-tabs-store` 的标签页列表，判断哪些路由需要缓存
  - 实现缓存逻辑：
    - 当前路由不在缓存中时，缓存当前页面
    - 当前路由在缓存中时，显示缓存的页面
  - 监听标签页关闭事件，清理对应缓存
  - 使用 `KeepAliveRoute` 组件渲染所有缓存的页面
- **验收**: 
  - 切换标签页时，页面状态保留
  - 关闭标签页时，缓存被清理
  - 关闭 Keep-Alive 时，行为与当前实现一致

---

## 阶段 3：集成和测试

### 任务 3.1：集成到 Dashboard Layout
- **状态**: ✅
- **文件**: `src/app/dashboard/layout.tsx`
- **内容**:
  - 导入 `KeepAliveProvider` 组件
  - 使用 `KeepAliveProvider` 包裹 `children`
  - 确保只在客户端渲染（使用动态导入或条件渲染）
- **验收**: Dashboard 页面可以正常访问，Keep-Alive 功能正常工作

### 任务 3.2：处理 SSR 和 Hydration
- **状态**: ✅
- **文件**: `src/components/layout/keep-alive-provider.tsx`
- **内容**:
  - 使用 `useState` 和 `useEffect` 确保只在客户端执行缓存逻辑
  - 处理 hydration 不匹配问题
  - 确保 SSR 时不会出错
- **验收**: 页面 SSR 正常，无 hydration 错误

### 任务 3.3：编写单元测试（可选）
- **状态**: ❌
- **文件**: `src/components/layout/__tests__/keep-alive-provider.test.tsx`
- **内容**:
  - 测试缓存逻辑
  - 测试路由切换
  - 测试缓存清理
  - 测试设置开关
- **验收**: 测试通过

---

## 阶段 4：优化和验证

### 任务 4.1：性能优化
- **状态**: ⏳
- **内容**:
  - 优化 DOM 操作性能
  - 添加缓存数量限制（可选）
  - 优化大页面的缓存性能
- **验收**: 性能测试通过，无明显性能问题

### 任务 4.2：边界情况处理
- **状态**: ⏳
- **内容**:
  - 处理路由不存在的情况
  - 处理标签页列表为空的情况
  - 处理快速切换标签页的情况
  - 处理浏览器后退/前进的情况
- **验收**: 所有边界情况处理正确，无错误

### 任务 4.3：Code Review
- **状态**: ⏳
- **内容**:
  - 代码审查
  - 需求对照检查
  - 技术质量检查
- **验收**: Code Review 通过

### 任务 4.4：功能验证
- **状态**: ⏳
- **内容**:
  - 验证所有验收标准
  - 手动测试各种场景
  - 验证设置持久化
- **验收**: 所有功能正常，符合验收标准

---

## 实施顺序

1. 阶段 1：准备工作（任务 1.1 → 1.2）
2. 阶段 2：核心组件实现（任务 2.1 → 2.2）
3. 阶段 3：集成和测试（任务 3.1 → 3.2 → 3.3）
4. 阶段 4：优化和验证（任务 4.1 → 4.2 → 4.3 → 4.4）

---

## 注意事项

1. **Next.js 16 适配**：确保所有组件正确处理 SSR 和客户端渲染
2. **React 19 兼容性**：确保与 React 19 兼容
3. **性能考虑**：注意内存占用和 DOM 操作性能
4. **用户体验**：确保切换流畅，无明显延迟
5. **向后兼容**：确保关闭 Keep-Alive 时，行为与当前实现一致

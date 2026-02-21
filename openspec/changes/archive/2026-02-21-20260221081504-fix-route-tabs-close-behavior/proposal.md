# 变更提案：修复 Dashboard Tabs 关闭行为

## Change ID

`20260221081504-fix-route-tabs-close-behavior`

## 为什么

在引入基于 canonical path 的多语言 Tabs 管理后，Dashboard Tabs 在以下场景存在不符合预期的行为：

- 用户通过侧边栏多次点击同一个功能菜单时，Tabs 区域虽然只显示一个标签，但关闭该标签时，需要多次点击关闭按钮才能真正关闭
- 具体现象：关闭当前页面对应的 Tab 后，路由尚未跳转到其它页面之前，Tabs 管理逻辑会根据当前 pathname 重新自动创建同一个 Tab，导致“刚关闭又回来了”

这会带来：

- 用户体验不佳：关闭动作看起来“没有生效”，需要多次点击
- 行为不透明：Tabs 的自动创建逻辑与用户显式关闭操作产生冲突
- 难以维护：当前规范中没有明确约束“关闭当前路由 Tab 时不得立即重新创建”

## 变更内容

1. **补充规范：Dashboard Tabs 关闭行为**
   - 在 `layout` 规范中，对“Dashboard Tabs 与多语言 canonical path”需求进行 **修改**：
     - 明确：当用户在当前路由下关闭对应的 Tab 时，系统 **不得** 立即重新创建同一路由的 Tab
     - 仅当路由再次发生变化并导航回该 canonical path 时，才允许重新创建 Tab
   - 补充“场景：关闭当前路由标签页”的详细步骤

2. **实现调整：Tabs 自动创建逻辑**
   - 调整 `use-route-tabs` 中监听路由变化的逻辑：
     - 仅在 **路由（pathname / canonicalPath / 查询参数 / 导航配置）变化** 时创建或更新 Tab
     - 不再因为 Tabs Store 本身的变化（如关闭 Tab）而重新触发自动创建逻辑
   - 确保：
     - 关闭当前路由的 Tab 后，不会在当前路由仍然停留时被自动重新创建
     - 当用户再次通过菜单或地址栏回到该路由时，Tabs 能按规范重新创建

3. **实现调整：关闭 Tab 后的导航行为（如有必要）**
   - 复核 `route-tabs-store` 与 `route-tabs` 组件中“关闭当前激活 Tab 后跳转到其它 Tab”的逻辑
   - 确保关闭当前路由 Tab 后，实际路由与 `activeTabId` 始终保持一致

## 影响范围

- **受影响规范**
  - `layout`：Dashboard Tabs 与多语言 canonical path

- **受影响代码**
  - `src/hooks/use-route-tabs.ts`：路由变化 → Tabs 自动创建/更新逻辑
  - `src/stores/route-tabs-store.ts`：Tab 关闭与激活逻辑（只读审查，必要时微调）
  - `src/components/layout/route-tabs.tsx`：关闭 Tab 时调用 `removeTab` 与路由跳转逻辑（只读审查，必要时微调）
  - `src/components/layout/keep-alive-provider.tsx`：缓存键与 Tabs 同步逻辑（行为核对）

## 验收标准

1. ✅ 多次点击某个 Dashboard 菜单（如“Billing”）后，Tabs 区域始终只出现一个对应的标签页
2. ✅ 在该路由下点击关闭该 Tab：
   - 该 Tab 被关闭后 **不会自动重新创建**
   - 若存在其它 Tab，则按照既有规则跳转到新的激活 Tab 且只需点击一次即可关闭
3. ✅ 再次通过菜单点击同一路由时，Tabs 能正确重新创建该路由的 Tab
4. ✅ 默认 Dashboard Tab（`/dashboard/overview`）行为不变：始终存在且不可关闭
5. ✅ 与 Keep-Alive 缓存的行为一致：
   - 关闭 Tab 时清理对应 canonical path 的缓存
   - 不再因自动重新创建 Tab 而残留多余缓存
6. ✅ TypeScript 检查通过（`npx tsc --noEmit`）

## 风险与回滚

### 风险

- 若 Tabs 自动创建逻辑限制过严，可能导致在某些边界场景（例如特殊重定向）下 Tab 未被创建
- 调整依赖关系后，可能遗漏某些需要更新 Tab 标题/图标的场景（如语言切换）

### 回滚策略

如发现 Tabs 无法在部分场景下正确创建或更新：

1. 使用 git 回滚本次变更相关文件：
   - `src/hooks/use-route-tabs.ts`
   - `src/components/layout/route-tabs.tsx`
2. 保持已有 canonical path 规范不变，仅重新设计关闭行为的实现方案


# 任务清单：修复 Dashboard Tabs 关闭行为

## Change ID

`20260221081504-fix-route-tabs-close-behavior`

## 任务状态说明

- ⏳ 待开始
- 🔄 进行中
- ✅ 已完成
- ⚠️ 部分完成 / 有已知限制

## 阶段 1：分析与规范补充

### 任务 1.1：分析现有 Tabs 与 Keep-Alive 行为
- **状态**: 🔄 进行中
- **内容**:
  - 阅读并梳理：
    - `src/hooks/use-route-tabs.ts`
    - `src/stores/route-tabs-store.ts`
    - `src/components/layout/route-tabs.tsx`
    - `src/components/layout/keep-alive-provider.tsx`
  - 复现问题：
    - 多次点击同一功能菜单（如 Billing）
    - 关闭对应 Tab，观察是否需要多次点击才能真正关闭

### 任务 1.2：补充 layout 规范中的 Tabs 关闭行为
- **状态**: ⏳ 待开始
- **内容**:
  - 在 `openspec/changes/20260221081504-fix-route-tabs-close-behavior/specs/layout/spec.md` 中：
    - 使用“## 修改需求”覆盖 `Dashboard Tabs 与多语言 canonical path` 需求
    - 新增“场景：关闭当前路由标签页”
    - 明确关闭当前路由 Tab 时不得立即重新创建的约束

## 阶段 2：实现调整

### 任务 2.1：调整 use-route-tabs 的自动创建逻辑
- **状态**: ⏳ 待开始
- **内容**:
  - 仅在 **路由相关信息变化** 时执行 Tabs 自动创建/更新：
    - `pathname` / `canonicalPath`
    - 查询参数（searchParams）
    - 导航配置（translatedNavItems）
  - 移除对 `tabs` 变化的直接依赖，避免关闭 Tab 时因 Store 变化重新创建同一路由 Tab
  - 保持以下能力不变：
    - 语言切换时更新 Tab 标题/图标
    - 默认 Tab `/dashboard/overview` 的不可关闭行为

### 任务 2.2：复核关闭 Tab 后的导航行为
- **状态**: ⏳ 待开始
- **内容**:
  - 核对 `route-tabs-store.removeTab` 返回的新激活 Tab 逻辑是否合理
  - 核对 `route-tabs.tsx` 中：
    - 关闭当前激活 Tab 后，通过 `switchToTab` 正确导航到新激活路由
  - 如有必要，仅做最小调整，保证：
    - Tabs Store 中的 `activeTabId` 与实际路由保持一致

## 阶段 3：验证与 Code Review

### 任务 3.1：本地验证关闭行为
- **状态**: ⏳ 待开始
- **内容**:
  - 手动验证以下场景：
    - 多次点击同一菜单（如 Billing / Product / Kanban），Tabs 中仅出现一个对应 Tab
    - 在该路由下关闭 Tab：
      - 只需点击一次即可关闭，不会重新自动出现
      - 若存在其它 Tab，则正确切换到新激活 Tab
    - 再次点击同一菜单时，可以重新创建对应 Tab

### 任务 3.2：类型检查与基本构建
- **状态**: ⏳ 待开始
- **内容**:
  - 运行 TypeScript 检查：`npx tsc --noEmit`
  - （可选）运行构建：`pnpm build`
- **验收**:
  - TypeScript 检查通过，无新增类型错误
  - 构建如因外部网络问题失败（如 Google Fonts），需在 REVIEW 中注明

### 任务 3.3：记录 Code Review 结果
- **状态**: ⏳ 待开始
- **内容**:
  - 按“自动 Code Review”流程：
    - 总结变更点与风险
    - 确认与 `layout` 规范的一致性
    - 在 `openspec/changes/20260221081504-fix-route-tabs-close-behavior/REVIEW.md` 中记录

## 完成标准

当且仅当以下条件全部满足时，视为本变更完成：

1. ✅ layout 规范中已补充 Tabs 关闭行为的约束与场景
2. ✅ 关闭当前路由的 Tab 时，不会在当前路由未变化前被自动重新创建
3. ✅ 多次点击同一菜单仅产生一个 Tab，关闭一次即可完全关闭
4. ✅ 再次导航回该路由时，Tabs 能按规范重新创建对应 Tab
5. ✅ TypeScript 检查通过，无新增类型错误
6. ✅ REVIEW.md 中记录了本次变更的 Code Review 结论


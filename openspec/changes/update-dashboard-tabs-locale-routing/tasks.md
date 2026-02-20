# 任务清单：Dashboard Tabs 与多语言路由规范化

## Change ID

`update-dashboard-tabs-locale-routing`

## 任务状态说明

- ⏳ 待开始
- 🔄 进行中
- ✅ 已完成
- ❌ 已取消

## 任务列表

### 阶段 1：规范与设计

#### 任务 1.1：补充 layout 规范（Tabs 与 locale）
- **状态**: 🔄 进行中
- **文件**: `openspec/changes/update-dashboard-tabs-locale-routing/specs/layout/spec.md`
- **内容**:
  - 在 `layout` 规范中为 Tabs / Keep-Alive 补充“多语言路由下的 canonical path 规则”
  - 明确：Tabs 的路由 ID 必须使用去除 locale 前缀后的 canonical path
  - 明确：默认 Dashboard Tab（`/dashboard/overview`）在任何 locale 下都只能存在一个且不可关闭
- **验收**:
  - 规范中包含“修改需求：Keep-Alive Provider 组件（监听路由变化场景）”的完整段落
  - `openspec-cn validate update-dashboard-tabs-locale-routing --strict` 通过

### 阶段 2：实现 Tabs canonical path 行为

#### 任务 2.1：为 Tabs 引入 canonical path 计算
- **状态**: ⏳ 待开始
- **文件**: `src/hooks/use-route-tabs.ts`
- **内容**:
  - 基于 `routing.locales` 实现 `normalizePathForTabs(pathname)` 工具函数
  - 对形如 `/{locale}/dashboard/...` 的路径返回 `/dashboard/...`，否则返回原始 pathname
  - 使用 canonical path 进行 Dashboard 路由筛选（是否需要参与 Tabs）
- **验收**:
  - 在不同 locale 下访问 Dashboard 路由时，调试中能看到 canonical path 一致

#### 任务 2.2：使用 canonical path 作为 Tab ID
- **状态**: ⏳ 待开始
- **文件**: `src/hooks/use-route-tabs.ts`, `src/stores/route-tabs-store.ts`
- **内容**:
  - 在创建 Tab 时使用 canonical path 作为 `RouteTab.id`
  - `hasTab` / `setActiveTab` / `updateTabUrl` 等方法使用 canonical path 判断与激活 Tab
  - `tab.url` 仍然保存完整 pathname（含 locale 与 query）
  - 默认 Dashboard Tab（`/dashboard/overview`）与 canonical path 完全一致
- **验收**:
  - 访问 `/zh/dashboard/overview` 与 `/en/dashboard/overview` 不会新增第二个 Dashboard Tab
  - 同一路由在同一 locale 下切换 query 参数，仅更新 `url`，不新增 Tab

### 阶段 3：测试与验证

#### 任务 3.1：手动功能测试（多语言 + Tabs）
- **状态**: ⏳ 待开始
- **内容**:
  - 在浏览器中访问：
    - `/zh/dashboard/overview`
    - `/en/dashboard/overview`
  - 打开多个 Dashboard 子页面（如 Product、Kanban）
  - 切换语言并观察 Tabs 行为
- **验收**:
  - 始终只有一个 Dashboard Tab，且不可关闭
  - 不会出现带 locale 的重复 Tabs（如 `/en/...` 与 `/zh/...` 同时存在）

#### 任务 3.2：openspec 校验与类型检查
- **状态**: ⏳ 待开始
- **命令**:
  - `openspec-cn validate update-dashboard-tabs-locale-routing --strict`
  - `npx tsc --noEmit`
- **验收**:
  - OpenSpec 校验通过
  - TypeScript 无错误

### 阶段 4：Code Review 与归档

#### 任务 4.1：自动 Code Review
- **状态**: ⏳ 待开始
- **内容**:
  - 加载技能：
    - `openskills read requesting-code-review`
    - `openskills read code-review-expert`
  - 对照：
    - 本次变更的 proposal 与 layout 规范
    - Tabs / Keep-Alive 实现代码
- **验收**:
  - 给出明确的 Review 结论（通过 / 待改进）
  - 如有问题，修复后重新验证

#### 任务 4.2：归档变更（如已部署）
- **状态**: ⏳ 待开始
- **命令**:
  - `openspec-cn archive update-dashboard-tabs-locale-routing --yes`（仅在变更已部署到正式环境后执行）
- **验收**:
  - 变更成功移动到 `openspec/changes/archive/YYYY-MM-DD-update-dashboard-tabs-locale-routing`
  - layout 规范合并增量后的版本与实现一致


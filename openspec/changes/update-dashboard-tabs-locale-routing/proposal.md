# 变更提案：规范 Dashboard Tabs 与多语言路由的关系

## Change ID

`update-dashboard-tabs-locale-routing`

## 为什么

在引入基于 `/[locale]/...` 的多语言路由后，Dashboard 相关路由出现了以下问题：

1. **默认 Dashboard Tab 被重复创建**  
   - 当前 Tabs 存储使用不带 locale 的路径（如 `/dashboard/overview`）作为默认固定 Tab
   - 但实际访问的地址为 `/{locale}/dashboard/overview`（如 `/en/dashboard/overview`）
   - Tabs Hook 使用完整 pathname 作为 Tab ID，导致同一页面出现两个 Tab：
     - 默认固定 Tab：`/dashboard/overview`
     - 实际访问 Tab：`/en/dashboard/overview`
2. **默认 Dashboard 行为与设计不一致**  
   - 设计期望：默认 Dashboard 作为“基础页”，**不占用额外的标签位置**，始终只有一个不可关闭的 Dashboard Tab
   - 实际行为：切换语言或直接访问 `/{locale}/dashboard/overview` 时，会新增一个可关闭的 Dashboard Tab
3. **后续扩展隐患**  
   - 如果未来增加更多 locale（如 `ja`、`fr`），同一路由在不同语言下可能继续生成多个重复 Tab
   - Keep-Alive / Tabs 行为与 `layout` 规范中“监听路由变化”的描述不完全一致（缺少对 locale 前缀的规范）

## 变更内容

1. **统一 Tabs 的“路由标识”语义**：  
   使用**去除 locale 前缀后的规范化路径（canonical path）**作为 Tab 的唯一 ID。
2. **保持默认 Dashboard Tab 的唯一性**：  
   不论当前 locale 是 `zh` 还是 `en`，访问 `/{locale}/dashboard/overview` 时都只使用一个不可关闭的默认 Dashboard Tab。
3. **与 layout 规范对齐**：  
   在 `layout` 规范中明确 Tabs/Keep-Alive 在多语言场景下的路由匹配规则（基于 canonical path，而非原始 pathname）。

## 影响范围

- 规范：
  - `openspec/specs/layout/spec.md`（通过本次变更的增量文件进行“修改需求”）
- 代码逻辑：
  - Tabs 行为：
    - `src/hooks/use-route-tabs.ts`
    - `src/stores/route-tabs-store.ts`
  - 可能受影响的相关组件（只需行为验证，无需大改）：
    - `src/components/layout/route-tabs.tsx`
    - `src/components/layout/keep-alive-provider.tsx`
    - `src/components/layout/header.tsx`

## 技术方案概述

1. **在规范中定义 canonical path 规则**
   - 当 pathname 形如 `/{locale}/dashboard/...` 且 `{locale}` 属于受支持语言时：
     - Tabs 存储和去重使用的 ID 必须是去除 locale 前缀后的路径，例如：
       - `/en/dashboard/overview` 与 `/zh/dashboard/overview` 的 canonical path 均为 `/dashboard/overview`
   - 默认 Dashboard Tab 的 canonical path 固定为 `/dashboard/overview`，并且不可关闭。

2. **在实现中使用 canonical path 作为 Tab ID**
   - 在 `use-route-tabs` 中：
     - 引入 `normalizePathForTabs(pathname)`，基于 `routing.locales` 去掉 locale 前缀。
     - 使用 canonical path 进行：
       - Dashboard 路由过滤（是否需要参与 Tabs）
       - `hasTab` / `setActiveTab` / `addTab` 等操作的 ID
     - 仍然使用完整的 pathname（含 locale + query）作为 `tab.url`，保证路由跳转正确。
   - 在 `route-tabs-store` 中：
     - 沿用现有 `DEFAULT_TAB`（`/dashboard/overview`），与 canonical path 完全一致。
     - 不需要更改持久化结构，只需约定新进来的 `RouteTab.id` 为 canonical path。

3. **行为约束**
   - 访问 `/{locale}/dashboard/overview` 时：
     - 只会激活/更新默认 Dashboard Tab，而不会新增新的 Tab。
   - 访问其他 Dashboard 子路由（如 `/{locale}/dashboard/product`）时：
     - 使用去除 locale 前缀后的 canonical path 作为 Tab ID（如 `/dashboard/product`）
     - 仍然支持最多 8 个可关闭 Tab 的策略。
   - 切换 locale 时：
     - 依旧由现有的 `Providers` 中逻辑决定是否重置 Tabs（当前实现为：locale 变化时 `resetTabs()`），本次变更不改变这一策略。

## 验收标准（与 layout 规范对齐）

1. 访问 `/zh/dashboard/overview` 或 `/en/dashboard/overview` 时：
   - ✅ Header 中始终只存在**一个** Dashboard Tab
   - ✅ 该 Tab 不可关闭
2. 在 Dashboard 下打开多个子页面（如 Product / Kanban）后：
   - ✅ Tabs 中不会出现带 locale 的重复项（例如不会同时存在 `/en/dashboard/product` 与 `/zh/dashboard/product` 两个 Tab）
   - ✅ 同一路由在同一 locale 下切换 query 参数时，仍复用同一个 Tab，只更新 `url`
3. 切换语言（通过语言切换器）：
   - ✅ 不会出现多个 Dashboard Tab
   - ✅ Tabs 行为与现有“重置 Tabs 策略”保持一致（当前实现是切换 locale 时重置）
4. 使用 `openspec-cn validate update-dashboard-tabs-locale-routing --strict` 通过校验。


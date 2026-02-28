# 重构 data-grid 校验为 Zod-only

## 为什么

当前 `data-grid` 的“结构化验证支持”同时兼容 Zod Schema 与旧的 `meta.validate` 函数，这在开发阶段带来几类问题：

- **实现复杂度与维护成本偏高**：核心校验路径需要同时维护两套分支（Zod + 任意函数），类型系统难以完全覆盖，增加后续演进成本。
- **性能不可预测**：自定义 `validate` 函数可以执行任意逻辑，在大数据量场景下难以统一优化（例如预构建 Schema、批量校验、最小化校验范围）。
- **行为不够收敛**：不同列之间可能混用两种校验方式，给上层调用者和文档带来额外心智负担。

在当前项目阶段，我们已经将 Zod 作为约定的验证库，并且不需要兼容历史项目的旧 `validate` 逻辑，因此可以通过一次性重构，将 `data-grid` 的校验行为收敛为 **Zod-only**，以获得更好的类型安全、可预测性能与更简单的实现。

## 变更内容

- **规范层**：
  - 更新 `data-grid` 规范中“结构化验证支持”相关需求，明确：
    - Zod Schema 是唯一的结构化验证机制；
    - 不再支持 `meta.validate` 等任意函数式校验；
    - 列级与行级校验的职责边界与错误模型。
- **内核层（`@maita-table/core`）**：
  - 简化 `validation` 模块，只暴露基于 Zod 的列级/行级校验 API；
  - 在初始化阶段预构建列级与行级 Zod Schema，避免在单元格渲染或频繁编辑时重复创建 Schema；
  - 统一校验结果结构为 `Record<RowKey, Record<ColId, string[]>>` 或等价模型，供 React 层与提交逻辑复用。
- **React 绑定层（`@maita-table/react`）**：
  - 更新 `useTableSubmission`、`DataGrid` 等 Hook/组件，仅通过新的 Zod 校验 API 工作；
  - 在编辑流程中按“单元格 → 行 → 批量提交”三个层次设计最小化校验范围与节流策略；
  - 移除对旧 `meta.validate` 的任何调用分支。
- **文档与示例**：
  - 更新 `docs/maita-table/data-grid.md`，只展示 Zod Schema 配置方式，不再展示 `validate` 例子；
  - 确保示例表格（如 `table-demo`）全部迁移到 Zod-only 校验。

## 影响

- **受影响规范**：
  - `data-grid`（更新“结构化验证支持”相关需求）
- **受影响代码**（至少包括）：
  - `packages/maita-table-core/src/validation.ts`
  - `packages/maita-table-react/src/hooks/useTableSubmission.ts`
  - `packages/maita-table-react/src/DataGrid.tsx`
  - 可能：`packages/maita-table-core/src/state.ts`（若校验错误结构在此定义）
  - `docs/maita-table/data-grid.md`


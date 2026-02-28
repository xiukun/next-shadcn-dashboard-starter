## 1. 规范与规划
- [x] 1.1 阅读 `openspec/specs/data-grid/spec.md` 中现有“结构化验证支持”需求与相关场景
- [x] 1.2 在 `openspec/changes/refactor-data-grid-zod-only-validation/specs/data-grid/spec.md` 中编写规范增量，使用 `## 修改需求` 覆盖“结构化验证支持”
- [x] 1.3 运行 `openspec-cn validate refactor-data-grid-zod-only-validation --strict`，修正所有规范格式问题

## 2. 内核层重构（@maita-table/core）
- [x] 2.1 为现有 `packages/maita-table-core/src/validation.ts` 编写覆盖当前行为的单元测试（包括同时存在 Zod 与 validate 的场景）
- [x] 2.2 明确未来保留的公开 API 形态（列级/行级校验输入输出类型），在测试中固定下来
- [x] 2.3 移除对 `meta.validate` 的支持路径，只保留基于 Zod 的实现
- [x] 2.4 在初始化阶段预构建列级与行级 Schema（避免在单元格渲染/编辑时重复创建）
- [x] 2.5 更新/新增测试，覆盖：
  - 仅列级 Schema 的校验行为
  - 行级 Schema 的跨字段校验
  - 无 Schema 时的行为（例如：跳过校验或抛出明确错误）

## 3. React 绑定层重构（@maita-table/react）
- [x] 3.1 为 `useTableSubmission` 与 `DataGrid` 现有校验/提交流程补齐关键测试（编辑成功、编辑失败、批量提交）
- [x] 3.2 将所有校验调用收敛到新的 Zod-only API（不再感知 `meta.validate`）
- [x] 3.3 在编辑流程中实现“单元格 → 行 → 批量提交”分级校验策略，并确保只在需要时触发行级/批量级校验
- [x] 3.4 检查并优化与节流/防抖逻辑的配合，避免多余的重复校验

## 4. 文档与示例更新
- [x] 4.1 更新 `docs/maita-table/data-grid.md` 中关于校验的章节，去除 `validate` 示例，仅保留 Zod Schema 方式
- [x] 4.2 更新 `src/app/[locale]/dashboard/table-demo/page.tsx` 等示例，确保所有列的校验均通过 Zod 配置

## 5. 验证与收尾
- [x] 5.1 运行 `pnpm test` / `pnpm test --filter maita-table-*`，确保相关测试全部通过
- [x] 5.2 运行 `pnpm lint`，确保无新的 Lint 问题（当前命令配置存在路径问题，已记录为项目级待修复项）
- [x] 5.3 运行 `openspec-cn validate refactor-data-grid-zod-only-validation --strict` 与 `openspec-cn validate --specs --strict --no-interactive`
- [x] 5.4 根据测试与规范结果更新本文件勾选状态


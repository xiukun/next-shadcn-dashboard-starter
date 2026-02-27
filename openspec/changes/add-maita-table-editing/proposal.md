# 变更：为 @maita-table 增加单元格编辑与内联表单能力

## 为什么
当前 @maita-table 已经提供了高性能的大数据渲染能力与 Next 适配层，但仅支持只读表格展示。为了覆盖更多企业级业务场景（如订单管理、库存调整、配置编辑等），需要在现有内核之上引入可复用的单元格/行编辑模型、校验与提交流程，同时保持良好的性能和与多项目复用的约束。

## 变更内容
- 在 `@maita-table/core` 中补充与「编辑」相关的状态与事件模型（例如编辑中的单元格、暂存值、校验错误结构）。
- 在 `@maita-table/react` 中提供编辑相关的交互约定：
  - 支持通过列 meta 标记 `editable`、`editorType`、`validate`。
  - 支持点击/双击进入编辑、Enter 提交、Esc 取消等基础键盘交互。
  - 提供一个默认的编辑 UI 组件集合（基于 shadcn 风格的 input/select/checkbox 等）。
- 在 `@maita-table/next` 或示例页面中演示一条「编辑 → 调用 API → 更新行数据」的完整流程，并提供错误提示与乐观/悲观更新策略示例。

## 影响
- 受影响规范：`data-grid` 能力规范将新增「编辑」相关需求。
- 受影响代码：
  - `packages/maita-table-core`：扩展状态与事件类型，可能新增编辑控制器逻辑。
  - `packages/maita-table-react`：增加编辑用的 hook/组件，以及与 TanStack Table 的集成。
  - `apps` 中的一个示例表格页面：新增可编辑示例与文档说明。


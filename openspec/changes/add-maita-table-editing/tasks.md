## 1. 规划与设计
- [ ] 1.1 细化编辑相关用例与交互（单元格编辑、整行编辑、提交/取消、键盘行为）
- [ ] 1.2 明确与后端 API 的交互模式（单元格级 PATCH、行级 PATCH 或批量提交）

## 2. @maita-table/core 编辑状态与事件
- [ ] 2.1 在 `DataGridRuntimeState` 中扩展编辑相关字段（如 `editingCell`、`editingDraftValues`、`validationErrors`）
- [ ] 2.2 在 `DataGridInternalEvent` 中新增编辑相关事件（进入编辑、更新草稿、提交、取消）
- [ ] 2.3 为编辑事件增加控制器逻辑，确保状态变更有测试覆盖

## 3. @maita-table/react 编辑交互与组件
- [ ] 3.1 在 `DataGrid` 中根据列 meta 渲染默认编辑器（text/number/select/checkbox 等）
- [ ] 3.2 实现基础键盘交互：Enter 提交、Esc 取消、Tab 在可编辑单元格之间移动
- [ ] 3.3 为编辑状态与校验错误提供视觉反馈（使用 shadcn 风格的边框/提示）
- [ ] 3.4 为上述行为添加组件级测试（包括成功提交与校验失败两类场景）

## 4. 与 Next API 的集成示例
- [ ] 4.1 在现有 demo 或新页面中增加一个可编辑表格示例（例如可编辑价格与状态）
- [ ] 4.2 新增或扩展对应 API Route，演示一次完整的编辑提交流程
- [ ] 4.3 在文档中说明如何在业务项目中配置编辑行为与错误处理

## 5. 验证与 Review
- [ ] 5.1 运行全部测试与 lint，确保新增编辑能力不破坏现有行为
- [ ] 5.2 对照 `data-grid` 规范中新增的编辑需求逐条自查，并准备 Code Review 说明


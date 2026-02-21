# 需求核对清单

**变更 ID**: `20260221192143-integrate-json-render`  
**创建时间**: 2026-02-21  
**状态**: 待实施

## 需求拆解与验收标准

### 1. 依赖安装 ✅

**需求**：安装所有必需的依赖包

**验收标准**：
- [x] `@json-render/core` 已安装
- [x] `@json-render/react` 已安装
- [x] `@json-render/shadcn` 已安装
- [x] `ai` (Vercel AI SDK) 已安装
- [x] 所有 peer dependencies 已满足（react ^19.0.0, zod ^4.0.0）
- [x] 无依赖冲突
- [x] TypeScript 类型定义正确加载

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 实现约束

### 2. Catalog 定义 ✅

**需求**：定义 AI 可以使用的组件和操作

**验收标准**：
- [x] Catalog 文件位于 `src/lib/json-render/catalog.ts`
- [x] 至少包含 10 个常用组件（Card, Stack, Heading, Button, Input, Text, Form, Label, Select, Checkbox, RadioGroup, Dialog, Sheet, Alert）
- [x] 每个组件包含 props schema（Zod）
- [x] 每个组件包含描述（中文）
- [x] 至少包含 3 个操作（submit, navigate, showToast）
- [x] 每个操作包含 params schema（Zod）
- [x] 每个操作包含描述（中文）
- [x] `catalog.prompt()` 能够生成有效的 system prompt

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：Catalog 定义

### 3. Registry 映射 ✅

**需求**：将 catalog 中的组件类型映射到实际的 shadcn/ui 组件

**验收标准**：
- [x] Registry 文件位于 `src/lib/json-render/registry.tsx`
- [x] 所有 catalog 中定义的组件都已映射
- [x] 组件 props 类型匹配
- [x] 正确处理组件的 children
- [x] 正确处理组件的 emit 事件
- [x] 类型安全（通过 TypeScript 检查）

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：Registry 映射

### 4. API 路由 ✅

**需求**：提供流式生成 JSON spec 的 API 端点

**验收标准**：
- [x] API 路由位于 `src/app/api/generate-ui/route.ts`
- [x] 支持 POST 请求
- [x] 能够接收 prompt（从请求 body）
- [x] 使用 `catalog.prompt()` 生成 system prompt
- [x] 使用 `streamText` 流式生成 JSON spec
- [x] 返回流式响应
- [x] 支持环境变量配置 AI 模型
- [x] 完善的错误处理

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：API 路由

### 5. UI 渲染组件 ✅

**需求**：提供渲染 JSON spec 的 UI 组件

**验收标准**：
- [x] 组件位于 `src/components/json-render/json-renderer.tsx`
- [x] 使用 `Renderer` 组件渲染 spec
- [x] 集成所有必需的 providers（StateProvider, VisibilityProvider, ActionProvider, ValidationProvider）
- [x] 使用 `useUIStream` hook 处理流式数据
- [x] 支持数据绑定（$state 路径）
- [x] 支持条件可见性
- [x] 实现 action handlers（submit, navigate, showToast）
- [x] 显示加载状态
- [x] 错误处理

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：UI 渲染组件

### 6. 示例页面 ✅

**需求**：提供示例页面展示功能

**验收标准**：
- [x] 页面位于 `src/app/[locale]/dashboard/generative-ui/page.tsx`
- [x] 提供 prompt 输入框
- [x] 提供生成按钮
- [x] 显示渲染区域
- [x] 集成 JsonRenderer 组件
- [x] 处理生成状态（loading, error）
- [x] 提供示例 prompt 提示（可选）

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：示例页面

### 7. 国际化支持 ✅

**需求**：所有用户可见文本支持国际化

**验收标准**：
- [x] 翻译文件位于 `src/messages/zh/json-render.json`
- [x] 翻译文件位于 `src/messages/en/json-render.json`
- [x] 消息加载器已更新（`src/i18n/messages.ts`）
- [x] 所有组件使用 `useTranslations` hook
- [x] 所有用户可见文本都使用翻译键
- [x] 支持中英文切换

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：国际化支持

### 8. 功能完整性 ✅

**需求**：所有核心功能正常工作

**验收标准**：
- [x] 基础组件渲染正常（Card, Button, Input 等）
- [x] 流式渲染正常工作
- [x] 数据绑定正常工作
- [x] 条件可见性正常工作
- [x] Action handlers 正常工作（按钮点击、表单提交、导航、Toast）
- [x] 错误处理正常（无效 JSON、网络错误等）
- [x] 边界情况处理正常（空 prompt、生成中断等）

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 所有需求场景

## 需要修改/新增的文件列表

### 修改的文件

1. `package.json` - 添加依赖
2. `src/i18n/messages.ts` - 添加 json-render 命名空间
3. `src/config/nav-config.ts` - 添加导航项（可选）

### 新增的文件

1. `src/lib/json-render/catalog.ts` - Catalog 定义
2. `src/lib/json-render/registry.tsx` - Registry 映射
3. `src/app/api/generate-ui/route.ts` - API 路由
4. `src/components/json-render/json-renderer.tsx` - UI 渲染组件
5. `src/app/[locale]/dashboard/generative-ui/page.tsx` - 示例页面
6. `src/messages/zh/json-render.json` - 中文翻译
7. `src/messages/en/json-render.json` - 英文翻译
8. `src/components/json-render/error-boundary.tsx` - 错误边界（可选）

## 风险点与回滚策略

### 风险点

1. **依赖版本冲突**
   - **风险**：json-render 可能与现有依赖冲突
   - **缓解**：使用最新稳定版，检查 peer dependencies
   - **回滚**：卸载相关包，恢复 package.json

2. **AI 模型配置**
   - **风险**：需要配置 AI 模型 API key，可能产生费用
   - **缓解**：使用环境变量配置，支持不同模型
   - **回滚**：移除 API 路由，使用 mock 数据

3. **流式渲染性能**
   - **风险**：大量组件时可能影响性能
   - **缓解**：优化渲染逻辑，必要时使用虚拟滚动
   - **回滚**：禁用流式渲染，使用一次性渲染

4. **类型安全**
   - **风险**：Catalog 和 Registry 类型不匹配
   - **缓解**：使用 TypeScript 严格模式，确保类型一致
   - **回滚**：修复类型定义

5. **安全性**
   - **风险**：Action handlers 可能执行危险操作
   - **缓解**：限制 action handlers 的功能，不执行 eval、XSS 等
   - **回滚**：移除或限制 action handlers

6. **SSR 兼容性**
   - **风险**：客户端组件在 SSR 环境下可能出错
   - **缓解**：使用 `'use client'` 标记，确保 SSR 兼容
   - **回滚**：修复 SSR 兼容性问题

### 回滚策略

如果实施过程中遇到严重问题，可以按以下步骤回滚：

1. **停止实施**：标记 tasks.md 中当前任务为失败
2. **移除新增文件**：删除所有新增的文件
3. **恢复修改文件**：恢复 package.json、messages.ts 等修改的文件
4. **卸载依赖**：运行 `pnpm remove @json-render/core @json-render/react @json-render/shadcn ai`
5. **更新文档**：在变更提案中记录回滚原因

## 逐条需求对齐

### 需求 1：集成 json-render 框架 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/proposal.md` - 变更概述

**实施方式**：
- 安装依赖包（阶段 1）
- 创建 Catalog 定义（阶段 2）
- 创建 Registry 映射（阶段 3）
- 创建 API 路由（阶段 4）
- 创建 UI 渲染组件（阶段 5）

### 需求 2：支持流式渲染 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：UI 渲染组件 - 场景：流式渲染

**实施方式**：
- API 路由使用 `streamText` 返回流式响应（阶段 4）
- UI 组件使用 `useUIStream` hook 处理流式数据（阶段 5）

### 需求 3：支持数据绑定 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：UI 渲染组件 - 场景：数据绑定

**实施方式**：
- 使用 `StateProvider` 管理状态（阶段 5）
- 支持 `$state` 路径绑定

### 需求 4：支持行为事件处理 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：UI 渲染组件 - 场景：行为事件处理

**实施方式**：
- 使用 `ActionProvider` 提供 action handlers（阶段 5）
- 实现 submit、navigate、showToast handlers

### 需求 5：支持条件可见性 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：UI 渲染组件 - 场景：条件可见性

**实施方式**：
- 使用 `VisibilityProvider` 管理可见性（阶段 5）
- 支持基于状态的动态可见性

### 需求 6：复用 shadcn/ui 组件 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：Registry 映射

**实施方式**：
- 使用 `@json-render/shadcn` 预定义的组件定义和实现（阶段 2、3）
- 映射到现有的 shadcn/ui 组件

### 需求 7：国际化支持 ✅

**对应规范**：`openspec/changes/20260221192143-integrate-json-render/specs/json-render/spec.md` - 需求：国际化支持

**实施方式**：
- 创建翻译文件（阶段 7）
- 更新消息加载器（阶段 7）
- 在组件中使用翻译（阶段 5、6）

## 实施检查点

在实施过程中，需要在以下检查点进行验证：

1. **阶段 1 完成后**：验证依赖安装成功，无冲突
2. **阶段 2 完成后**：验证 Catalog 定义正确，`catalog.prompt()` 能生成有效 prompt
3. **阶段 3 完成后**：验证 Registry 映射正确，类型匹配
4. **阶段 4 完成后**：验证 API 路由能接收请求并返回流式响应
5. **阶段 5 完成后**：验证 UI 组件能正确渲染简单的 JSON spec
6. **阶段 6 完成后**：验证示例页面能正常工作
7. **阶段 7 完成后**：验证国际化正常工作
8. **阶段 10 完成后**：验证所有功能测试通过

## 完成标准

所有任务完成后，需要满足以下标准：

1. ✅ 所有验收标准都已满足
2. ✅ 所有测试通过（功能测试、边界测试、国际化测试、响应式测试）
3. ✅ 代码通过 TypeScript 类型检查
4. ✅ 代码通过 ESLint 检查
5. ✅ 代码风格符合项目约定
6. ✅ 文档已更新（如需要）
7. ✅ Code Review 通过

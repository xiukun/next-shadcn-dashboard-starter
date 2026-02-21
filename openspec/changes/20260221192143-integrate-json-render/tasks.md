# 实施任务清单

**变更 ID**: `20260221192143-integrate-json-render`  
**状态**: 实施中（核心功能已完成）

## 任务列表

### 阶段 1: 依赖安装和环境准备

- [x] 1.1 安装核心依赖包
  - 文件: `package.json`
  - 安装 `@json-render/core`
  - 安装 `@json-render/react`
  - 安装 `@json-render/shadcn`
  - 安装 `ai` (Vercel AI SDK)
  - 验证 peer dependencies (react ^19.0.0, zod ^4.0.0) 已满足

- [x] 1.2 验证依赖安装
  - 运行 `pnpm install`
  - 检查是否有依赖冲突
  - 验证 TypeScript 类型定义是否正确加载

### 阶段 2: Catalog 定义

- [x] 2.1 创建 Catalog 目录结构
  - 创建 `src/lib/json-render/` 目录
  - 创建 `src/lib/json-render/catalog.ts` 文件

- [x] 2.2 定义基础组件 Catalog
  - 导入 `defineCatalog` 和 `schema`
  - 导入 `shadcnComponentDefinitions`
  - 定义至少 10 个常用组件：
    - Card, Stack, Heading, Button, Input, Text
    - Form, Label, Select, Checkbox, RadioGroup
    - Dialog, Sheet, Alert, Toast
  - 为每个组件添加中文描述

- [x] 2.3 定义 Actions Catalog
  - 定义 `submit` action（表单提交）
  - 定义 `navigate` action（页面导航）
  - 定义 `showToast` action（显示提示）
  - 为每个 action 添加中文描述和参数 schema

- [x] 2.4 导出 Catalog
  - 导出 `catalog` 常量
  - 确保类型正确

### 阶段 3: Registry 映射

- [x] 3.1 创建 Registry 文件
  - 创建 `src/lib/json-render/registry.tsx` 文件
  - 导入 `defineRegistry` 和 `shadcnComponents`
  - 导入 catalog

- [x] 3.2 映射组件到 shadcn/ui
  - 映射所有 catalog 中定义的组件
  - 确保组件 props 类型匹配
  - 处理组件的 children 和 emit 事件

- [x] 3.3 导出 Registry
  - 导出 `registry` 常量
  - 确保类型正确

### 阶段 4: API 路由

- [x] 4.1 创建 API 路由目录
  - 创建 `src/app/api/generate-ui/` 目录
  - 创建 `src/app/api/generate-ui/route.ts` 文件

- [x] 4.2 实现流式生成逻辑
  - 导入 `streamText` from 'ai'
  - 导入 catalog
  - 实现 POST handler
  - 从请求中获取 prompt
  - 使用 `catalog.prompt()` 生成 system prompt
  - 使用 `streamText` 生成 JSON spec
  - 返回流式响应

- [x] 4.3 配置 AI 模型
  - 使用环境变量配置模型（如 `ANTHROPIC_API_KEY`）
  - 支持配置不同的模型（Claude Haiku、GPT-4 等）
  - 添加错误处理

### 阶段 5: UI 渲染组件

- [x] 5.1 创建组件目录
  - 创建 `src/components/json-render/` 目录
  - 创建 `src/components/json-render/json-renderer.tsx` 文件

- [x] 5.2 实现基础渲染逻辑
  - 导入所有必需的 providers (StateProvider, VisibilityProvider, ActionProvider, ValidationProvider)
  - 导入 Renderer 和 useUIStream
  - 导入 registry
  - 实现基础组件结构

- [x] 5.3 实现流式数据处理
  - 使用 `useUIStream` hook
  - 配置 API 端点
  - 处理流式数据更新
  - 显示加载状态

- [x] 5.4 实现 Action Handlers
  - 实现 `submit` handler（表单提交）
  - 实现 `navigate` handler（页面导航）
  - 实现 `showToast` handler（显示提示，使用 sonner）
  - 添加错误处理

- [x] 5.5 实现状态管理
  - 初始化 StateProvider 的 initialState
  - 支持数据绑定（$state 路径）
  - 支持条件可见性

### 阶段 6: 示例页面

- [x] 6.1 创建页面目录
  - 创建 `src/app/[locale]/dashboard/generative-ui/` 目录
  - 创建 `src/app/[locale]/dashboard/generative-ui/page.tsx` 文件

- [x] 6.2 实现页面布局
  - 使用 DashboardLayout（如果存在）
  - 添加页面标题和描述
  - 添加输入区域（Textarea 或 Input）
  - 添加生成按钮
  - 添加渲染区域

- [x] 6.3 集成 JsonRenderer 组件
  - 导入 JsonRenderer
  - 实现 prompt 输入和发送逻辑
  - 处理生成状态（loading、error）
  - 显示生成的 UI

- [x] 6.4 添加示例提示
  - 提供一些示例 prompt（如 "创建一个登录表单"、"显示一个数据仪表板"）
  - 帮助用户快速开始

### 阶段 7: 国际化支持

- [x] 7.1 创建翻译文件
  - 创建 `src/messages/zh/json-render.json`
  - 创建 `src/messages/en/json-render.json`
  - 添加所有用户可见文本的翻译

- [x] 7.2 更新消息加载器
  - 修改 `src/i18n/messages.ts`
  - 添加 json-render 命名空间
  - 确保在 fallback 中也包含

- [x] 7.3 在组件中使用翻译
  - 在 JsonRenderer 组件中使用 `useTranslations`
  - 在示例页面中使用翻译
  - 确保所有用户可见文本都支持国际化

### 阶段 8: 导航集成（可选）

- [x] 8.1 添加导航项
  - 修改 `src/config/nav-config.ts`
  - 添加 "Generative UI" 导航项
  - 配置图标、URL、权限等
  - 添加翻译键

- [x] 8.2 更新导航翻译
  - 在 `src/messages/{locale}/nav.json` 中添加翻译

### 阶段 8.1: 客户端渲染实现（新增）

- [x] 8.1.1 创建客户端渲染组件
  - 创建 `src/components/json-render/json-renderer-client.tsx`
  - 直接在客户端调用 AI SDK，不使用服务端 API
  - 使用 `createSpecStreamCompiler` 处理流式响应
  - 支持请求取消（AbortController）

- [x] 8.1.2 创建服务器端 Catalog
  - 创建 `src/lib/json-render/catalog-server.ts`
  - 使用 `@json-render/core` 的 `defineSchema` 重新定义 schema
  - 避免在服务器端导入 React 代码
  - 解决 `createContext is not a function` 错误

- [x] 8.1.3 更新 API 路由
  - 修改 `src/app/api/generate-ui/route.ts`
  - 使用 `catalog-server.ts` 而不是 `catalog.ts`
  - 保持向后兼容（可选使用）

- [x] 8.1.4 更新示例页面
  - 修改 `src/app/[locale]/dashboard/generative-ui/page.tsx`
  - 使用 `JsonRendererClient` 替代 `JsonRenderer`
  - 移除 API 路由依赖

- [x] 8.1.5 更新环境变量配置
  - 更新 `env.example.txt`
  - 添加 `NEXT_PUBLIC_` 前缀的客户端环境变量
  - 保留服务端环境变量（作为可选后备方案）

### 阶段 9: 错误处理和边界情况

- [x] 9.1 实现错误处理
  - 处理 API 请求失败
  - 处理无效的 JSON spec
  - 处理组件渲染错误
  - 显示友好的错误消息

- [x] 9.2 实现边界情况处理
  - 处理空 prompt
  - 处理生成中断
  - 处理网络错误
  - 处理超时

- [x] 9.3 添加错误边界组件
  - 创建 `src/components/json-render/error-boundary.tsx`
  - 捕获渲染错误
  - 显示错误信息

### 阶段 10: 测试和验证

- [ ] 10.1 功能测试
  - 测试基础组件渲染（Card、Button、Input 等）
  - 测试流式渲染
  - 测试数据绑定
  - 测试条件可见性
  - 测试 action handlers

- [ ] 10.2 交互测试
  - 测试按钮点击
  - 测试表单提交
  - 测试导航
  - 测试 Toast 提示

- [ ] 10.3 边界情况测试
  - 测试空 prompt
  - 测试无效 JSON
  - 测试网络错误
  - 测试超时

- [ ] 10.4 国际化测试
  - 测试中英文切换
  - 验证所有文本都正确翻译

- [ ] 10.5 响应式测试
  - 测试不同屏幕尺寸
  - 测试移动端显示

- [ ] 10.6 性能测试
  - 测试大量组件渲染性能
  - 测试流式渲染性能
  - 优化渲染性能（如需要）

### 阶段 11: 代码质量和文档

- [ ] 11.1 代码审查
  - 检查代码风格一致性
  - 检查 TypeScript 类型安全
  - 检查错误处理完整性
  - 检查性能优化

- [ ] 11.2 添加代码注释
  - 为关键函数添加 JSDoc 注释
  - 为复杂逻辑添加注释
  - 为组件添加使用说明

- [ ] 11.3 更新文档
  - 更新 README（如需要）
  - 创建使用文档（如需要）
  - 更新开发指南（如需要）

## 实施顺序

1. **阶段 1** → 安装依赖，准备环境
2. **阶段 2** → 定义 Catalog
3. **阶段 3** → 创建 Registry
4. **阶段 4** → 实现 API 路由
5. **阶段 5** → 创建 UI 渲染组件
6. **阶段 6** → 创建示例页面
7. **阶段 7** → 添加国际化支持
8. **阶段 8** → 集成导航（可选）
9. **阶段 9** → 错误处理和边界情况
10. **阶段 10** → 测试和验证
11. **阶段 11** → 代码质量和文档

## 注意事项

- **TDD 方法**：对于关键功能，先写测试，再实现功能
- **类型安全**：确保所有代码都通过 TypeScript 类型检查
- **SSR 兼容性**：确保组件在 SSR 环境下正常工作
- **性能优化**：注意流式渲染的性能，必要时进行优化
- **安全性**：确保 action handlers 不会执行危险操作
- **国际化**：所有用户可见文本都必须支持国际化
- **代码风格**：遵循项目现有的代码风格和约定
- **错误处理**：完善的错误处理机制，提供友好的错误消息

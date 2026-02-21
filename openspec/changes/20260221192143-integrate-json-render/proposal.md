# 变更提案：集成 json-render 框架

**变更 ID**: `20260221192143-integrate-json-render`  
**创建时间**: 2026-02-21  
**状态**: ✅ 已完成（待测试）

## 变更概述

集成 json-render 框架（@json-render/core、@json-render/react、@json-render/shadcn）到项目中，实现基于 JSON 规范的 AI 生成 UI 渲染能力，支持流式渲染、数据绑定、行为事件处理和条件可见性。

## 为什么

### 问题背景

1. **AI 生成 UI 需求**：需要支持 AI 根据用户输入动态生成界面，而不是固定的 UI 模板
2. **安全渲染需求**：需要确保 AI 生成的 UI 是安全、可预测的，不能执行任意代码
3. **组件复用需求**：需要复用现有的 shadcn/ui 组件库，而不是重新实现
4. **流式渲染需求**：需要支持 AI 流式生成 UI，实时更新界面
5. **事件处理需求**：需要支持 AI 生成的 UI 中的交互行为（按钮点击、表单提交等）

### 解决方案

通过集成 json-render 框架，实现：
- **Catalog 定义**：定义 AI 可以使用的组件和操作，约束 AI 输出
- **Registry 映射**：将 catalog 中的组件类型映射到实际的 shadcn/ui 组件
- **流式渲染**：支持 AI 流式生成 JSON spec，实时渲染 UI
- **数据绑定**：支持 `$state` 路径绑定，实现动态数据更新
- **行为事件**：支持 action handlers，处理用户交互
- **条件可见性**：支持基于状态的元素显示/隐藏

## 变更原因

1. **技术先进性**：json-render 是专门为 Generative UI 设计的框架，提供完整的解决方案
2. **安全性**：通过 catalog 约束 AI 输出，确保只使用预定义的组件和操作
3. **开发效率**：复用现有 shadcn/ui 组件，无需重新实现
4. **用户体验**：支持流式渲染，提供实时反馈
5. **可扩展性**：易于扩展新的组件和操作

## 变更内容

### 1. 安装依赖包

- **包名**: `@json-render/core`、`@json-render/react`、`@json-render/shadcn`、`ai`（Vercel AI SDK）、`ollama-ai-provider-v2`（Ollama 提供者）
- **版本**: 最新稳定版
- **Peer Dependencies**: `react ^19.0.0`、`zod ^4.0.0`

### 2. 创建 Catalog 定义

- **位置**: `src/lib/json-render/catalog.ts`
- **功能**:
  - 定义 AI 可以使用的组件（基于 shadcn/ui）
  - 定义 AI 可以触发的操作（actions）
  - 使用 Zod schema 定义组件 props 和 action params
  - 提供组件描述，帮助 AI 理解组件用途

### 3. 创建 Registry 映射

- **位置**: `src/lib/json-render/registry.tsx`
- **功能**:
  - 将 catalog 中的组件类型映射到实际的 shadcn/ui 组件
  - 处理组件的 props、children、emit 事件
  - 确保类型安全

### 4. 创建 API 路由（可选，用于服务端渲染）

- **位置**: `src/app/api/generate-ui/route.ts`
- **功能**:
  - 接收用户 prompt
  - 使用 Vercel AI SDK 的 `streamText` 生成 JSON spec
  - 使用 Ollama 提供者（`ollama-ai-provider-v2`）连接本地或云端 Ollama 服务
  - 默认模型：`glm-5:cloud`
  - 使用服务器端 catalog（`catalog-server.ts`）生成 system prompt，避免导入 React 代码
  - 返回流式响应
- **配置**:
  - `OLLAMA_BASE_URL`: Ollama API 基础 URL（默认：`http://localhost:11434/api`）
  - `OLLAMA_MODEL`: 模型名称（默认：`glm-5:cloud`）
  - `OLLAMA_API_KEY`: API 密钥（可选，用于云端服务）
- **注意**: 此 API 路由为可选，项目默认使用客户端直接渲染（`JsonRendererClient`）

### 客户端渲染配置

- **环境变量**（需要 `NEXT_PUBLIC_` 前缀）:
  - `NEXT_PUBLIC_OLLAMA_BASE_URL`: Ollama API 基础 URL（默认：`http://localhost:11434/api`）
  - `NEXT_PUBLIC_OLLAMA_MODEL`: 模型名称（默认：`glm-5:cloud`）
  - `NEXT_PUBLIC_OLLAMA_API_KEY`: API 密钥（可选，用于云端服务，**注意：会暴露到客户端**）
- **CORS 配置**: 如果 Ollama 运行在 `localhost`，确保浏览器可以访问（通常本地开发没问题）

### 4.1 创建服务器端 Catalog（用于 API 路由）

- **位置**: `src/lib/json-render/catalog-server.ts`
- **功能**:
  - 使用 `@json-render/core` 的 `defineSchema` 重新定义 schema，不依赖 React
  - 避免在服务器端 API 路由中导入 `@json-render/react` 的 schema（包含 React Context）
  - 与客户端 catalog 保持相同的组件和操作定义
  - 解决服务器端模块评估时的 `createContext is not a function` 错误

### 5. 创建 UI 渲染组件

#### 5.1 服务端 API 版本（可选）

- **位置**: `src/components/json-render/json-renderer.tsx`
- **功能**:
  - 使用 `Renderer` 组件渲染 JSON spec
  - 集成 `StateProvider`、`VisibilityProvider`、`ActionProvider`、`ValidationProvider`
  - 使用 `useUIStream` hook 处理流式数据（通过 API 路由）
  - 支持加载状态和错误处理

#### 5.2 客户端直接渲染版本（推荐）

- **位置**: `src/components/json-render/json-renderer-client.tsx`
- **功能**:
  - **完全客户端渲染**：直接在客户端调用 AI SDK，无需服务端 API
  - 使用 `createSpecStreamCompiler` 处理流式 JSONL 响应
  - 支持实时 UI 更新（渐进式渲染）
  - 支持请求取消（AbortController）
  - 使用 `NEXT_PUBLIC_` 前缀的环境变量配置 Ollama
  - 集成所有必要的 Providers（State、Visibility、Action、Validation）
- **优势**:
  - 减少服务器负载
  - 更快的响应速度（直接连接 Ollama）
  - 支持本地 Ollama 服务
  - 更好的用户体验（实时更新）

### 6. 创建示例页面

- **位置**: `src/app/[locale]/dashboard/generative-ui/page.tsx`
- **功能**:
  - 提供输入框让用户输入 prompt
  - 显示生成的 UI
  - 处理用户交互（按钮点击、表单提交等）

### 7. 添加国际化支持

- **位置**: `src/messages/{locale}/json-render.json`
- **功能**:
  - 提供 json-render 相关的翻译文本
  - 包括提示文本、错误消息、操作标签等

### 8. 添加导航项（可选）

- **位置**: `src/config/nav-config.ts`
- **功能**:
  - 添加 "Generative UI" 导航项
  - 链接到示例页面

## 技术实现

### Catalog 定义示例

```typescript
import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog';
import { z } from 'zod';

export const catalog = defineCatalog(schema, {
  components: {
    Card: shadcnComponentDefinitions.Card,
    Stack: shadcnComponentDefinitions.Stack,
    Heading: shadcnComponentDefinitions.Heading,
    Button: shadcnComponentDefinitions.Button,
    Input: shadcnComponentDefinitions.Input,
    Text: shadcnComponentDefinitions.Text,
    // ... 更多组件
  },
  actions: {
    submit: {
      params: z.object({ formId: z.string() }),
      description: "提交表单",
    },
    navigate: {
      params: z.object({ url: z.string() }),
      description: "导航到指定 URL",
    },
    showToast: {
      params: z.object({ message: z.string(), type: z.enum(['success', 'error', 'info']).optional() }),
      description: "显示提示消息",
    },
  },
});
```

### Registry 映射示例

```typescript
import { defineRegistry } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';
import { catalog } from './catalog';

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Button: shadcnComponents.Button,
    Input: shadcnComponents.Input,
    Text: shadcnComponents.Text,
    // ... 更多组件映射
  },
});
```

### API 路由示例

```typescript
import { streamText } from 'ai';
import { catalog } from '@/lib/json-render/catalog';
import { createOllama } from 'ollama-ai-provider-v2';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  
  const systemPrompt = catalog.prompt();
  
  // 配置 Ollama 提供者
  const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/api';
  const ollama = createOllama({ baseURL });
  
  // 使用默认模型 glm-5:cloud
  const model = ollama(process.env.OLLAMA_MODEL || 'glm-5:cloud');
  
  const result = streamText({
    model,
    system: systemPrompt,
    prompt,
  });
  
  return result.toTextStreamResponse();
}
```

### UI 渲染组件示例

```typescript
'use client';

import { Renderer, StateProvider, VisibilityProvider, ActionProvider, ValidationProvider, useUIStream } from '@json-render/react';
import { registry } from '@/lib/json-render/registry';

export function JsonRenderer() {
  const { spec, isStreaming, send } = useUIStream({
    api: '/api/generate-ui',
  });
  
  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider handlers={{
          submit: (params) => console.log('Submit:', params),
          navigate: (params) => window.location.href = params.url,
          showToast: (params) => toast(params.message),
        }}>
          <ValidationProvider customFunctions={{}}>
            <Renderer spec={spec} registry={registry} loading={isStreaming} />
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}
```

## 影响范围

### 修改的文件

1. `package.json` - 添加 json-render 相关依赖
2. `src/config/nav-config.ts` - 添加 Generative UI 导航项（可选）
3. `src/i18n/messages.ts` - 添加 json-render 消息命名空间

### 新增的文件

1. `src/lib/json-render/catalog.ts` - Catalog 定义（客户端使用）
2. `src/lib/json-render/catalog-server.ts` - 服务器端 Catalog 定义（API 路由使用，不依赖 React）
3. `src/lib/json-render/registry.tsx` - Registry 映射
4. `src/app/api/generate-ui/route.ts` - API 路由（可选，用于服务端渲染）
5. `src/components/json-render/json-renderer.tsx` - UI 渲染组件（服务端 API 版本，可选）
6. `src/components/json-render/json-renderer-client.tsx` - UI 渲染组件（客户端直接渲染版本，推荐）
7. `src/components/json-render/error-boundary.tsx` - 错误边界组件
8. `src/app/[locale]/dashboard/generative-ui/page.tsx` - 示例页面
9. `src/messages/zh/json-render.json` - 中文翻译
10. `src/messages/en/json-render.json` - 英文翻译

### 依赖关系

- 依赖现有的 shadcn/ui 组件库
- 依赖 Vercel AI SDK（需要安装 `ai` 包）
- 依赖现有的国际化系统（next-intl）
- 依赖现有的主题系统（可选，用于样式一致性）

## 验收标准

1. ✅ 成功安装所有必需的依赖包（@json-render/core、@json-render/react、@json-render/shadcn、ai、ollama-ai-provider-v2）
2. ✅ Catalog 定义包含至少 10 个常用 shadcn/ui 组件
3. ✅ Catalog 定义包含至少 3 个常用操作（submit、navigate、showToast）
4. ✅ Registry 正确映射所有 catalog 中定义的组件
5. ✅ 服务器端 Catalog（catalog-server.ts）正确实现，不依赖 React
6. ✅ API 路由能够接收 prompt 并返回流式 JSON spec（可选）
7. ✅ **客户端渲染组件（JsonRendererClient）能够直接在客户端调用 AI，无需服务端 API**
8. ✅ **客户端渲染支持流式响应处理，使用 `createSpecStreamCompiler` 解析 JSONL**
9. ✅ **客户端渲染支持请求取消（AbortController）**
10. ✅ UI 渲染组件能够正确渲染 JSON spec
11. ✅ 支持流式渲染，UI 能够实时更新
12. ✅ 支持数据绑定（$state 路径）
13. ✅ 支持条件可见性（visibility conditions）
14. ✅ 支持行为事件处理（action handlers）
15. ✅ 示例页面能够正常工作，用户可以输入 prompt 并看到生成的 UI
16. ✅ 生成的 UI 中的按钮点击、表单提交等交互能够正确触发 action handlers
17. ✅ 错误处理：当 AI 生成无效 JSON 时，能够优雅地处理错误
18. ✅ 错误边界组件能够捕获渲染错误
19. ✅ 国际化支持：所有用户可见文本都支持中英文切换
20. ✅ 导航集成：Generative UI 页面已添加到导航菜单
21. ✅ 类型安全：所有代码都通过 TypeScript 类型检查
22. ✅ 代码风格：遵循项目现有的代码风格和约定

## 风险与注意事项

1. **AI 模型选择**：使用 Ollama 提供者，默认模型为 `glm-5:cloud`。可以配置为本地或云端 Ollama 服务
2. **客户端渲染 vs 服务端渲染**：
   - **客户端渲染（推荐）**：减少服务器负载，更快的响应速度，但需要确保 Ollama 服务可访问
   - **服务端渲染（可选）**：可以隐藏 API 密钥，但增加服务器负载
   - 项目默认使用客户端渲染（`JsonRendererClient`）
3. **CORS 配置**：如果 Ollama 运行在 `localhost`，确保浏览器可以访问（通常本地开发没问题）
4. **API 密钥安全**：`NEXT_PUBLIC_OLLAMA_API_KEY` 会暴露到客户端，仅用于需要认证的云端服务
5. **服务器端 Catalog**：必须使用 `catalog-server.ts` 在 API 路由中，避免导入 React 代码导致的 `createContext is not a function` 错误
6. **流式渲染性能**：大量组件时，流式渲染可能影响性能，需要优化
7. **错误处理**：AI 可能生成无效的 JSON spec，需要完善的错误处理机制
8. **安全性**：确保 action handlers 不会执行危险操作（如 eval、XSS 等）
9. **类型安全**：Catalog 和 Registry 的类型定义需要保持同步
10. **国际化**：确保所有用户可见文本都支持国际化
11. **主题一致性**：生成的 UI 需要与项目主题保持一致
12. **浏览器兼容性**：确保流式渲染在所有目标浏览器中正常工作
13. **SSR 兼容性**：客户端渲染组件使用 `'use client'` 指令，确保在客户端运行
14. **依赖版本**：确保 json-render 的版本与 React 19 和 Zod 4 兼容
15. **Ollama 配置**：确保 Ollama 服务正在运行（本地）或正确配置云端服务 URL 和 API 密钥

## 后续扩展

未来可以扩展的功能：
- 支持更多 shadcn/ui 组件
- 支持自定义组件（非 shadcn/ui）
- 支持更复杂的数据绑定（数组、对象嵌套）
- 支持表单验证
- 支持文件上传
- 支持图表组件（集成 Recharts）
- 支持数据表格（集成 TanStack Table）
- 支持拖拽排序（集成 dnd-kit）
- 支持保存和加载生成的 UI
- 支持 UI 编辑模式（可视化编辑器）

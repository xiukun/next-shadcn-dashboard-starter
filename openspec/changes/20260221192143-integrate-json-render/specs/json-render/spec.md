# json-render 集成规范

## 目的

定义 json-render 框架集成规范，实现基于 JSON 规范的 AI 生成 UI 渲染能力，支持流式渲染、数据绑定、行为事件处理和条件可见性。

## 新增需求

### 需求：Catalog 定义

系统**必须**提供 Catalog 定义，**必须**声明 AI 可以使用的组件和操作，**必须**使用 Zod schema 定义类型约束。

#### 场景：定义组件 Catalog

- **当** 系统需要定义 AI 可用的组件时
- **那么** 使用 `defineCatalog` 函数创建 catalog
- **并且** 从 `@json-render/shadcn/catalog` 导入预定义的组件定义
- **并且** 至少包含以下组件：
  - Card（卡片容器）
  - Stack（布局容器）
  - Heading（标题）
  - Button（按钮）
  - Input（输入框）
  - Text（文本）
  - Form（表单）
  - Label（标签）
  - Select（选择器）
  - Checkbox（复选框）
  - RadioGroup（单选组）
  - Dialog（对话框）
  - Sheet（侧边栏）
  - Alert（警告）
- **并且** 每个组件包含 props schema 和描述

#### 场景：定义操作 Catalog

- **当** 系统需要定义 AI 可触发的操作时
- **那么** 在 catalog 中定义 actions
- **并且** 至少包含以下操作：
  - `submit`：提交表单（参数：formId）
  - `navigate`：导航到指定 URL（参数：url）
  - `showToast`：显示提示消息（参数：message, type）
- **并且** 每个操作包含 params schema 和描述

#### 场景：生成 System Prompt

- **当** AI 需要生成 UI 时
- **那么** 使用 `catalog.prompt()` 生成 system prompt
- **并且** system prompt 包含所有可用组件和操作的描述
- **并且** system prompt 指导 AI 生成符合 catalog 约束的 JSON spec

### 需求：Registry 映射

系统**必须**提供 Registry 映射，**必须**将 catalog 中的组件类型映射到实际的 shadcn/ui 组件实现。

#### 场景：映射组件到实现

- **当** 系统需要渲染 catalog 中定义的组件时
- **那么** 使用 `defineRegistry` 函数创建 registry
- **并且** 从 `@json-render/shadcn` 导入预定义的组件实现
- **并且** 将 catalog 中的每个组件类型映射到对应的 shadcn/ui 组件
- **并且** 确保组件 props 类型匹配
- **并且** 处理组件的 children 和 emit 事件

#### 场景：处理组件渲染

- **当** Renderer 需要渲染组件时
- **那么** 从 registry 中获取对应的组件实现
- **并且** 传递正确的 props
- **并且** 渲染 children（如果有）
- **并且** 处理 emit 事件（如果有）

### 需求：API 路由

系统**必须**提供 API 路由，**必须**接收用户 prompt，**必须**返回流式 JSON spec。

#### 场景：接收用户 Prompt

- **当** 用户提交 prompt 时
- **那么** API 路由接收 POST 请求
- **并且** 从请求 body 中提取 prompt
- **并且** 验证 prompt 不为空

#### 场景：生成 JSON Spec

- **当** API 路由收到 prompt 时
- **那么** 使用 `catalog.prompt()` 生成 system prompt
- **并且** 使用 Vercel AI SDK 的 `streamText` 函数
- **并且** 配置 AI 模型（如 Claude Haiku）
- **并且** 流式生成 JSON spec
- **并且** 返回流式响应

#### 场景：错误处理

- **当** API 请求失败时
- **那么** 返回适当的错误响应
- **并且** 记录错误日志
- **当** AI 生成失败时
- **那么** 返回错误响应
- **并且** 提供友好的错误消息

### 需求：UI 渲染组件

系统**必须**提供 UI 渲染组件，**必须**支持流式渲染，**必须**支持数据绑定和条件可见性，**必须**支持行为事件处理。

#### 场景：渲染 JSON Spec

- **当** 系统收到 JSON spec 时
- **那么** 使用 `Renderer` 组件渲染 spec
- **并且** 使用 registry 映射组件
- **并且** 正确渲染组件的 props 和 children
- **并且** 支持嵌套组件结构

#### 场景：流式渲染

- **当** AI 流式生成 JSON spec 时
- **那么** 使用 `useUIStream` hook 处理流式数据
- **并且** 实时更新 UI
- **并且** 显示加载状态
- **并且** 处理流式数据中的 JSONL 补丁

#### 场景：数据绑定

- **当** JSON spec 中包含 `$state` 路径时
- **那么** 使用 `StateProvider` 管理状态
- **并且** 从状态中获取数据并绑定到组件 props
- **并且** 支持双向数据绑定（如 Input 组件）
- **并且** 支持数组数据绑定（如列表渲染）

#### 场景：条件可见性

- **当** JSON spec 中包含 visibility 条件时
- **那么** 使用 `VisibilityProvider` 管理可见性
- **并且** 根据条件显示或隐藏元素
- **并且** 支持基于状态的动态可见性

#### 场景：行为事件处理

- **当** 用户与生成的 UI 交互时（如点击按钮）
- **那么** 触发对应的 action handler
- **并且** 执行相应的操作（如提交表单、导航、显示提示）
- **并且** 处理操作结果和错误

### 需求：示例页面

系统**必须**提供示例页面，**必须**允许用户输入 prompt，**必须**显示生成的 UI。

#### 场景：显示输入界面

- **当** 用户访问示例页面时
- **那么** 显示 prompt 输入框
- **并且** 显示生成按钮
- **并且** 显示示例 prompt 提示（可选）
- **并且** 显示渲染区域

#### 场景：处理用户输入

- **当** 用户输入 prompt 并点击生成按钮时
- **那么** 发送 prompt 到 API 路由
- **并且** 显示加载状态
- **并且** 开始流式渲染生成的 UI
- **并且** 处理错误情况

#### 场景：显示生成的 UI

- **当** AI 生成 UI 时
- **那么** 在渲染区域显示生成的 UI
- **并且** 支持用户与生成的 UI 交互
- **并且** 处理交互事件（按钮点击、表单提交等）

### 需求：国际化支持

系统**必须**支持国际化，**必须**提供中英文翻译，**必须**所有用户可见文本都支持国际化。

#### 场景：翻译文件

- **当** 系统需要显示文本时
- **那么** 从翻译文件中加载文本
- **并且** 支持 `zh` 和 `en` 两种语言
- **并且** 翻译文件位于 `src/messages/{locale}/json-render.json`

#### 场景：使用翻译

- **当** 组件需要显示文本时
- **那么** 使用 `useTranslations` hook
- **并且** 从 `json-render` 命名空间获取翻译
- **并且** 确保所有用户可见文本都使用翻译

## 实现约束

1. **依赖版本**：
   - `@json-render/core`、`@json-render/react`、`@json-render/shadcn`：最新稳定版
   - `react`：^19.0.0（已满足）
   - `zod`：^4.0.0（已满足）
   - `ai`：最新稳定版（Vercel AI SDK）

2. **类型安全**：所有代码必须通过 TypeScript 类型检查，使用严格的类型定义

3. **SSR 兼容性**：确保所有组件在 SSR 环境下正常工作，使用 `'use client'` 标记客户端组件

4. **错误处理**：完善的错误处理机制，提供友好的错误消息

5. **性能优化**：注意流式渲染的性能，必要时进行优化（如虚拟滚动）

6. **安全性**：确保 action handlers 不会执行危险操作（如 eval、XSS 等）

7. **国际化**：所有用户可见文本都必须支持国际化，使用 next-intl

8. **代码风格**：遵循项目现有的代码风格和约定

9. **主题一致性**：生成的 UI 需要与项目主题保持一致

10. **浏览器兼容性**：确保流式渲染在所有目标浏览器中正常工作

## 数据结构

### JSON Spec 结构

```typescript
interface JsonSpec {
  root: string; // 根元素 ID
  elements: Record<string, JsonElement>; // 元素映射
}

interface JsonElement {
  type: string; // 组件类型（如 "Card", "Button"）
  props: Record<string, any>; // 组件 props
  children?: string[]; // 子元素 ID 列表
  visibility?: VisibilityCondition; // 可见性条件（可选）
  data?: DataBinding; // 数据绑定（可选）
}
```

### Catalog 结构

```typescript
interface Catalog {
  components: Record<string, ComponentDefinition>;
  actions: Record<string, ActionDefinition>;
}

interface ComponentDefinition {
  props: z.ZodObject<any>;
  slots?: string[];
  description?: string;
}

interface ActionDefinition {
  params: z.ZodObject<any>;
  description?: string;
}
```

## 修改需求

### 需求：消息加载器扩展

系统**必须**修改消息加载器，**必须**添加 json-render 命名空间。

#### 场景：加载 json-render 翻译

- **当** 系统加载消息时
- **那么** 从 `src/messages/{locale}/json-render.json` 加载翻译
- **并且** 将翻译添加到返回的消息对象中
- **并且** 在 fallback 中也包含 json-render 命名空间

### 需求：导航配置扩展（可选）

系统**必须**修改导航配置，**必须**添加 Generative UI 导航项（可选）。

#### 场景：添加导航项

- **当** 系统需要显示导航时
- **那么** 在导航配置中添加 "Generative UI" 项
- **并且** 配置图标、URL、权限等
- **并且** 添加翻译键

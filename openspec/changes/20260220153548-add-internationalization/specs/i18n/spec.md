# 规范：国际化（i18n）支持

## 规范 ID

`i18n`

## 变更类型

新增规范

## 目的

定义项目中的国际化（i18n）实现标准，使用 next-intl 库在 Next.js App Router 中提供多语言支持。

## 新增需求

### 需求：next-intl 基础设施集成

系统**必须**集成 next-intl 库，**必须**在 Next.js App Router 中正确配置，**必须**支持动态路由段 `[locale]`。

#### 场景：语言配置

- **当** 应用启动时
- **那么** 加载语言配置（支持的语言列表、默认语言）
- **并且** 验证当前请求的语言是否在支持列表中
- **并且** 无效语言时回退到默认语言

#### 场景：中间件处理语言检测

- **当** 用户访问应用时
- **那么** 中间件检测用户的语言偏好（浏览器语言、Cookie、URL）
- **并且** 自动重定向到对应的语言路由（如 `/zh/dashboard` 或 `/en/dashboard`）
- **并且** 排除 API 路由和静态资源

#### 场景：加载翻译文件

- **当** 服务端组件渲染时
- **那么** 根据当前 locale 加载对应的翻译文件（`messages/{locale}.json`）
- **并且** 将翻译消息传递给客户端组件
- **并且** 支持按需加载，避免加载不必要的语言

### 需求：翻译文件管理

系统**必须**提供结构化的翻译文件，**必须**使用 JSON 格式，**必须**按命名空间组织。

#### 场景：翻译文件结构

- **当** 添加新翻译时
- **那么** 按功能模块组织到命名空间（如 `nav`、`common`、`auth`）
- **并且** 所有语言文件保持相同的结构
- **并且** 键名使用 camelCase 命名

#### 场景：翻译键类型安全

- **当** 在组件中使用翻译时
- **那么** TypeScript 自动推断翻译键的类型
- **并且** 无效的翻译键会触发类型错误
- **并且** IDE 提供自动补全

### 需求：组件中使用翻译

系统**必须**提供在服务端和客户端组件中使用翻译的标准方式，**必须**支持参数化翻译。

#### 场景：服务端组件使用翻译

- **当** 服务端组件需要显示文本时
- **那么** 使用 `useTranslations` hook 获取翻译函数
- **并且** 指定命名空间（如 `'nav'`）
- **并且** 使用翻译键获取对应语言的文本

#### 场景：客户端组件使用翻译

- **当** 客户端组件需要显示文本时
- **那么** 添加 `'use client'` 指令
- **并且** 使用 `useTranslations` hook
- **并且** 支持响应式语言切换（无需刷新页面）

#### 场景：参数化翻译

- **当** 翻译文本需要动态参数时
- **那么** 在翻译文件中使用占位符（如 `{name}`）
- **并且** 调用翻译函数时传入参数对象
- **并且** 参数类型安全

### 需求：语言切换功能

系统**必须**提供语言切换功能，**必须**保持当前页面路径，**必须**更新 URL。

#### 场景：切换语言

- **当** 用户选择新语言时
- **那么** 保持当前页面路径（如从 `/zh/dashboard/overview` 切换到 `/en/dashboard/overview`）
- **并且** 更新 URL 中的 locale 段
- **并且** 页面内容立即更新为新语言
- **并且** 不需要刷新页面（客户端切换）

#### 场景：语言切换器组件

- **当** 用户查看语言切换器时
- **那么** 显示当前选中的语言
- **并且** 显示所有支持的语言选项
- **并且** 提供友好的语言显示名称（如"中文"、"English"）

### 需求：URL 路由集成

系统**必须**将语言集成到 URL 路由中，**必须**使用 `[locale]` 动态路由段。

#### 场景：语言路由

- **当** 用户访问应用时
- **那么** URL 包含语言前缀（如 `/zh/dashboard` 或 `/en/dashboard`）
- **并且** 所有路由都在 `[locale]` 下
- **并且** 无效的 locale 返回 404

#### 场景：默认语言路由

- **当** 配置 `localePrefix: 'as-needed'` 时
- **那么** 默认语言（中文）可以不显示在 URL 中（如 `/dashboard`）
- **并且** 其他语言必须显示（如 `/en/dashboard`）

## 范围

本规范涵盖：

- 国际化基础设施配置
- 翻译文件结构和管理
- 组件中使用翻译的标准方式
- 语言切换功能实现
- URL 路由与语言集成

## 技术栈

- **库**: next-intl
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **支持语言**: 中文（zh）、英文（en），可扩展

## 目录结构

```
src/
├── i18n/
│   ├── config.ts          # 语言配置（支持的语言列表、默认语言）
│   ├── request.ts         # next-intl 请求配置
│   └── routing.ts         # 路由配置
├── messages/
│   ├── zh.json            # 中文翻译
│   └── en.json            # 英文翻译
└── app/
    ├── layout.tsx         # 根布局
    └── [locale]/          # Locale 动态路由段
        ├── layout.tsx     # Locale 布局（包装 NextIntlClientProvider）
        ├── page.tsx       # 根页面
        └── ...            # 其他路由
```

## 配置规范

### 语言配置 (`src/i18n/config.ts`)

```typescript
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';
```

**要求**：
- 使用 `as const` 确保类型安全
- 导出 `Locale` 类型供其他模块使用
- 默认语言为中文（zh）

### 路由配置 (`src/i18n/routing.ts`)

```typescript
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always' // 或 'as-needed'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
```

**要求**：
- 使用 `defineRouting` 定义路由配置
- 使用 `createNavigation` 创建类型安全的导航工具
- 支持 `localePrefix` 配置（always/as-needed）

### 请求配置 (`src/i18n/request.ts`)

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  
  // 验证 locale 是否有效
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
```

**要求**：
- 使用 `getRequestConfig` 配置请求处理
- 验证 locale 有效性，无效时回退到默认语言
- 动态导入对应的翻译文件

## 中间件规范

### 中间件实现 (`src/middleware.ts`)

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

**要求**：
- 使用 next-intl 提供的 `createMiddleware`
- 排除 API 路由、Next.js 内部路由和静态文件
- 处理语言检测和重定向

## 布局规范

### Locale 布局 (`src/app/[locale]/layout.tsx`)

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // 验证 locale
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  // 加载翻译消息
  const messages = await getMessages();
  
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

**要求**：
- 验证 locale 参数有效性，无效时调用 `notFound()`
- 使用 `getMessages()` 加载翻译消息
- 使用 `NextIntlClientProvider` 包装子组件
- 注意 Next.js 15+ 中 params 是 Promise

## 翻译文件规范

### 文件结构

翻译文件使用 JSON 格式，按功能模块组织：

```json
{
  "nav": {
    "dashboard": "仪表盘",
    "workspaces": "工作区"
  },
  "common": {
    "save": "保存",
    "cancel": "取消"
  }
}
```

**要求**：
- 使用命名空间组织翻译（如 `nav`、`common`、`auth` 等）
- 键名使用 camelCase
- 值使用目标语言的文本
- 保持所有语言文件的结构一致

### 命名空间约定

- `nav`: 导航相关
- `common`: 通用文本（按钮、标签等）
- `auth`: 认证相关
- `dashboard`: 仪表盘相关
- `profile`: 个人资料相关
- `errors`: 错误消息
- `validation`: 表单验证消息

## 组件使用规范

### 服务端组件

```typescript
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('nav');
  return <h1>{t('dashboard')}</h1>;
}
```

### 客户端组件

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('common');
  return <button>{t('save')}</button>;
}
```

### 带参数的翻译

```typescript
const t = useTranslations('common');
// messages/common.json: { "welcome": "欢迎, {name}!" }
<h1>{t('welcome', { name: 'John' })}</h1>
```

**要求**：
- 服务端组件直接使用 `useTranslations`
- 客户端组件需要 `'use client'` 指令
- 使用命名空间组织翻译
- 支持参数化翻译

## 语言切换规范

### 语言切换组件

```typescript
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLocale = (newLocale: string) => {
    // 替换 URL 中的 locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };
  
  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc === 'zh' ? '中文' : 'English'}
        </option>
      ))}
    </select>
  );
}
```

**要求**：
- 使用 `useLocale()` 获取当前语言
- 使用 `useRouter()` 和 `usePathname()` 进行导航
- 保持当前路径，只替换 locale 段
- 提供友好的语言显示名称

## URL 路由规范

### URL 格式

- 中文: `/zh/dashboard/overview`
- 英文: `/en/dashboard/overview`
- 默认语言（如果配置 `localePrefix: 'as-needed'`）: `/dashboard/overview`

### 路由规则

1. 所有路由必须在 `[locale]` 下
2. Locale 必须是配置中支持的语言之一
3. 无效的 locale 返回 404
4. 中间件自动处理语言检测和重定向

## 类型安全

### 翻译键类型

使用 next-intl 的类型推断，确保翻译键的类型安全：

```typescript
// TypeScript 会自动推断翻译键的类型
const t = useTranslations('nav');
t('dashboard'); // ✅ 类型安全
t('invalid');   // ❌ TypeScript 错误
```

**要求**：
- 充分利用 TypeScript 类型推断
- 翻译文件结构变更时，类型错误会提示需要更新的地方

## 最佳实践

1. **命名空间组织**：按功能模块组织翻译，避免单个文件过大
2. **键名规范**：使用描述性的 camelCase 键名
3. **渐进式迁移**：不需要一次性迁移所有文本，优先迁移用户可见的关键文本
4. **类型安全**：充分利用 TypeScript 类型检查
5. **性能优化**：翻译文件按需加载，避免加载不必要的语言
6. **测试覆盖**：确保语言切换和翻译显示正常工作

## 扩展性

### 添加新语言

1. 在 `src/i18n/config.ts` 中添加新语言到 `locales` 数组
2. 创建 `src/messages/{locale}.json` 文件
3. 复制现有语言文件结构，翻译所有文本
4. 更新路由配置（如需要）

### 添加新翻译命名空间

1. 在所有语言文件中添加新的命名空间
2. 保持结构一致
3. 在组件中使用新的命名空间

## 兼容性

- Next.js 16+ (App Router)
- TypeScript 5.7+
- React 19+

## 相关规范

- [布局规范](../layout/spec.md) - 布局组件规范
- [API 客户端规范](../api-client/spec.md) - API 请求规范（可能需要支持多语言错误消息）

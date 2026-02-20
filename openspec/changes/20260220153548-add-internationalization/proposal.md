# 变更提案：使用 next-intl 实现优雅的多语言支持

## Change ID

`20260220153548-add-internationalization`

## 问题描述

当前项目存在以下问题：

1. **硬编码文本**：组件中存在硬编码的中英文文本（如 `user-nav.tsx` 中的"退出登录"），无法支持多语言切换
2. **缺少国际化基础设施**：虽然已有 `[locale]` 目录结构，但未实际集成 next-intl
3. **用户体验受限**：无法根据用户偏好动态切换语言
4. **维护困难**：文本分散在各个组件中，难以统一管理和更新

## 目标

使用 next-intl 实现优雅、简洁的多语言支持：

1. **集成 next-intl**：在 Next.js App Router 中正确配置 next-intl
2. **支持中英文**：默认支持中文（zh）和英文（en），可扩展其他语言
3. **URL 路由集成**：使用 `[locale]` 动态路由段，URL 格式为 `/zh/dashboard` 或 `/en/dashboard`
4. **类型安全**：提供完整的 TypeScript 类型支持
5. **优雅迁移**：逐步将现有硬编码文本迁移到翻译文件
6. **服务端优先**：充分利用 Next.js 服务端渲染能力

## 影响范围

### 修改文件

- `src/app/layout.tsx` - 添加 next-intl 的 `NextIntlClientProvider`
- `src/app/[locale]/layout.tsx` - 创建 locale 布局，配置 next-intl
- `src/middleware.ts` - 创建中间件处理语言检测和重定向
- `next.config.ts` - 配置 next-intl 插件
- `package.json` - 添加 next-intl 依赖

### 新增文件

- `src/i18n/request.ts` - next-intl 配置和请求处理
- `src/i18n/config.ts` - 语言配置（支持的语言列表）
- `src/messages/zh.json` - 中文翻译文件
- `src/messages/en.json` - 英文翻译文件
- `src/app/[locale]/layout.tsx` - Locale 布局组件
- `src/app/[locale]/page.tsx` - 根页面（重定向到 dashboard）

### 迁移文件（逐步进行）

- `src/components/layout/user-nav.tsx` - 迁移硬编码文本
- `src/config/nav-config.ts` - 迁移导航配置文本
- `src/app/layout.tsx` - 迁移 metadata 文本
- 其他包含硬编码文本的组件

## 技术方案

### 1. 安装依赖

```bash
pnpm add next-intl
```

### 2. 项目结构

```
src/
├── i18n/
│   ├── request.ts      # next-intl 配置
│   └── config.ts       # 语言配置
├── messages/
│   ├── zh.json         # 中文翻译
│   └── en.json         # 英文翻译
└── app/
    ├── layout.tsx      # 根布局（包装 NextIntlClientProvider）
    └── [locale]/
        ├── layout.tsx  # Locale 布局
        ├── page.tsx    # 根页面
        └── dashboard/  # 现有路由
```

### 3. 核心实现

#### 3.1 语言配置 (`src/i18n/config.ts`)

```typescript
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';
```

#### 3.2 next-intl 配置 (`src/i18n/request.ts`)

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
```

#### 3.3 中间件 (`src/middleware.ts`)

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

#### 3.4 Locale 布局 (`src/app/[locale]/layout.tsx`)

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
  params: { locale: string };
}) {
  const { locale } = params;
  if (!locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

#### 3.5 根布局更新 (`src/app/layout.tsx`)

- 移除 `[locale]` 相关的逻辑（移到 `[locale]/layout.tsx`）
- 保持 Providers、ThemeProvider 等全局配置

### 4. 使用方式

#### 4.1 服务端组件

```typescript
import { useTranslations } from 'next-intl';

export default function Page() {
  const t = useTranslations('nav');
  return <h1>{t('dashboard')}</h1>;
}
```

#### 4.2 客户端组件

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('nav');
  return <button>{t('logout')}</button>;
}
```

#### 4.3 语言切换

```typescript
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };
  
  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="zh">中文</option>
      <option value="en">English</option>
    </select>
  );
}
```

### 5. 翻译文件结构

#### `src/messages/zh.json`

```json
{
  "nav": {
    "dashboard": "仪表盘",
    "workspaces": "工作区",
    "teams": "团队",
    "product": "产品",
    "kanban": "看板",
    "profile": "个人资料",
    "billing": "账单",
    "logout": "退出登录"
  },
  "common": {
    "settings": "设置",
    "newTeam": "新建团队"
  }
}
```

#### `src/messages/en.json`

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "workspaces": "Workspaces",
    "teams": "Teams",
    "product": "Product",
    "kanban": "Kanban",
    "profile": "Profile",
    "billing": "Billing",
    "logout": "Log out"
  },
  "common": {
    "settings": "Settings",
    "newTeam": "New Team"
  }
}
```

## 验收标准

1. ✅ next-intl 正确集成到 Next.js App Router
2. ✅ 支持中文（zh）和英文（en）两种语言
3. ✅ URL 路由正确：`/zh/dashboard` 和 `/en/dashboard` 都能正常工作
4. ✅ 语言切换功能正常工作
5. ✅ 服务端组件和客户端组件都能使用翻译
6. ✅ 类型安全：TypeScript 类型检查通过
7. ✅ 默认语言检测：根据浏览器语言或用户偏好自动选择
8. ✅ 至少迁移 3 个关键组件（user-nav、nav-config、layout metadata）
9. ✅ 构建通过：`pnpm build` 成功
10. ✅ 开发服务器正常：`pnpm dev` 无错误

## 风险与回滚

### 风险

1. **路由变更**：所有路由需要添加 `[locale]` 前缀，可能影响现有链接
2. **构建配置**：next.config.ts 修改可能影响现有构建流程
3. **类型错误**：迁移过程中可能出现类型错误

### 回滚策略

1. 使用 git revert 回退到变更前
2. 保留 `[locale]` 目录结构但移除 next-intl 集成
3. 恢复硬编码文本

## 实施计划

1. 安装 next-intl 依赖
2. 创建 i18n 配置文件和翻译文件
3. 创建中间件处理语言检测
4. 创建 `[locale]` 布局组件
5. 更新根布局
6. 更新 next.config.ts
7. 迁移关键组件（user-nav、nav-config）
8. 添加语言切换组件
9. 测试和验证
10. 更新文档

## 后续优化（不在本次变更范围内）

1. 添加更多语言支持
2. 实现语言偏好持久化（localStorage）
3. 添加翻译缺失检测和警告
4. 实现翻译文件的动态加载
5. 添加翻译管理工具

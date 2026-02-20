# 变更提案：修复 Tabs、图表和 API 路由相关问题

## Change ID

`20260220232925-fix-tabs-chart-api-issues`

## 为什么

在实现多语言支持和 Dashboard Tabs 功能后，发现了以下问题：

1. **Tab 标题多语言显示问题**
   - 默认 Dashboard Tab 的标题硬编码为中文「仪表盘」，在英文环境下仍显示中文
   - 只有点击 Tab 后才会更新为对应语言的标题

2. **Tab 激活状态与路由不一致**
   - 路由变化时，Tab 的激活状态（activeTabId）没有及时同步
   - 导致 Header 中显示的激活 Tab 与实际 URL 不匹配

3. **图表容器尺寸警告**
   - Recharts 的 `ResponsiveContainer` 报错：`The width(0) and height(0) of chart should be greater than 0`
   - 容器在某些情况下（如 Keep-Alive 缓存）无法正确获取尺寸

4. **API 路由被 next-intl 中间件错误处理**
   - `/api/products` 等 API 路由返回 404
   - 原因是 next-intl 中间件也处理了 API 路由，导致路由被错误重写

## 变更内容

1. **修复 Tab 标题多语言显示**
   - 将 `DEFAULT_TAB.title` 改为英文「Dashboard」作为默认值
   - 确保 `useRouteTabs` 在 Tab 已存在时也能更新标题和图标

2. **修复 Tab 激活状态同步**
   - 在 `useRouteTabs` 中，确保路由变化时同步更新 `activeTabId`
   - 优化更新逻辑，避免无限循环

3. **修复图表容器尺寸问题**
   - 在 `ChartContainer` 中添加明确的 `width: '100%'` 和 `height: '100%'`
   - 为 `ResponsiveContainer` 添加明确的 `width` 和 `height` props

4. **修复 API 路由处理**
   - 在 `proxy.ts` 中间件中，跳过对 `/api` 和 `/trpc` 路由的 next-intl 处理
   - 确保 API 路由直接由 Next.js 处理

## 影响范围

- **代码修改**：
  - `src/stores/route-tabs-store.ts` - 修改默认 Tab 标题
  - `src/hooks/use-route-tabs.ts` - 优化 Tab 更新和激活逻辑
  - `src/components/ui/chart.tsx` - 修复图表容器尺寸
  - `src/proxy.ts` - 修复 API 路由处理

- **规范影响**：
  - 无需修改规范，这些是 bug 修复

## 技术方案

### 1. Tab 标题多语言修复

```typescript
// src/stores/route-tabs-store.ts
const DEFAULT_TAB: RouteTab = {
  id: '/dashboard/overview',
  title: 'Dashboard', // 默认英文，会在 useRouteTabs 中根据当前 locale 更新
  url: '/dashboard/overview',
  icon: 'dashboard',
  closable: false
};
```

### 2. Tab 激活状态同步

在 `useRouteTabs` 中，确保每次路由变化时：
- 检查当前路由对应的 Tab 是否存在
- 如果存在，确保 `activeTabId` 与当前 canonical path 一致
- 如果 Tab 内容有变化（标题/图标/URL），则更新

### 3. 图表容器尺寸修复

```typescript
// src/components/ui/chart.tsx
<div
  style={{
    minWidth: 0,
    minHeight: 0,
    width: '100%',
    height: '100%',
    ...props.style
  }}
>
  <ResponsiveContainer
    debounce={2000}
    width='100%'
    height='100%'
  >
    {children}
  </ResponsiveContainer>
</div>
```

### 4. API 路由处理修复

```typescript
// src/proxy.ts
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // 对 API / TRPC 路由跳过 next-intl，中间件仅用于页面路由
  if (!pathname.startsWith('/api') && !pathname.startsWith('/trpc')) {
    const intlResponse = intlMiddleware(req);
    if (intlResponse) {
      return intlResponse;
    }
  }

  if (isProtectedRoute(req)) await auth.protect();
});
```

## 验收标准

1. ✅ Tab 标题多语言显示正确
   - 英文环境下，Dashboard Tab 显示「Dashboard」
   - 中文环境下，Dashboard Tab 显示「仪表盘」
   - 切换语言时，Tab 标题自动更新

2. ✅ Tab 激活状态与路由一致
   - 访问 `/en/dashboard/overview` 时，Dashboard Tab 被激活
   - 访问 `/en/dashboard/product` 时，Product Tab 被激活
   - Header 中显示的激活 Tab 与实际 URL 匹配

3. ✅ 图表容器尺寸警告消失
   - 控制台不再出现 `The width(0) and height(0) of chart should be greater than 0` 警告
   - 图表正常渲染，尺寸正确

4. ✅ API 路由正常工作
   - `/api/products` 等 API 路由返回 200 状态码
   - 不再出现 404 错误
   - 不再出现 `body stream already read` 错误

5. ✅ TypeScript 类型检查通过
   - `npx tsc --noEmit` 无错误

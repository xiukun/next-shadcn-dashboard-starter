# Keep-Alive（页面缓存）使用文档

本文档说明 Dashboard 标签页（Tabs）体系下的 **Keep-Alive 页面缓存**如何工作、如何启用/禁用，以及常见注意事项。

## 功能概览

启用 Keep-Alive 后，在 Dashboard 内切换标签页时，已访问页面的 **DOM 与组件状态会被保留**（例如滚动位置、表单输入、组件内部 state），避免反复卸载/重建带来的体验损失。

本项目采用 **React Portal + DOM 挂载/卸载** 的方式实现：

- 页面切换时：当前页面从可见容器中 detach（不销毁），新页面 attach 到可见容器
- 页面仍保持挂载：因此状态可持续保留

## 启用与禁用

### 在 UI 中启用

路径：**Header 右上角设置（齿轮） → 布局 → 标签栏**

1. 打开「**启用标签栏**」
2. 打开「**启用页面缓存**」

> 说明：当「启用标签栏」关闭时，「启用页面缓存」开关会被禁用。

### 在 UI 中禁用

同一路径关闭「**启用页面缓存**」即可。

禁用 Keep-Alive 后：

- 缓存会被清空
- 页面将回到默认行为（路由切换会重新渲染页面组件）

## Keep-Alive 的工作方式（关键规则）

### 1) 仅缓存 Dashboard 路由

只对以 `/dashboard` 开头的路由进行缓存，避免非后台页面被缓存污染。

### 2) 缓存 Key 使用 pathname（不包含 query）

Keep-Alive 的缓存 key 为 `pathname`（例如 `/dashboard/product`），**不包含 query 参数**。

因此：

- `/dashboard/product?page=1` 与 `/dashboard/product?page=2` **共用同一份缓存页面**
- 标签页（Tabs）自身会保存带 query 的 `url`，用于切回标签时 `router.push(tab.url)`，以尽量保持参数不丢失

### 3) 关闭标签页会清理对应缓存

当某个标签页从 tabs 列表中移除时，对应 `pathname` 的缓存会从内存中删除（释放占用）。

### 4) 刷新浏览器不会保留页面缓存

Keep-Alive 缓存存在于**内存**中，刷新页面后会丢失（但偏好设置与 tabs 列表会从 localStorage 恢复）。

## 常见问题（FAQ）

### Q1：为什么我切换标签页后页面状态还在？

这是 Keep-Alive 的预期行为：页面仍保持挂载，只是 DOM 从可见区域 detach，因此 state、滚动位置等都不会丢。

### Q2：为什么 query 参数变化没有“开新缓存”？

缓存 key 只使用 `pathname`。如果你希望不同 query 对应不同缓存，需要自行扩展策略（例如将 key 改为 `pathname + '?' + queryString`，并同步 tabs 清理逻辑）。

### Q3：Keep-Alive 会不会导致内存占用过高？

可能会。建议：

- 不需要缓存时关闭「启用页面缓存」
- 及时关闭不再使用的标签页（会触发缓存清理）
- 控制可关闭标签页数量（项目内置最多 8 个可关闭 tabs，上限触发时会移除最早的可关闭 tab）

### Q4：为什么“启用页面缓存”开关不可点？

当「启用标签栏」关闭时，该开关会被禁用。请先开启「启用标签栏」。

## 开发者说明（实现位置）

- Keep-Alive Provider：`src/components/layout/keep-alive-provider.tsx`
- 单路由 Keep-Alive：`src/components/layout/keep-alive-route.tsx`
- Dashboard 集成：`src/app/dashboard/layout.tsx`
- 偏好设置：`src/stores/user-preferences-store.ts`（`enableKeepAlive`）
- 设置面板：`src/components/layout/settings-panel.tsx`


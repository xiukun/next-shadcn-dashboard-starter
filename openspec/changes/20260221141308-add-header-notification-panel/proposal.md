# 变更提案：Header 静态通知功能

**变更 ID**: `20260221141308-add-header-notification-panel`  
**创建时间**: 2026-02-21  
**状态**: 已完成

## 变更概述

在 Header 组件中添加静态通知功能，包括通知图标按钮（带未读提示红点）和通知面板（Sheet 侧边栏），提供通知列表展示、清空和查看所有消息功能。

## 为什么

### 问题背景

1. **用户通知需求**：用户需要查看系统通知、消息提醒等信息
2. **通知入口缺失**：当前 Header 中没有通知功能的入口
3. **通知展示需求**：需要统一的通知面板展示通知列表

### 解决方案

通过在 Header 右侧添加通知图标按钮，点击后打开通知面板（Sheet 侧边栏），展示通知列表，支持查看、清空和查看所有消息功能。

## 变更原因

1. **用户体验提升**：提供统一的通知入口，方便用户查看系统通知
2. **功能完整性**：完善 Header 功能，提供通知管理能力
3. **界面一致性**：使用 Sheet 组件保持与设置面板一致的交互体验

## 变更内容

### 1. 新增通知面板组件

- **位置**: `src/components/layout/notification-panel.tsx`
- **功能**: 
  - 使用 Sheet 组件实现侧边栏通知面板
  - 显示通知列表（头像、标题、描述、时间戳、操作按钮）
  - 提供清空和查看所有消息按钮
  - 支持通知项的已读/未读状态

### 2. 新增通知数据 Store（可选）

- **位置**: `src/stores/notification-store.ts`（如果需要状态管理）
- **功能**:
  - 管理通知列表数据
  - 管理未读通知数量
  - 支持标记已读、删除通知等操作

### 3. 修改 Header 组件

- **文件**: `src/components/layout/header.tsx`
- **变更**:
  - 添加通知图标按钮（带未读提示红点）
  - 点击打开通知面板
  - 显示未读通知数量徽章

### 4. 扩展图标库

- **文件**: `src/components/icons.tsx`
- **变更**:
  - 添加通知图标（bell）到 Icons 对象

### 5. 添加通知静态数据

- **位置**: `src/constants/notifications.ts` 或 `src/constants/mock-api.ts`
- **功能**:
  - 定义静态通知数据
  - 包含头像、标题、描述、时间戳等信息

## 技术实现

### UI 组件

- 使用 shadcn/ui 的 `Sheet` 组件作为通知面板容器
- 使用 `Button` 组件实现通知图标按钮
- 使用 `Badge` 组件显示未读数量徽章
- 使用 `Avatar` 组件显示通知头像

### 数据结构

```typescript
interface Notification {
  id: string;
  avatar?: string;
  avatarText?: string; // 如 "VB"
  title: string;
  description: string;
  timestamp: string; // 如 "3小时前"、"刚刚"、"2024-01-01"
  isRead: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
}
```

### 布局逻辑

```typescript
// Header 中添加通知按钮
<Button variant='ghost' size='icon' onClick={() => setNotificationOpen(true)}>
  <Icons.bell className='h-4 w-4' />
  {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
</Button>

// 通知面板
<NotificationPanel open={notificationOpen} onOpenChange={setNotificationOpen} />
```

## 影响范围

### 修改的文件

1. `src/components/layout/header.tsx` - 添加通知按钮和面板集成
2. `src/components/icons.tsx` - 添加通知图标

### 新增的文件

1. `src/components/layout/notification-panel.tsx` - 通知面板主组件
2. `src/constants/notifications.ts` - 静态通知数据（或集成到 mock-api.ts）
3. `src/stores/notification-store.ts` - 通知状态管理（可选）

### 依赖关系

- 依赖现有的 `Sheet` 组件
- 依赖现有的 `Button`、`Badge`、`Avatar` 组件
- 使用 shadcn/ui 组件库

## 验收标准

1. ✅ Header 右侧显示通知图标按钮
2. ✅ 通知图标上显示未读数量徽章（当有未读通知时）
3. ✅ 点击通知图标打开通知面板（Sheet 从右侧滑出）
4. ✅ 通知面板显示通知列表，包含：
   - 通知头像（支持图片或文字头像）
   - 通知标题
   - 通知描述
   - 时间戳（相对时间或绝对时间）
   - 操作按钮（标记已读/删除）
5. ✅ 通知面板底部显示"清空"和"查看所有消息"按钮
6. ✅ 点击"清空"按钮清空所有通知
7. ✅ 点击"查看所有消息"按钮跳转到通知页面（如 `/dashboard/notifications`）
8. ✅ 通知数据使用静态数据（不需要后端）
9. ✅ 通知面板支持关闭（点击遮罩层或关闭按钮）
10. ✅ 未读通知数量正确显示和更新

## 风险与注意事项

1. **状态管理**：如果使用 Zustand store，注意 SSR 兼容性
2. **数据持久化**：静态通知数据不需要持久化，但需要考虑未来扩展
3. **性能**：通知列表较长时，考虑虚拟滚动优化
4. **可访问性**：确保通知面板支持键盘导航和屏幕阅读器
5. **响应式**：通知面板在不同屏幕尺寸下正常显示
6. **国际化**：时间戳格式化需要考虑多语言支持

## 后续扩展

未来可以扩展的功能：
- 实时通知推送（WebSocket）
- 通知分类和筛选
- 通知设置（免打扰时间等）
- 通知历史记录
- 通知已读/未读状态持久化

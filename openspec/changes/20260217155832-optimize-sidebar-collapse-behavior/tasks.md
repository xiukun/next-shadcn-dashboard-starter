# 实施任务清单

**变更 ID**: `20260217155832-optimize-sidebar-collapse-behavior`  
**创建时间**: 2026-02-17

## 任务状态说明

- ⏳ 待开始
- 🔄 进行中
- ✅ 已完成
- ❌ 已取消

---

## 阶段 1: 扩展用户偏好设置 Store

### 任务 1.1: 扩展 UserPreferences 接口
- **状态**: ✅ 已完成
- **文件**: `src/stores/user-preferences-store.ts`
- **描述**: 
  - 在 `UserPreferences` 接口中新增 `sidebarCollapseMode` 字段
  - 类型为 `'icon' | 'expanded-submenu'`
  - 默认值为 `'icon'`
- **验收标准**:
  - 接口定义正确
  - 默认值设置正确
  - TypeScript 类型检查通过

### 任务 1.2: 扩展 UserPreferencesStore 接口
- **状态**: ✅ 已完成
- **文件**: `src/stores/user-preferences-store.ts`
- **描述**: 
  - 在 `UserPreferencesStore` 接口中新增 `setSidebarCollapseMode` 方法
- **验收标准**:
  - 方法签名正确
  - TypeScript 类型检查通过

### 任务 1.3: 实现 setSidebarCollapseMode 方法
- **状态**: ✅ 已完成
- **文件**: `src/stores/user-preferences-store.ts`
- **描述**: 
  - 在 store 实现中添加 `setSidebarCollapseMode` 方法
  - 更新 `DEFAULT_PREFERENCES` 对象，添加 `sidebarCollapseMode: 'icon'`
- **验收标准**:
  - 方法实现正确
  - 状态更新正常
  - 持久化存储正常

---

## 阶段 2: 修改侧边栏组件以支持折叠模式

### 任务 2.1: 修改 SidebarMenuSub 组件
- **状态**: ⏳ 待开始
- **文件**: `src/components/ui/sidebar.tsx`
- **描述**: 
  - 修改 `SidebarMenuSub` 组件，使其能够根据折叠模式决定是否隐藏
  - 当前实现：`group-data-[collapsible=icon]:hidden` 始终隐藏
  - 新实现：需要根据 `sidebarCollapseMode` 条件判断
- **验收标准**:
  - 图标模式下，折叠时子菜单隐藏
  - 展开子项模式下，折叠时子菜单显示
  - 样式正确，无布局问题

### 任务 2.2: 修改 SidebarMenuSubButton 组件
- **状态**: ⏳ 待开始
- **文件**: `src/components/ui/sidebar.tsx`
- **描述**: 
  - 修改 `SidebarMenuSubButton` 组件，确保在展开子项模式下样式正确
  - 可能需要调整折叠状态下的样式类
- **验收标准**:
  - 展开子项模式下，子菜单按钮样式正确
  - 文字和图标对齐正确
  - 交互状态（hover、active）正常

---

## 阶段 3: 修改导航主组件应用设置

### 任务 3.1: 在 AppSidebar 中读取设置
- **状态**: ✅ 已完成
- **文件**: `src/components/layout/app-sidebar.tsx`
- **描述**: 
  - 使用 `useUserPreferencesStore` 读取 `sidebarCollapseMode` 设置
  - 将设置传递给子组件或用于条件渲染
- **验收标准**:
  - 能够正确读取设置值
  - 设置变化时组件能够响应更新

### 任务 3.2: 根据设置调整子菜单显示逻辑
- **状态**: ✅ 已完成
- **文件**: `src/components/layout/app-sidebar.tsx`
- **描述**: 
  - 根据 `sidebarCollapseMode` 的值，调整 `Collapsible` 和 `CollapsibleContent` 的行为
  - 在展开子项模式下，子菜单应该始终展开，不受 `defaultOpen` 限制
- **验收标准**:
  - 图标模式下行为与当前一致
  - 展开子项模式下，子菜单始终显示
  - 切换模式时，UI 立即更新

---

## 阶段 4: 扩展设置面板

### 任务 4.1: 在设置面板中添加折叠效果选择
- **状态**: ✅ 已完成
- **文件**: `src/components/layout/settings-panel.tsx`
- **描述**: 
  - 在"布局"标签页中新增"侧边栏折叠效果"设置区域
  - 使用 `RadioGroup` 组件提供两个选项：
    - "图标模式"（值：`'icon'`）
    - "展开子项模式"（值：`'expanded-submenu'`）
- **验收标准**:
  - UI 布局合理，符合现有设计风格
  - 选项标签清晰易懂
  - 默认选中"图标模式"

### 任务 4.2: 实现设置变更处理
- **状态**: ✅ 已完成
- **文件**: `src/components/layout/settings-panel.tsx`
- **描述**: 
  - 绑定 `RadioGroup` 的 `value` 和 `onValueChange` 事件
  - 调用 `setSidebarCollapseMode` 更新设置
- **验收标准**:
  - 选择选项后，设置立即更新
  - 侧边栏行为立即改变
  - 设置持久化存储

---

## 阶段 5: 测试与验证

### 任务 5.1: 功能测试
- **状态**: ⏳ 待开始
- **描述**: 
  - 测试图标模式下的行为（默认）
  - 测试展开子项模式下的行为
  - 测试模式切换的响应性
  - 测试设置持久化
- **验收标准**:
  - 所有功能按预期工作
  - 无控制台错误
  - 无视觉异常

### 任务 5.2: 响应式测试
- **状态**: ⏳ 待开始
- **描述**: 
  - 测试移动端和桌面端的表现
  - 测试不同屏幕尺寸下的布局
- **验收标准**:
  - 移动端和桌面端都能正常工作
  - 布局在不同尺寸下正常

### 任务 5.3: 浏览器兼容性测试
- **状态**: ⏳ 待开始
- **描述**: 
  - 测试主流浏览器（Chrome、Firefox、Safari、Edge）
- **验收标准**:
  - 所有浏览器中功能正常
  - 样式一致

---

## 阶段 6: 文档更新

### 任务 6.1: 更新代码注释
- **状态**: ⏳ 待开始
- **描述**: 
  - 为新添加的字段和方法添加 JSDoc 注释
  - 更新相关组件的注释说明
- **验收标准**:
  - 注释清晰完整
  - 符合项目注释规范

### 任务 6.2: 更新变更提案状态
- **状态**: ⏳ 待开始
- **文件**: `openspec/changes/20260217155832-optimize-sidebar-collapse-behavior/proposal.md`
- **描述**: 
  - 将所有任务标记为完成
  - 更新提案状态为"已完成"
- **验收标准**:
  - 所有任务状态正确
  - 提案状态更新

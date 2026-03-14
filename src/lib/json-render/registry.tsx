'use client';

import { defineRegistry } from '@json-render/react';
import { shadcnComponents } from '@json-render/shadcn';
import { catalog } from './catalog';

/**
 * json-render Registry 映射
 * 将 catalog 中的组件类型映射到实际的 shadcn/ui 组件实现
 */
export const { registry } = defineRegistry(catalog, {
  components: {
    // 布局组件
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,
    Separator: shadcnComponents.Separator,

    // 表单组件
    Button: shadcnComponents.Button,
    Input: shadcnComponents.Input,
    Textarea: shadcnComponents.Textarea,
    Select: shadcnComponents.Select,
    Checkbox: shadcnComponents.Checkbox,
    Switch: shadcnComponents.Switch,

    // 反馈组件
    Alert: shadcnComponents.Alert,
    Dialog: shadcnComponents.Dialog,
    Popover: shadcnComponents.Popover,
    Tooltip: shadcnComponents.Tooltip,

    // 数据展示组件
    Badge: shadcnComponents.Badge,
    Avatar: shadcnComponents.Avatar,
    Progress: shadcnComponents.Progress,
    Skeleton: shadcnComponents.Skeleton
  },
  actions: {
    // Actions are handled by ActionProvider in components
    submit: async () => {},
    navigate: async () => {},
    showToast: async () => {},
    openDialog: async () => {},
    closeDialog: async () => {}
  }
});

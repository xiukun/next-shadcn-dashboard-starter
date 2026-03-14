import { defineCatalog, defineSchema } from '@json-render/core';
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog';
import { z } from 'zod';

/**
 * 服务器端 Schema 定义
 * 使用 @json-render/core 的 defineSchema，不依赖 React
 * 这个 schema 与 @json-render/react 的 schema 兼容
 */
const serverSchema = defineSchema((s) => ({
  spec: s.object({
    root: s.string(),
    elements: s.record(
      s.object({
        type: s.ref('catalog.components'),
        props: s.propsOf('catalog.components'),
        children: s.array(s.string()),
        visible: s.any()
      })
    )
  }),
  catalog: s.object({
    components: s.map({
      props: s.zod(),
      slots: s.array(s.string()),
      description: s.string(),
      example: s.any()
    }),
    actions: s.map({
      params: s.zod(),
      description: s.string()
    })
  })
}));

/**
 * json-render Catalog 定义（服务器端版本）
 * 用于 API 路由，不包含 React 依赖
 * 定义 AI 可以使用的组件和操作
 */
export const catalog = defineCatalog(serverSchema, {
  components: {
    // 布局组件
    Card: {
      ...shadcnComponentDefinitions.Card,
      description: '卡片容器，用于组织和展示内容'
    },
    Stack: {
      ...shadcnComponentDefinitions.Stack,
      description: '垂直或水平布局容器，用于排列子元素'
    },
    Heading: {
      ...shadcnComponentDefinitions.Heading,
      description: '标题组件，用于显示不同级别的标题'
    },
    Text: {
      ...shadcnComponentDefinitions.Text,
      description: '文本组件，用于显示文本内容'
    },
    Separator: {
      ...shadcnComponentDefinitions.Separator,
      description: '分隔线组件，用于分隔内容区域'
    },

    // 表单组件
    Button: {
      ...shadcnComponentDefinitions.Button,
      description: '按钮组件，用于触发操作'
    },
    Input: {
      ...shadcnComponentDefinitions.Input,
      description: '输入框组件，用于接收用户文本输入'
    },
    Textarea: {
      ...shadcnComponentDefinitions.Textarea,
      description: '多行文本输入框组件'
    },
    Select: {
      ...shadcnComponentDefinitions.Select,
      description: '选择器组件，用于从选项列表中选择'
    },
    Checkbox: {
      ...shadcnComponentDefinitions.Checkbox,
      description: '复选框组件，用于多选'
    },
    Switch: {
      ...shadcnComponentDefinitions.Switch,
      description: '开关组件，用于切换状态'
    },

    // 反馈组件
    Alert: {
      ...shadcnComponentDefinitions.Alert,
      description: '警告提示组件，用于显示重要信息'
    },
    Dialog: {
      ...shadcnComponentDefinitions.Dialog,
      description: '对话框组件，用于显示模态内容'
    },
    Popover: {
      ...shadcnComponentDefinitions.Popover,
      description: '弹出框组件，用于显示浮动内容'
    },
    Tooltip: {
      ...shadcnComponentDefinitions.Tooltip,
      description: '工具提示组件，用于显示悬停提示'
    },

    // 数据展示组件
    Badge: {
      ...shadcnComponentDefinitions.Badge,
      description: '徽章组件，用于显示标签或状态'
    },
    Avatar: {
      ...shadcnComponentDefinitions.Avatar,
      description: '头像组件，用于显示用户头像'
    },
    Progress: {
      ...shadcnComponentDefinitions.Progress,
      description: '进度条组件，用于显示进度'
    },
    Skeleton: {
      ...shadcnComponentDefinitions.Skeleton,
      description: '骨架屏组件，用于加载状态占位'
    }
  },
  actions: {
    submit: {
      params: z.object({
        formId: z.string().describe('表单 ID'),
        data: z.record(z.string(), z.unknown()).optional().describe('表单数据')
      }),
      description: '提交表单数据'
    },
    navigate: {
      params: z.object({
        url: z.string().describe('目标 URL')
      }),
      description: '导航到指定 URL'
    },
    showToast: {
      params: z.object({
        message: z.string().describe('提示消息内容'),
        type: z
          .enum(['success', 'error', 'info', 'warning'])
          .optional()
          .describe('提示类型'),
        duration: z.number().optional().describe('显示时长（毫秒）')
      }),
      description: '显示提示消息'
    },
    openDialog: {
      params: z.object({
        dialogId: z.string().describe('对话框 ID')
      }),
      description: '打开指定的对话框'
    },
    closeDialog: {
      params: z.object({
        dialogId: z.string().describe('对话框 ID')
      }),
      description: '关闭指定的对话框'
    }
  }
});

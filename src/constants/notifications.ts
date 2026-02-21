/**
 * 静态通知数据
 * 用于 Header 通知功能的示例数据
 */

export interface Notification {
  id: string;
  avatar?: string;
  avatarText?: string; // 如 "VB"
  title: string;
  description: string;
  timestamp: string; // 如 "3小时前"、"刚刚"、"2024-01-01"
  /** 时间戳翻译 key，用于国际化 */
  timestampKey?: string;
  isRead: boolean;
  type?: 'info' | 'warning' | 'success' | 'error';
}

/**
 * 示例通知数据
 * 根据图片描述创建的通知列表
 * title/description 使用翻译 key，timestamp 支持 timestampKey
 */
export const mockNotifications: Notification[] = [
  {
    id: '1',
    avatarText: 'VB',
    title: '收到了14份新周报',
    description: '描述信息描述信息描述信息',
    timestamp: '3小时前',
    timestampKey: '3hoursAgo',
    isRead: false,
    type: 'info'
  },
  {
    id: '2',
    title: '朱偏右 回复了你',
    description: '描述信息描述信息描述信息',
    timestamp: '刚刚',
    timestampKey: 'justNow',
    isRead: false,
    type: 'info'
  },
  {
    id: '3',
    title: '曲丽丽 评论了你',
    description: '描述信息描述信息描述信息',
    timestamp: '2024-01-01',
    isRead: false,
    type: 'info'
  },
  {
    id: '4',
    title: '代办提醒',
    description: '描述信息描述信息描述信息',
    timestamp: '1天前',
    timestampKey: '1dayAgo',
    isRead: false,
    type: 'warning'
  }
];

/**
 * 获取未读通知数量
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

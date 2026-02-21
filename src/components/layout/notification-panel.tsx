'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/stores/notification-store';
import { Icons } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationItemProps {
  notification: {
    id: string;
    avatar?: string;
    avatarText?: string;
    title: string;
    description: string;
    timestamp: string;
    timestampKey?: string;
    isRead: boolean;
  };
  /** 已翻译的标题 */
  displayTitle: string;
  /** 已翻译的描述 */
  displayDescription: string;
  /** 已翻译的时间戳 */
  displayTimestamp: string;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  markAsReadLabel: string;
  deleteNotificationLabel: string;
}

/**
 * 通知项组件
 */
function NotificationItem({
  notification,
  displayTitle,
  displayDescription,
  displayTimestamp,
  onMarkAsRead,
  onDelete,
  markAsReadLabel,
  deleteNotificationLabel
}: NotificationItemProps) {
  return (
    <div
      className={cn(
        'hover:bg-accent/50 flex items-start gap-3 p-4 transition-colors',
        !notification.isRead && 'bg-accent/30'
      )}
    >
      {/* 头像 */}
      <Avatar className='h-10 w-10 shrink-0'>
        {notification.avatar ? (
          <AvatarImage src={notification.avatar} alt={displayTitle} />
        ) : null}
        <AvatarFallback className='bg-gradient-to-br from-green-400 to-green-600 text-white'>
          {notification.avatarText || 'N'}
        </AvatarFallback>
      </Avatar>

      {/* 内容 */}
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex items-start justify-between gap-2'>
          <p className='text-sm leading-none font-medium'>{displayTitle}</p>
          {!notification.isRead && (
            <span className='mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black' />
          )}
        </div>
        <p className='text-muted-foreground line-clamp-2 text-xs leading-relaxed'>
          {displayDescription}
        </p>
        <p className='text-muted-foreground text-xs'>{displayTimestamp}</p>
      </div>

      {/* 操作按钮 */}
      <div className='flex shrink-0 flex-col gap-1'>
        {!notification.isRead ? (
          <>
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className='flex h-6 w-6 items-center justify-center rounded-full bg-black transition-colors hover:bg-black/80'
              aria-label={markAsReadLabel}
            >
              <Icons.check className='h-3 w-3 text-white' />
            </button>
            <button
              onClick={() => onDelete(notification.id)}
              className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500 transition-colors hover:bg-red-600'
              aria-label={deleteNotificationLabel}
            >
              <Icons.close className='h-3 w-3 text-white' />
            </button>
          </>
        ) : (
          <button
            onClick={() => onDelete(notification.id)}
            className='flex h-6 w-6 items-center justify-center rounded-full bg-black transition-colors hover:bg-black/80'
            aria-label={deleteNotificationLabel}
          >
            <Icons.check className='h-3 w-3 text-white' />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 通知面板组件
 * 使用 Sheet 组件实现侧边栏通知面板
 */
export function NotificationPanel({
  open,
  onOpenChange
}: NotificationPanelProps) {
  const [mounted, setMounted] = useState(false);
  const {
    notifications,
    markAsRead,
    deleteNotification,
    clearAll,
    unreadCount
  } = useNotificationStore();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const tNotifications = useTranslations('notifications');

  // 确保在客户端 hydration 完成后再渲染
  useEffect(() => {
    setMounted(true);
    // 触发 Zustand store 的 hydration
    useNotificationStore.persist.rehydrate();
  }, []);

  const handleViewAll = () => {
    // 跳转到通知页面（如果存在）
    // 如果页面不存在，可以暂时跳转到首页或显示提示
    router.push(`/${locale}/dashboard/overview`);
    onOpenChange(false);
  };

  const handleClearAll = () => {
    clearAll();
  };

  if (!mounted) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex w-full flex-col p-0 sm:max-w-md'
      >
        <SheetHeader className='border-b px-6 py-4'>
          <SheetTitle className='text-lg font-semibold'>
            {t('notifications')}
          </SheetTitle>
          <SheetDescription className='sr-only'>
            {t('notificationsDescription')}
          </SheetDescription>
        </SheetHeader>

        {/* 通知列表 */}
        <div className='flex-1 overflow-y-auto'>
          {notifications.length === 0 ? (
            <div className='flex h-full flex-col items-center justify-center px-6 py-12 text-center'>
              <Icons.bell className='text-muted-foreground mb-4 h-12 w-12 opacity-50' />
              <p className='text-muted-foreground text-sm'>
                {t('noNotifications')}
              </p>
            </div>
          ) : (
            <div className='divide-border divide-y'>
              {notifications.map((notification) => {
                const titleKey = `items.${notification.id}.title`;
                const descKey = `items.${notification.id}.description`;
                const displayTitle =
                  tNotifications(titleKey) !== titleKey
                    ? tNotifications(titleKey)
                    : notification.title;
                const displayDescription =
                  tNotifications(descKey) !== descKey
                    ? tNotifications(descKey)
                    : notification.description;
                const displayTimestamp = notification.timestampKey
                  ? tNotifications(`timestamp.${notification.timestampKey}`)
                  : notification.timestamp;

                return (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    displayTitle={displayTitle}
                    displayDescription={displayDescription}
                    displayTimestamp={displayTimestamp}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    markAsReadLabel={t('markAsRead')}
                    deleteNotificationLabel={t('deleteNotification')}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        {notifications.length > 0 && (
          <SheetFooter className='gap-2 border-t px-6 py-4'>
            <Button
              variant='outline'
              onClick={handleClearAll}
              className='flex-1'
            >
              {t('clear')}
            </Button>
            <Button
              onClick={handleViewAll}
              className='flex-1 bg-gray-900 text-white hover:bg-gray-800'
            >
              {t('viewAllMessages')}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

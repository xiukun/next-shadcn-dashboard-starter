'use client';

import { useAuthContext } from '@/components/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatarProfile } from '@/components/user-avatar-profile';

export default function ProfileViewPage() {
  const { user, organization } = useAuthContext();

  if (!user) {
    return (
      <div className='flex w-full flex-col items-center justify-center p-8'>
        <p className='text-muted-foreground text-sm'>
          当前未登录，请先通过登录页完成模拟登录。
        </p>
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col gap-4 p-4'>
      <Card>
        <CardHeader className='flex flex-row items-center gap-4'>
          <UserAvatarProfile
            className='h-14 w-14 rounded-lg'
            showInfo
            user={{
              imageUrl: user.avatarUrl,
              fullName: user.name,
              emailAddresses: [{ emailAddress: user.email }]
            }}
          />
        </CardHeader>
        <CardContent className='space-y-2'>
          <div className='text-sm'>
            <span className='text-muted-foreground'>用户 ID：</span>
            <span className='font-mono text-xs'>{user.id}</span>
          </div>
          {organization && (
            <div className='text-sm'>
              <span className='text-muted-foreground'>当前工作空间：</span>
              <span className='font-medium'>{organization.name}</span>
              <span className='text-muted-foreground ml-2 text-xs'>
                角色：{organization.role}
              </span>
            </div>
          )}
          <p className='text-muted-foreground text-xs'>
            以上信息由 MSW + Faker 模拟生成，仅用于本地开发和 UI
            预览。接入真实后端时，
            可以复用该页面结构，替换为真实用户与组织数据。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

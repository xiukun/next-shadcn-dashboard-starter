'use client';

import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { useAuthContext } from '@/components/auth/auth-context';

export default function TeamPage() {
  const { organization } = useAuthContext();

  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='管理当前工作空间的成员、角色和安全设置（当前为本地模拟数据）。'
      infoContent={teamInfoContent}
    >
      {organization ? (
        <div className='bg-card space-y-4 rounded-lg border p-4'>
          <h2 className='text-lg font-semibold'>{organization.name}</h2>
          <p className='text-muted-foreground text-sm'>
            你的角色：{organization.role}
          </p>
          <p className='text-muted-foreground text-xs'>
            这里原本使用 Clerk 的 OrganizationProfile 组件。现在改为使用自定义
            AuthContext + MSW
            模拟。接入真实后端后可以在此渲染成员列表、邀请链接等。
          </p>
        </div>
      ) : (
        <p className='text-muted-foreground text-sm'>
          当前没有选中的工作空间，请先创建或绑定一个组织。
        </p>
      )}
    </PageContainer>
  );
}

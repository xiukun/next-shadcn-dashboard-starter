'use client';

import PageContainer from '@/components/layout/page-container';
import { workspacesInfoContent } from '@/config/infoconfig';
import { useAuthContext } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';

export default function WorkspacesPage() {
  const { organization } = useAuthContext();
  const router = useRouter();

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='管理你的工作空间和团队（当前为本地模拟数据，后续可接真实企业接口）'
      infoContent={workspacesInfoContent}
    >
      <div className='bg-card space-y-4 rounded-lg border p-4'>
        {organization ? (
          <>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold'>{organization.name}</h2>
                <p className='text-muted-foreground text-sm'>
                  角色：{organization.role}
                </p>
              </div>
              <Button
                variant='outline'
                onClick={() => router.push('/dashboard/workspaces/team')}
              >
                管理团队
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              当前组织信息由 MSW + Faker 模拟生成，接入真实后端时，只需替换
              AuthClient 实现即可。
            </p>
          </>
        ) : (
          <div className='space-y-3'>
            <p className='text-muted-foreground text-sm'>
              当前没有可用的工作空间。你可以在接入真实后端后，在这里展示组织列表。
            </p>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/overview')}
            >
              返回仪表盘
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

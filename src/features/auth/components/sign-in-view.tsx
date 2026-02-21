'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/components/auth/auth-context';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { IconStar } from '@tabler/icons-react';
import { Link } from '@/i18n/routing';
import { InteractiveGridPattern } from './interactive-grid';

const loginSchema = z.object({
  username: z.string().min(1, '请输入账号'),
  password: z.string().min(1, '请输入密码')
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInViewPage({ stars }: { stars: number }) {
  const router = useRouter();
  const { login, loading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin',
      password: '123456'
    }
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setError(null);
    try {
      await login(values);
      router.push('/dashboard/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试。');
    }
  };

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        返回首页
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          企业管理平台
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              开箱即用的中后台模板，适合中国企业管理场景。
            </p>
            <footer className='text-sm'>Next Shadcn Dashboard Starter</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <Link
            className={cn('group inline-flex hover:text-yellow-200')}
            target='_blank'
            href={'https://github.com/kiranism/next-shadcn-dashboard-starter'}
          >
            <div className='flex items-center'>
              <GitHubLogoIcon className='size-4' />
              <span className='ml-1 inline'>Star on GitHub</span>{' '}
            </div>
            <div className='ml-2 flex items-center gap-1 text-sm md:flex'>
              <IconStar
                className='size-4 text-gray-500 transition-all duration-300 group-hover:text-yellow-300'
                fill='currentColor'
              />
              <span className='font-display font-medium'>{stars}</span>
            </div>
          </Link>

          <div className='bg-card w-full rounded-xl border p-6 shadow-sm'>
            <div className='space-y-1 text-left'>
              <h1 className='text-2xl font-semibold tracking-tight'>
                欢迎回来
              </h1>
              <p className='text-muted-foreground text-sm'>
                请输入账号和密码进入企业管理后台。
              </p>
            </div>

            <Form
              form={form}
              onSubmit={form.handleSubmit(handleSubmit)}
              className='mt-6 space-y-4'
            >
              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>账号</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='如：admin'
                        autoComplete='username'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='请输入密码'
                        autoComplete='current-password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className='text-destructive text-sm' role='alert'>
                  {error}
                </p>
              )}

              <Button
                type='submit'
                className='mt-2 w-full'
                disabled={loading || form.formState.isSubmitting}
              >
                {loading || form.formState.isSubmitting ? '登录中...' : '登录'}
              </Button>
            </Form>
          </div>

          <p className='text-muted-foreground px-8 text-center text-xs'>
            登录即表示你已阅读并同意{' '}
            <Link
              href='/terms-of-service'
              className='hover:text-primary underline underline-offset-4'
            >
              服务条款
            </Link>{' '}
            和{' '}
            <Link
              href='/privacy-policy'
              className='hover:text-primary underline underline-offset-4'
            >
              隐私政策
            </Link>
            。
          </p>
        </div>
      </div>
    </div>
  );
}

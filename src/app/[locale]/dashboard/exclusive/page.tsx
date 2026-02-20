'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useAuthContext } from '@/components/auth/auth-context';
import { BadgeCheck, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ExclusivePage() {
  const { organization, loading } = useAuthContext();

  const hasAccess = !!organization;

  return (
    <PageContainer isloading={loading} access={hasAccess}>
      {hasAccess ? (
        <div className='space-y-6'>
          <div>
            <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
              <BadgeCheck className='h-7 w-7 text-green-600' />
              Exclusive Area
            </h1>
            <p className='text-muted-foreground'>
              Welcome,{' '}
              <span className='font-semibold'>{organization?.name}</span>! This
              page contains exclusive features for your organization.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                Thank You for Checking Out the Exclusive Page
              </CardTitle>
              <CardDescription>
                This area is reserved for organizations with special access in
                the current environment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-lg'>Have a wonderful day!</div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className='flex h-full items-center justify-center'>
          <Alert>
            <Lock className='h-5 w-5 text-yellow-600' />
            <AlertDescription>
              <div className='mb-1 text-lg font-semibold'>
                Organization Required
              </div>
              <div className='text-muted-foreground'>
                This page is only available when you have an active
                organization.
                <br />
                You can configure organization behavior when integrating with
                your real auth backend.
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </PageContainer>
  );
}

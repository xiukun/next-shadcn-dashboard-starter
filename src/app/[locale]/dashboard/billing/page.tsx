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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { billingInfoContent } from '@/config/infoconfig';

export default function BillingPage() {
  const { organization, loading } = useAuthContext();

  const hasAccess = !!organization;

  return (
    <PageContainer
      isloading={loading}
      access={hasAccess}
      accessFallback={
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-semibold'>No Organization Selected</h2>
            <p className='text-muted-foreground'>
              Please select or create an organization to view billing
              information.
            </p>
          </div>
        </div>
      }
      infoContent={billingInfoContent}
      pageTitle='Billing & Plans'
      pageDescription={
        organization
          ? `Manage your subscription and usage limits for ${organization.name}`
          : 'Manage your subscription and usage limits for your organization.'
      }
    >
      <div className='space-y-6'>
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            In the current mock auth setup, billing is a static preview. When
            you hook this project up to a real billing provider, you can replace
            this copy with real subscription data.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose a plan that fits your organization&apos;s needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mx-auto max-w-4xl'>
              <p className='text-muted-foreground py-8 text-center'>
                Billing feature is currently disabled in this mock environment.
                Integrate your billing provider here to display real pricing
                plans.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

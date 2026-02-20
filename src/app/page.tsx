import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default async function Page() {
  const { userId } = await auth();

  if (!userId) {
    return redirect(`/${defaultLocale}/auth/sign-in`);
  } else {
    redirect(`/${defaultLocale}/dashboard/overview`);
  }
}

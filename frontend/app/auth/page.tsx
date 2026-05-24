import { AuthContainer } from '@/components/auth/AuthContainer';
import { Suspense } from 'react';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams.view;
  const view = (viewParam === 'register' || viewParam === 'login') ? viewParam : 'login';

  return (
    <main>
      <Suspense fallback={<AuthLoading />}>
        <AuthContainer initialView={view} />
      </Suspense>
    </main>
  );
}

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading experience...</p>
      </div>
    </div>
  );
}

'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MetaAnalysisPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main analysis page
    router.push('/analysis');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to analysis...</p>
      </div>
    </div>
  );
}
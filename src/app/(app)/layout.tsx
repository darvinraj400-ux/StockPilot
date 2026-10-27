import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SetupScreen } from "@/components/shared/setup-notice";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return <SetupScreen />;
  }

  const { user } = await requireUser();

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar user={user} />
      <div className="flex min-h-svh flex-col lg:pl-[264px]">
        <AppHeader user={user} />
        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

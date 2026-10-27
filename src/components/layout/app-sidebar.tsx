import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import { getDisplayName, getInitials } from "@/lib/auth";

export function AppSidebar({ user }: { user: User }) {
  const name = getDisplayName(user);
  const email = user.email ?? "";
  const avatar = getInitials(name);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-sidebar lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href="/dashboard"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
        >
          <Logo variant="light" />
          <span className="sr-only">StockPilot dashboard</span>
        </Link>
      </div>

      <SidebarNav />

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-md px-2 py-2 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-emerald-400/50"
        >
          <Avatar className="size-8 border border-white/10">
            <AvatarFallback className="bg-emerald-500/15 text-[11px] text-emerald-300">
              {avatar}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-slate-100">
              {name}
            </span>
            <span className="block truncate text-[11px] text-sidebar-muted">
              {email}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

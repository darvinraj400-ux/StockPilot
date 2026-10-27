import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Plus, Search } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDisplayName, getInitials } from "@/lib/auth";

export function AppHeader({ user }: { user: User }) {
  const name = getDisplayName(user);
  const email = user.email ?? "";
  const initials = getInitials(name);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-6 lg:px-8">
      <div className="flex items-center gap-1 lg:hidden">
        <MobileNav name={name} email={email} initials={initials} />
        <Link
          href="/dashboard"
          className="rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label="StockPilot dashboard"
        >
          <LogoMark className="size-7" />
        </Link>
      </div>

      <form
        action="/products"
        method="get"
        role="search"
        className="hidden w-full max-w-xs md:block xl:max-w-sm"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            name="q"
            placeholder="Search products or SKU…"
            aria-label="Search products"
            className="h-9 bg-card pl-9"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/products/new">
            <Plus />
            New product
          </Link>
        </Button>
        <Button
          asChild
          size="icon"
          variant="outline"
          className="sm:hidden"
          aria-label="New product"
        >
          <Link href="/products/new">
            <Plus />
          </Link>
        </Button>
        <UserMenu name={name} email={email} initials={initials} />
      </div>
    </header>
  );
}

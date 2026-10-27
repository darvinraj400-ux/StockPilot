"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  isNavItemActive,
  navSections,
  settingsNavItem,
} from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
            {section.label}
          </p>
          <ul className="mt-2 space-y-0.5">
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                      active
                        ? "bg-sidebar-accent text-white"
                        : "text-sidebar-muted hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active
                          ? "text-emerald-400"
                          : "text-sidebar-muted group-hover:text-slate-200",
                      )}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-auto">
        <Link
          href={settingsNavItem.href}
          onClick={onNavigate}
          aria-current={
            isNavItemActive(pathname, settingsNavItem.href) ? "page" : undefined
          }
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400/50",
            isNavItemActive(pathname, settingsNavItem.href)
              ? "bg-sidebar-accent text-white"
              : "text-sidebar-muted hover:bg-white/5 hover:text-white",
          )}
        >
          <settingsNavItem.icon
            className="size-4 shrink-0 text-sidebar-muted group-hover:text-slate-200"
            aria-hidden="true"
          />
          {settingsNavItem.label}
        </Link>
      </div>
    </nav>
  );
}

import type { Metadata } from "next";
import { LogOut, ShieldCheck } from "lucide-react";

import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "@/lib/actions/auth";
import { getDisplayName, requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { user } = await requireUser();
  const displayName = getDisplayName(user);
  const email = user.email ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and review the security model protecting your inventory data."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Your name appears in the sidebar and account menu.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileForm fullName={displayName} email={email} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Account</CardTitle>
                <CardDescription>Details from your session.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="max-w-[190px] truncate text-right font-medium text-slate-900">
                    {email || "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={user.email_confirmed_at ? "success" : "warning"}>
                      {user.email_confirmed_at ? "Verified" : "Awaiting confirmation"}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Member since</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div className="space-y-1 border-t pt-3">
                  <dt className="text-muted-foreground">Account ID</dt>
                  <dd className="break-all font-mono text-[11px] leading-5 text-slate-500">
                    {user.id}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Session</CardTitle>
                <CardDescription>
                  Signing out ends this browser session.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form action={signOut}>
                <Button type="submit" variant="outline" className="w-full">
                  <LogOut />
                  Sign out
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-700" />
                  Data protection
                </CardTitle>
                <CardDescription>How your inventory is isolated.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-1">
              <ul className="space-y-2.5 text-xs leading-5 text-muted-foreground">
                <li>
                  Row-level security restricts every query to records owned by
                  your account.
                </li>
                <li>
                  Stock quantities change only through a transactional ledger
                  function that records before and after values.
                </li>
                <li>
                  The Supabase service-role key is never used in browser code.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

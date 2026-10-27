import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { ActiveBadge } from "@/components/shared/status-badges";
import {
  NewSupplierButton,
  SupplierRowActions,
} from "@/components/suppliers/supplier-dialogs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSuppliersList,
  parseSupplierListFilters,
} from "@/lib/data/suppliers";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/suppliers">) {
  const rawSearchParams = await searchParams;
  const filters = parseSupplierListFilters(rawSearchParams);
  const { suppliers, total } = await getSuppliersList(filters);

  const hasFilters = Boolean(filters.q || filters.status !== "all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Keep vendor contacts and sourcing details alongside the products they supply."
        actions={<NewSupplierButton />}
      />

      <Card className="overflow-hidden">
        <SearchFilterBar
          basePath="/suppliers"
          searchParams={rawSearchParams}
          q={filters.q}
          status={filters.status}
          statusAriaLabel="Filter suppliers by status"
          placeholder="Search name, contact, or email…"
          statusOptions={[
            { value: "all", label: "All suppliers" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
        />

        {suppliers.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Truck}
              title="No suppliers match"
              description="Try a different search term or show all suppliers."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/suppliers">Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Truck}
              title="No suppliers yet"
              description="Add the vendors you buy from. You can attach them to products for easier reordering and reference."
              action={<NewSupplierButton />}
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right">Active products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Added</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="max-w-[260px]">
                      <span className="block truncate font-medium text-slate-900">
                        {supplier.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {supplier.contact_name || "No contact name"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-[260px] md:table-cell">
                      {supplier.email ? (
                        <a
                          href={`mailto:${supplier.email}`}
                          className="block truncate text-[13px] text-slate-700 hover:text-emerald-700"
                        >
                          {supplier.email}
                        </a>
                      ) : (
                        <span className="block text-xs text-muted-foreground">
                          No email
                        </span>
                      )}
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {supplier.phone || "No phone"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/products?supplier=${supplier.id}`}
                        className="inline-flex rounded-md border bg-slate-50 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {supplier.active_product_count}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={supplier.is_active} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatDate(supplier.created_at)}
                    </TableCell>
                    <TableCell>
                      <SupplierRowActions supplier={supplier} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              {total} {total === 1 ? "supplier" : "suppliers"}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

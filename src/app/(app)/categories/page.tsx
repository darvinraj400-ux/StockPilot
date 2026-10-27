import type { Metadata } from "next";
import Link from "next/link";
import { Tags } from "lucide-react";

import {
  CategoryRowActions,
  NewCategoryButton,
} from "@/components/categories/category-dialogs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { ActiveBadge } from "@/components/shared/status-badges";
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
  getCategoriesList,
  parseCategoryListFilters,
} from "@/lib/data/categories";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage({
  searchParams,
}: PageProps<"/categories">) {
  const rawSearchParams = await searchParams;
  const filters = parseCategoryListFilters(rawSearchParams);
  const { categories, total } = await getCategoriesList(filters);

  const hasFilters = Boolean(filters.q || filters.status !== "all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Group products for faster filtering and clearer reporting. Archiving keeps existing product assignments intact."
        actions={<NewCategoryButton />}
      />

      <Card className="overflow-hidden">
        <SearchFilterBar
          basePath="/categories"
          searchParams={rawSearchParams}
          q={filters.q}
          status={filters.status}
          statusAriaLabel="Filter categories by status"
          placeholder="Search categories…"
          statusOptions={[
            { value: "all", label: "All categories" },
            { value: "active", label: "Active" },
            { value: "archived", label: "Archived" },
          ]}
        />

        {categories.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Tags}
              title="No categories match"
              description="Try a different search term or show all categories."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/categories">Clear filters</Link>
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Categories are optional. Create one to group related products and make filtering easier."
              action={<NewCategoryButton />}
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Active products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-10">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="max-w-[360px]">
                      <span className="block truncate font-medium text-slate-900">
                        {category.name}
                      </span>
                      {category.description ? (
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {category.description}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/products?category=${category.id}`}
                        className="inline-flex rounded-md border bg-slate-50 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        {category.active_product_count}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ActiveBadge active={category.is_active} />
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {formatDate(category.created_at)}
                    </TableCell>
                    <TableCell>
                      <CategoryRowActions category={category} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
              {total} {total === 1 ? "category" : "categories"}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

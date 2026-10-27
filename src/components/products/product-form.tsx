"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowLeft,
  Boxes,
  LoaderCircle,
  LockKeyhole,
  Save,
} from "lucide-react";

import { FieldError, FormAlert } from "@/components/forms/form-alert";
import { ActiveBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { formatCurrency, formatQuantity } from "@/lib/format";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "@/lib/validations/product";
import type { Category, Product, Supplier } from "@/types/database";

function defaultsFor(product?: Product): ProductFormValues {
  if (!product) {
    return {
      sku: "",
      name: "",
      description: "",
      categoryId: "none",
      supplierId: "none",
      unit: "each",
      costPrice: "",
      sellingPrice: "",
      reorderLevel: "0",
    };
  }

  return {
    sku: product.sku,
    name: product.name,
    description: product.description ?? "",
    categoryId: product.category_id ?? "none",
    supplierId: product.supplier_id ?? "none",
    unit: product.unit,
    costPrice: Number(product.cost_price).toFixed(2),
    sellingPrice: Number(product.selling_price).toFixed(2),
    reorderLevel: String(product.reorder_level),
  };
}

export function ProductForm({
  mode,
  product,
  categories,
  suppliers,
}: {
  mode: "create" | "edit";
  product?: Product;
  categories: Category[];
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultsFor(product),
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);

    startTransition(async () => {
      try {
        const result =
          mode === "create"
            ? await createProduct(values)
            : await updateProduct(product!.id, values);

        if (!result.ok) {
          setSubmitError(result.message);
          for (const [field, messages] of Object.entries(
            result.fieldErrors ?? {},
          )) {
            if (field in defaultsFor(product)) {
              form.setError(field as keyof ProductFormValues, {
                type: "server",
                message: messages[0],
              });
            }
          }
          return;
        }

        toast.success(
          mode === "create"
            ? `${values.name.trim()} was created with zero stock.`
            : `${values.name.trim()} was updated.`,
          {
            description:
              mode === "create"
                ? "Record a stock-in movement to add units to the shelf."
                : "Pricing and catalog details are up to date.",
          },
        );
        router.push(`/products/${result.data.id}`);
        router.refresh();
      } catch {
        setSubmitError("The product could not be saved. Please try again.");
      }
    });
  });

  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {submitError ? <FormAlert>{submitError}</FormAlert> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Identification</CardTitle>
                <CardDescription>
                  The name and SKU customers and staff will recognize.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-name">Product name</Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Ceramic pour-over dripper"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "product-name-error" : undefined}
                  {...form.register("name")}
                />
                <FieldError
                  id="product-name-error"
                  messages={errors.name?.message ? [errors.name.message] : undefined}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  placeholder="e.g. BREW-DRIP-01"
                  autoComplete="off"
                  className="font-mono uppercase"
                  aria-invalid={Boolean(errors.sku)}
                  aria-describedby="product-sku-hint product-sku-error"
                  {...form.register("sku")}
                />
                <p id="product-sku-hint" className="text-[11px] text-muted-foreground">
                  Unique within your workspace, case-insensitive.
                </p>
                <FieldError
                  id="product-sku-error"
                  messages={errors.sku?.message ? [errors.sku.message] : undefined}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-unit">Unit</Label>
                <Input
                  id="product-unit"
                  placeholder="each, box, kg…"
                  list="product-unit-suggestions"
                  aria-invalid={Boolean(errors.unit)}
                  aria-describedby={errors.unit ? "product-unit-error" : undefined}
                  {...form.register("unit")}
                />
                <datalist id="product-unit-suggestions">
                  <option value="each" />
                  <option value="box" />
                  <option value="pack" />
                  <option value="kg" />
                  <option value="litre" />
                  <option value="metre" />
                </datalist>
                <FieldError
                  id="product-unit-error"
                  messages={errors.unit?.message ? [errors.unit.message] : undefined}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-description">
                  Description
                  <span className="text-xs font-normal text-muted-foreground">
                    optional
                  </span>
                </Label>
                <Textarea
                  id="product-description"
                  rows={3}
                  placeholder="Internal notes, dimensions, or a short description."
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description ? "product-description-error" : undefined
                  }
                  {...form.register("description")}
                />
                <FieldError
                  id="product-description-error"
                  messages={
                    errors.description?.message
                      ? [errors.description.message]
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Organization</CardTitle>
                <CardDescription>
                  Optionally group this product and record where it comes from.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="product-category">Category</Label>
                <Controller
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="product-category"
                        aria-invalid={Boolean(errors.categoryId)}
                      >
                        <SelectValue placeholder="Uncategorized" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Uncategorized</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                            {category.is_active ? "" : " (archived)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  messages={
                    errors.categoryId?.message ? [errors.categoryId.message] : undefined
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-supplier">Supplier</Label>
                <Controller
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="product-supplier"
                        aria-invalid={Boolean(errors.supplierId)}
                      >
                        <SelectValue placeholder="No supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No supplier</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                            {supplier.is_active ? "" : " (archived)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError
                  messages={
                    errors.supplierId?.message ? [errors.supplierId.message] : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Pricing &amp; reorder</CardTitle>
                <CardDescription>
                  Money is stored as exact decimals. Reorder level drives
                  low-stock alerts.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="product-cost">Cost price</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="product-cost"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-7"
                    aria-invalid={Boolean(errors.costPrice)}
                    aria-describedby={
                      errors.costPrice ? "product-cost-error" : undefined
                    }
                    {...form.register("costPrice")}
                  />
                </div>
                <FieldError
                  id="product-cost-error"
                  messages={
                    errors.costPrice?.message ? [errors.costPrice.message] : undefined
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-price">Selling price</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="product-price"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-7"
                    aria-invalid={Boolean(errors.sellingPrice)}
                    aria-describedby={
                      errors.sellingPrice ? "product-price-error" : undefined
                    }
                    {...form.register("sellingPrice")}
                  />
                </div>
                <FieldError
                  id="product-price-error"
                  messages={
                    errors.sellingPrice?.message
                      ? [errors.sellingPrice.message]
                      : undefined
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-reorder">Reorder level</Label>
                <Input
                  id="product-reorder"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.reorderLevel)}
                  aria-describedby={
                    errors.reorderLevel ? "product-reorder-error" : undefined
                  }
                  {...form.register("reorderLevel")}
                />
                <FieldError
                  id="product-reorder-error"
                  messages={
                    errors.reorderLevel?.message
                      ? [errors.reorderLevel.message]
                      : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Stock quantity</CardTitle>
                {product ? <ActiveBadge active={product.is_active} /> : null}
              </div>
            </CardHeader>
            <CardContent>
              {product ? (
                <>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {formatQuantity(product.quantity_on_hand, product.unit)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inventory value at cost:{" "}
                    {formatCurrency(product.quantity_on_hand * Number(product.cost_price))}
                  </p>
                  <p className="mt-4 flex gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-5 text-slate-600">
                    <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    Quantity is managed by stock movements, not this form.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href={`/products/${product.id}`}>
                      <Boxes />
                      View stock history
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    0 <span className="text-sm font-normal text-muted-foreground">on hand</span>
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    New products begin at zero. After saving, record a stock-in
                    movement to add units.
                  </p>
                  <p className="mt-4 flex gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-[11px] leading-5 text-slate-600">
                    <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                    There is no quantity field: stock only changes through the
                    transactional ledger.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                How it works
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                <li>Cost price is used for inventory valuation.</li>
                <li>
                  Low stock is triggered when on hand is at or below the reorder
                  level.
                </li>
                <li>Archiving preserves the product&apos;s movement history.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href={product ? `/products/${product.id}` : "/products"}>
            <ArrowLeft />
            Cancel
          </Link>
        </Button>
        <Button type="submit" disabled={isPending} className="sm:min-w-36">
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

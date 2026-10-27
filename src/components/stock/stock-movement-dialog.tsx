"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LoaderCircle,
  PackageSearch,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";

import { FieldError, FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordStockMovement } from "@/lib/actions/stock";
import { formatNumber, formatQuantity, formatSignedNumber } from "@/lib/format";
import {
  MOVEMENT_TYPE_LABELS,
  getSignedDelta,
  type MovementType,
} from "@/lib/inventory";
import {
  stockMovementSchema,
  type StockMovementFormInput,
  type StockMovementFormValues,
} from "@/lib/validations/stock";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/database";

type DialogProduct = Pick<
  Product,
  "id" | "name" | "sku" | "unit" | "quantity_on_hand" | "is_active"
>;

const movementOptions: {
  value: MovementType;
  icon: typeof ArrowDownToLine;
  hint: string;
}[] = [
  { value: "stock_in", icon: ArrowDownToLine, hint: "Receive units" },
  { value: "stock_out", icon: ArrowUpFromLine, hint: "Issue units" },
  { value: "adjustment", icon: SlidersHorizontal, hint: "Correct a count" },
];

export function StockMovementDialog({
  products,
  triggerLabel = "Record movement",
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName,
  defaultProductId,
  defaultMovementType = "stock_in",
}: {
  products: DialogProduct[];
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
  defaultProductId?: string;
  defaultMovementType?: MovementType;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(defaultProductId ?? "");
  const [isPending, startTransition] = useTransition();

  const form = useForm<StockMovementFormInput, unknown, StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: defaultProductId ?? "",
      movementType: defaultMovementType,
      quantity: 1,
      note: "",
    },
  });

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;
  const movementType = useWatch({ control: form.control, name: "movementType" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const note = useWatch({ control: form.control, name: "note" });

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = term
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(term) ||
            product.sku.toLowerCase().includes(term),
        )
      : products;
    return matches.slice(0, 60);
  }, [products, query]);

  const numericQuantity = Number.isFinite(quantity) ? Number(quantity) : 0;
  const delta = selectedProduct
    ? getSignedDelta(movementType, numericQuantity)
    : 0;
  const resultingQuantity = selectedProduct
    ? selectedProduct.quantity_on_hand + delta
    : null;
  const wouldGoNegative =
    resultingQuantity !== null && resultingQuantity < 0 && numericQuantity !== 0;

  function chooseProduct(product: DialogProduct) {
    setSelectedId(product.id);
    form.setValue("productId", product.id, {
      shouldValidate: form.formState.isSubmitted,
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      form.clearErrors();
      const preferred =
        defaultProductId && products.some((product) => product.id === defaultProductId)
          ? defaultProductId
          : selectedId && products.some((product) => product.id === selectedId)
            ? selectedId
            : "";
      setSelectedId(preferred);
      form.setValue("productId", preferred);
      setQuery("");
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    form.clearErrors("root");

    startTransition(async () => {
      const result = await recordStockMovement(values);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (
              field === "productId" ||
              field === "movementType" ||
              field === "quantity" ||
              field === "note"
            ) {
              form.setError(field, { message: messages[0] });
            }
          }
        }
        form.setError("root", { message: result.message });
        return;
      }

      const unit = selectedProduct?.unit ?? "units";
      toast.success(
        `${MOVEMENT_TYPE_LABELS[values.movementType]} recorded for ${selectedProduct?.name ?? "the product"}.`,
        {
          description: `New quantity on hand: ${formatQuantity(result.data.movement.quantity_after, unit)}.`,
        },
      );
      form.reset({
        productId: selectedId,
        movementType: "stock_in",
        quantity: 1,
        note: "",
      });
      setOpen(false);
      router.refresh();
    });
  });

  const isAdjustment = movementType === "adjustment";
  const trimmedNote = (note ?? "").trim();
  const rootError = form.formState.errors.root?.message;

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
        onClick={() => handleOpenChange(true)}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record stock movement</DialogTitle>
            <DialogDescription>
              Stock changes are written as a single transaction with before and
              after quantities.
            </DialogDescription>
          </DialogHeader>

          {products.length === 0 ? (
            <div className="rounded-lg border border-dashed px-5 py-8 text-center">
              <PackageSearch className="mx-auto size-6 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-slate-900">
                Add a product first
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Stock movements are recorded against an active product.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/products/new">Create product</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {rootError ? <FormAlert>{rootError}</FormAlert> : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stock-product-search">Product</Label>
                  {selectedProduct ? (
                    <span className="text-[11px] text-muted-foreground">
                      Selected: {selectedProduct.sku}
                    </span>
                  ) : null}
                </div>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="stock-product-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by product name or SKU…"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>

                <div
                  role="listbox"
                  aria-label="Products"
                  className="max-h-40 overflow-y-auto rounded-lg border bg-card"
                >
                  {filteredProducts.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-muted-foreground">
                      No active products match “{query}”.
                    </p>
                  ) : (
                    filteredProducts.map((product) => {
                      const selected = product.id === selectedId;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => chooseProduct(product)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm outline-none transition-colors last:border-b-0 focus-visible:bg-emerald-50",
                            selected
                              ? "bg-emerald-50/80 text-emerald-900"
                              : "hover:bg-slate-50",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">
                              {product.name}
                            </span>
                            <span className="block font-mono text-[11px] text-muted-foreground">
                              {product.sku}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {formatQuantity(product.quantity_on_hand, product.unit)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <FieldError messages={form.formState.errors.productId?.message ? [form.formState.errors.productId.message] : undefined} />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Movement type
                </legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {movementOptions.map((option) => {
                    const active = movementType === option.value;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          form.setValue("movementType", option.value, {
                            shouldValidate: form.formState.isSubmitted,
                          })
                        }
                        aria-pressed={active}
                        className={cn(
                          "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
                          active
                            ? "border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-200"
                            : "bg-card hover:bg-slate-50",
                        )}
                      >
                        <Icon
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            active ? "text-emerald-700" : "text-slate-500",
                          )}
                          aria-hidden="true"
                        />
                        <span>
                          <span className="block text-[13px] font-medium text-slate-900">
                            {MOVEMENT_TYPE_LABELS[option.value]}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <FieldError messages={form.formState.errors.movementType?.message ? [form.formState.errors.movementType.message] : undefined} />
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="stock-quantity">
                    Quantity
                    {isAdjustment ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        (signed)
                      </span>
                    ) : null}
                  </Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    step="1"
                    inputMode="numeric"
                    aria-invalid={Boolean(form.formState.errors.quantity)}
                    aria-describedby={
                      form.formState.errors.quantity ? "stock-quantity-error" : undefined
                    }
                    {...form.register("quantity", { valueAsNumber: true })}
                  />
                  {isAdjustment ? (
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      Use a negative number to reduce stock.
                    </p>
                  ) : null}
                  <FieldError
                    id="stock-quantity-error"
                    messages={
                      form.formState.errors.quantity?.message
                        ? [form.formState.errors.quantity.message]
                        : undefined
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stock-note">
                    {isAdjustment ? "Reason for adjustment" : "Note"}
                    {isAdjustment ? null : (
                      <span className="text-xs font-normal text-muted-foreground">
                        optional
                      </span>
                    )}
                  </Label>
                  <Textarea
                    id="stock-note"
                    rows={3}
                    placeholder={
                      isAdjustment
                        ? "e.g. Cycle count correction after physical inventory"
                        : "e.g. Delivery from supplier, order #1042"
                    }
                    aria-invalid={Boolean(form.formState.errors.note)}
                    aria-describedby={
                      form.formState.errors.note ? "stock-note-error" : undefined
                    }
                    {...form.register("note")}
                  />
                  <FieldError
                    id="stock-note-error"
                    messages={
                      form.formState.errors.note?.message
                        ? [form.formState.errors.note.message]
                        : undefined
                    }
                  />
                </div>
              </div>

              <div
                aria-live="polite"
                className={cn(
                  "rounded-lg border p-4",
                  wouldGoNegative
                    ? "border-red-200 bg-red-50/60"
                    : "border-slate-200 bg-slate-50/70",
                )}
              >
                {selectedProduct ? (
                  <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        On hand
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                        {formatNumber(selectedProduct.quantity_on_hand)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Change
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold tabular-nums",
                          delta > 0
                            ? "text-emerald-700"
                            : delta < 0
                              ? "text-red-600"
                              : "text-slate-500",
                        )}
                      >
                        {numericQuantity !== 0
                          ? formatSignedNumber(delta)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        Resulting
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold tabular-nums",
                          wouldGoNegative ? "text-red-600" : "text-slate-900",
                        )}
                      >
                        {numericQuantity !== 0
                          ? formatNumber(resultingQuantity ?? 0)
                          : "—"}{" "}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {selectedProduct.unit}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Select a product to preview the resulting quantity.
                  </p>
                )}

                {wouldGoNegative ? (
                  <p className="mt-3 flex items-start gap-2 text-xs font-medium text-red-700">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    This change would take stock below zero. Reduce the quantity
                    or receive stock first.
                  </p>
                ) : null}
                {isAdjustment && trimmedNote.length > 0 && trimmedNote.length < 3 ? (
                  <p className="mt-3 text-xs text-amber-700">
                    Add a little more detail to the adjustment reason.
                  </p>
                ) : null}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !selectedProduct}>
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {isPending ? "Recording…" : "Record movement"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

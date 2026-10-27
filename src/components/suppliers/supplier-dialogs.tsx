"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Ellipsis,
  LoaderCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { FieldError, FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createSupplier,
  setSupplierActive,
  updateSupplier,
} from "@/lib/actions/suppliers";
import { initialActionState, type ActionState } from "@/lib/action-state";
import type { Supplier } from "@/types/database";

type SupplierAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

function SupplierForm({
  action,
  supplier,
  onSaved,
}: {
  action: SupplierAction;
  supplier?: Supplier;
  onSaved: (message: string) => void;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const handled = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      onSaved(state.message ?? "Supplier saved.");
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormAlert>{state.message}</FormAlert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="supplier-name">Supplier name</Label>
          <Input
            id="supplier-name"
            name="name"
            defaultValue={supplier?.name ?? ""}
            placeholder="e.g. Northwind Supply Co."
            autoComplete="organization"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
            aria-describedby={
              state.fieldErrors?.name ? "supplier-name-error" : undefined
            }
          />
          <FieldError id="supplier-name-error" messages={state.fieldErrors?.name} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supplier-contact">
            Contact name
            <span className="text-xs font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="supplier-contact"
            name="contactName"
            defaultValue={supplier?.contact_name ?? ""}
            placeholder="Primary contact"
            autoComplete="name"
            aria-invalid={Boolean(state.fieldErrors?.contactName)}
            aria-describedby={
              state.fieldErrors?.contactName ? "supplier-contact-error" : undefined
            }
          />
          <FieldError
            id="supplier-contact-error"
            messages={state.fieldErrors?.contactName}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supplier-email">
            Email
            <span className="text-xs font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="supplier-email"
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ""}
            placeholder="orders@supplier.com"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? "supplier-email-error" : undefined
            }
          />
          <FieldError id="supplier-email-error" messages={state.fieldErrors?.email} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supplier-phone">
            Phone
            <span className="text-xs font-normal text-muted-foreground">optional</span>
          </Label>
          <Input
            id="supplier-phone"
            name="phone"
            type="tel"
            defaultValue={supplier?.phone ?? ""}
            placeholder="+1 (555) 010-2000"
            autoComplete="tel"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={
              state.fieldErrors?.phone ? "supplier-phone-error" : undefined
            }
          />
          <FieldError id="supplier-phone-error" messages={state.fieldErrors?.phone} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="supplier-address">
          Address
          <span className="text-xs font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="supplier-address"
          name="address"
          rows={2}
          defaultValue={supplier?.address ?? ""}
          placeholder="Street, city, region, postal code"
          aria-invalid={Boolean(state.fieldErrors?.address)}
          aria-describedby={
            state.fieldErrors?.address ? "supplier-address-error" : undefined
          }
        />
        <FieldError id="supplier-address-error" messages={state.fieldErrors?.address} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="supplier-notes">
          Notes
          <span className="text-xs font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="supplier-notes"
          name="notes"
          rows={2}
          defaultValue={supplier?.notes ?? ""}
          placeholder="Lead times, order minimums, account details…"
          aria-invalid={Boolean(state.fieldErrors?.notes)}
          aria-describedby={
            state.fieldErrors?.notes ? "supplier-notes-error" : undefined
          }
        />
        <FieldError id="supplier-notes-error" messages={state.fieldErrors?.notes} />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton pendingLabel={supplier ? "Saving…" : "Creating…"}>
          {supplier ? "Save changes" : "Create supplier"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

function SupplierDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
}) {
  const router = useRouter();
  const action: SupplierAction = supplier
    ? updateSupplier.bind(null, supplier.id)
    : createSupplier;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit supplier" : "New supplier"}</DialogTitle>
          <DialogDescription>
            {supplier
              ? "Update vendor details. Product assignments are unchanged."
              : "Record the vendors you buy from and keep their contact details close to the catalog."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SupplierForm
            action={action}
            supplier={supplier}
            onSaved={(message) => {
              onOpenChange(false);
              toast.success(message);
              router.refresh();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function NewSupplierButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        New supplier
      </Button>
      <SupplierDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function SupplierRowActions({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function setActive(active: boolean) {
    startTransition(async () => {
      const result = await setSupplierActive(supplier.id, active);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        active ? `${supplier.name} was reactivated.` : `${supplier.name} was archived.`,
        {
          description: active
            ? undefined
            : "Products keep their supplier assignment. You can reactivate it later.",
        },
      );
      setConfirmOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${supplier.name}`}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Ellipsis className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit supplier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {supplier.is_active ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Archive className="size-4" />
              Archive supplier
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setActive(true)}>
              <ArchiveRestore className="size-4" />
              Reactivate supplier
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SupplierDialog open={editOpen} onOpenChange={setEditOpen} supplier={supplier} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {supplier.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The supplier will be marked archived. Existing products keep their
              supplier assignment and no data is deleted. You can reactivate it
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                setActive(false);
              }}
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isPending ? "Archiving…" : "Archive supplier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

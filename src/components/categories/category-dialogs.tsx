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
  createCategory,
  setCategoryActive,
  updateCategory,
} from "@/lib/actions/categories";
import {
  initialActionState,
  type ActionState,
} from "@/lib/action-state";
import type { Category } from "@/types/database";

type CategoryAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

function CategoryForm({
  action,
  category,
  onSaved,
}: {
  action: CategoryAction;
  category?: Category;
  onSaved: (message: string) => void;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const handled = useRef(false);

  useEffect(() => {
    if (state.status === "success" && !handled.current) {
      handled.current = true;
      onSaved(state.message ?? "Category saved.");
    }
  }, [state, onSaved]);

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message ? (
        <FormAlert>{state.message}</FormAlert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="category-name">Name</Label>
        <Input
          id="category-name"
          name="name"
          defaultValue={category?.name ?? ""}
          placeholder="e.g. Brewing equipment"
          autoComplete="off"
          required
          aria-invalid={Boolean(state.fieldErrors?.name)}
          aria-describedby={state.fieldErrors?.name ? "category-name-error" : undefined}
        />
        <FieldError id="category-name-error" messages={state.fieldErrors?.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category-description">
          Description
          <span className="text-xs font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="category-description"
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          placeholder="What belongs in this category?"
          aria-invalid={Boolean(state.fieldErrors?.description)}
          aria-describedby={
            state.fieldErrors?.description ? "category-description-error" : undefined
          }
        />
        <FieldError
          id="category-description-error"
          messages={state.fieldErrors?.description}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton pendingLabel={category ? "Saving…" : "Creating…"}>
          {category ? "Save changes" : "Create category"}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
}) {
  const router = useRouter();

  const action: CategoryAction = category
    ? updateCategory.bind(null, category.id)
    : createCategory;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Rename or update the description. Products keep their assignment."
              : "Categories are optional, but they make filtering and reporting easier."}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <CategoryForm
            action={action}
            category={category}
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

export function NewCategoryButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        New category
      </Button>
      <CategoryDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CategoryRowActions({ category }: { category: Category }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function setActive(active: boolean) {
    startTransition(async () => {
      const result = await setCategoryActive(category.id, active);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        active ? `${category.name} was reactivated.` : `${category.name} was archived.`,
        {
          description: active
            ? undefined
            : "Products keep their category assignment. You can reactivate it later.",
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
            aria-label={`Actions for ${category.name}`}
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
            Edit category
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {category.is_active ? (
            <DropdownMenuItem
              variant="destructive"
              onSelect={(event) => {
                event.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Archive className="size-4" />
              Archive category
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setActive(true)}>
              <ArchiveRestore className="size-4" />
              Reactivate category
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoryDialog open={editOpen} onOpenChange={setEditOpen} category={category} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {category.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The category will be marked archived. Existing products keep their
              assignment and no data is deleted. You can reactivate it later.
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
              {isPending ? "Archiving…" : "Archive category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

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
import { setProductActive } from "@/lib/actions/products";

export function ProductStatusAction({
  productId,
  productName,
  isActive,
}: {
  productId: string;
  productName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function setActive(active: boolean) {
    startTransition(async () => {
      const result = await setProductActive(productId, active);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      if (active) {
        toast.success(`${productName} was reactivated.`);
        router.refresh();
        return;
      }

      toast.success(`${productName} was archived.`, {
        description: "Its stock history is preserved and can be reactivated later.",
      });
      setConfirmOpen(false);
      router.push("/products?status=archived");
      router.refresh();
    });
  }

  return (
    <>
      {isActive ? (
        <Button variant="outline" onClick={() => setConfirmOpen(true)} disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Archive className="size-4" aria-hidden="true" />
          )}
          Archive
        </Button>
      ) : (
        <Button onClick={() => setActive(true)} disabled={isPending}>
          {isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArchiveRestore className="size-4" aria-hidden="true" />
          )}
          Reactivate
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {productName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The product will be hidden from active inventory and cannot receive
              new stock movements. Its quantity, ledger entries, and history are
              preserved. You can reactivate it at any time.
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
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              {isPending ? "Archiving…" : "Archive product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

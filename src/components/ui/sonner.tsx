"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-slate-200 !bg-white !text-slate-900 !shadow-lg",
          description: "!text-slate-500",
          actionButton: "!bg-emerald-600 !text-white",
          cancelButton: "!bg-slate-100 !text-slate-600",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

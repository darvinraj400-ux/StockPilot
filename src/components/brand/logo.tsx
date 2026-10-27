import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-emerald-600" />
      <g
        fill="none"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      >
        <path d="M8.5 12.2 16 8.5l7.5 3.7L16 15.9z" />
        <path d="M8.5 16.4 16 20.1l7.5-3.7" />
        <path d="M8.5 20.6 16 24.3l7.5-3.7" />
      </g>
    </svg>
  );
}

export function Logo({
  variant = "dark",
  className,
  markClassName,
}: {
  variant?: "dark" | "light";
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span
        className={cn(
          "text-[17px] font-semibold tracking-tight",
          variant === "light" ? "text-white" : "text-slate-900",
        )}
      >
        Stock<span className="text-emerald-600">Pilot</span>
      </span>
    </span>
  );
}

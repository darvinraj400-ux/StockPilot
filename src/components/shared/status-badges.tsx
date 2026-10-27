import { Badge } from "@/components/ui/badge";
import {
  MOVEMENT_TYPE_LABELS,
  STOCK_STATUS_LABELS,
  type MovementType,
  type StockStatus,
} from "@/lib/inventory";

const stockVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "destructive",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return <Badge variant={stockVariant[status]}>{STOCK_STATUS_LABELS[status]}</Badge>;
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "outline" : "muted"}>
      {active ? "Active" : "Archived"}
    </Badge>
  );
}

const movementVariant: Record<MovementType, "success" | "destructive" | "muted"> = {
  stock_in: "success",
  stock_out: "destructive",
  adjustment: "muted",
};

export function MovementTypeBadge({ type }: { type: MovementType }) {
  return <Badge variant={movementVariant[type]}>{MOVEMENT_TYPE_LABELS[type]}</Badge>;
}

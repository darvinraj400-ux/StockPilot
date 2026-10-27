import "server-only";

import { requireUser } from "@/lib/auth";
import { handleQueryError } from "@/lib/data/utils";
import { getProductLookupMap } from "@/lib/data/movements";
import type { MovementWithProduct } from "@/lib/data/movements";
import type { StockMovement } from "@/types/database";

export type DashboardSummary = {
  total_active_products: number;
  inventory_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
};

export type InventoryAlert = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  quantity_on_hand: number;
  reorder_level: number;
  cost_price: number;
};

export type MovementSeriesPoint = {
  day: string;
  stock_in: number;
  stock_out: number;
  net: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  alerts: InventoryAlert[];
  series: MovementSeriesPoint[];
  recentMovements: MovementWithProduct[];
};

const EMPTY_SUMMARY: DashboardSummary = {
  total_active_products: 0,
  inventory_value: 0,
  low_stock_count: 0,
  out_of_stock_count: 0,
};

export async function getDashboardData(): Promise<DashboardData> {
  const { supabase, user } = await requireUser();

  const [summaryResult, alertsResult, seriesResult, movementsResult] =
    await Promise.all([
      supabase.rpc("get_dashboard_summary"),
      supabase.rpc("get_inventory_alerts", { p_limit: 8 }),
      supabase.rpc("get_daily_movement_series", { p_days: 14 }),
      supabase
        .from("stock_movements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(8),
    ]);

  handleQueryError(summaryResult.error, "dashboard metrics");
  handleQueryError(alertsResult.error, "inventory alerts");
  handleQueryError(seriesResult.error, "movement chart");
  handleQueryError(movementsResult.error, "recent stock movements");

  const rawSummary = summaryResult.data?.[0];

  const summary: DashboardSummary = rawSummary
    ? {
        total_active_products: Number(rawSummary.total_active_products),
        inventory_value: Number(rawSummary.inventory_value),
        low_stock_count: Number(rawSummary.low_stock_count),
        out_of_stock_count: Number(rawSummary.out_of_stock_count),
      }
    : EMPTY_SUMMARY;

  const alerts: InventoryAlert[] = (alertsResult.data ?? []).map((alert) => ({
    ...alert,
    quantity_on_hand: Number(alert.quantity_on_hand),
    reorder_level: Number(alert.reorder_level),
    cost_price: Number(alert.cost_price),
  }));

  const series: MovementSeriesPoint[] = (seriesResult.data ?? []).map(
    (point) => ({
      day: point.day,
      stock_in: Number(point.stock_in),
      stock_out: Number(point.stock_out),
      net: Number(point.net),
    }),
  );

  const movements = (movementsResult.data ?? []) as StockMovement[];
  const productMap = await getProductLookupMap(
    movements.map((movement) => movement.product_id),
    supabase,
    user.id,
  );

  return {
    summary,
    alerts,
    series,
    recentMovements: movements.map((movement) => ({
      ...movement,
      product: productMap.get(movement.product_id) ?? null,
    })),
  };
}

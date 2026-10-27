export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StockMovementType = "stock_in" | "stock_out" | "adjustment";

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          supplier_id: string | null;
          sku: string;
          name: string;
          description: string | null;
          unit: string;
          cost_price: number;
          selling_price: number;
          quantity_on_hand: number;
          reorder_level: number;
          is_active: boolean;
          needs_reorder: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          supplier_id?: string | null;
          sku: string;
          name: string;
          description?: string | null;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          quantity_on_hand?: number;
          reorder_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          sku?: string;
          name?: string;
          description?: string | null;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          reorder_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          movement_type: StockMovementType;
          quantity_delta: number;
          quantity_before: number;
          quantity_after: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          movement_type: StockMovementType;
          quantity_delta: number;
          quantity_before: number;
          quantity_after: number;
          note?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_dashboard_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_active_products: number;
          inventory_value: number;
          low_stock_count: number;
          out_of_stock_count: number;
        }[];
      };
      get_inventory_alerts: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          name: string;
          sku: string;
          unit: string;
          quantity_on_hand: number;
          reorder_level: number;
          cost_price: number;
        }[];
      };
      get_daily_movement_series: {
        Args: { p_days?: number };
        Returns: {
          day: string;
          stock_in: number;
          stock_out: number;
          net: number;
        }[];
      };
      get_category_product_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          category_id: string;
          active_product_count: number;
        }[];
      };
      get_supplier_product_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          supplier_id: string;
          active_product_count: number;
        }[];
      };
      record_stock_movement: {
        Args: {
          p_product_id: string;
          p_movement_type: StockMovementType;
          p_quantity_delta: number;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["stock_movements"]["Row"];
      };
    };
    Enums: {
      stock_movement_type: StockMovementType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type StockMovement =
  Database["public"]["Tables"]["stock_movements"]["Row"];

import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";

import type { Database, Product } from "@/types/database";

const url =
  process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key =
  process.env.SUPABASE_TEST_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

const localHost = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(url);
const allowRemote = process.env.SUPABASE_TEST_ALLOW_REMOTE === "1";

if (url && key && !localHost && !allowRemote) {
  throw new Error(
    "Refusing to run destructive integration tests against a non-local Supabase URL. " +
      "Set SUPABASE_TEST_ALLOW_REMOTE=1 only for a disposable project.",
  );
}

const enabled = Boolean(url && key);
const password = "StockPilot!2345";
const runId = randomUUID().slice(0, 8);

function createTestClient() {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function signUp(
  client: SupabaseClient<Database>,
  label: string,
): Promise<{ email: string; userId: string }> {
  const email = `qa-${label}-${runId}@example.com`;
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: `QA ${label}` } },
  });

  if (error) throw new Error(`Signup failed: ${error.message}`);
  if (!data.session || !data.user) {
    throw new Error(
      "Signup did not return a session. This suite expects a disposable local " +
        "Supabase stack with email confirmations disabled.",
    );
  }

  return { email, userId: data.user.id };
}

async function createProduct(
  client: SupabaseClient<Database>,
  values: {
    userId: string;
    categoryId: string | null;
    supplierId: string | null;
    reorderLevel?: number;
    costPrice?: number;
  },
): Promise<Product> {
  const sku = `SKU-${randomUUID().slice(0, 12)}`;
  const { data, error } = await client
    .from("products")
    .insert({
      user_id: values.userId,
      category_id: values.categoryId,
      supplier_id: values.supplierId,
      sku,
      name: `QA product ${sku}`,
      unit: "unit",
      cost_price: values.costPrice ?? 2,
      selling_price: 3,
      reorder_level: values.reorderLevel ?? 10,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Create product failed: ${error.message}`);
  return data;
}

async function readQuantity(
  client: SupabaseClient<Database>,
  productId: string,
): Promise<number> {
  const { data, error } = await client
    .from("products")
    .select("quantity_on_hand")
    .eq("id", productId)
    .single();

  if (error) throw new Error(`Read product failed: ${error.message}`);
  return data.quantity_on_hand;
}

async function movementCount(
  client: SupabaseClient<Database>,
  productId: string,
): Promise<number> {
  const { count, error } = await client
    .from("stock_movements")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) throw new Error(`Count movements failed: ${error.message}`);
  return count ?? 0;
}

const describeIntegration = enabled ? describe : describe.skip;

describeIntegration("local Supabase integration", () => {
  let userA: SupabaseClient<Database>;
  let userB: SupabaseClient<Database>;
  let a: { email: string; userId: string };
  let b: { email: string; userId: string };
  let categoryA: string;
  let supplierA: string;

  beforeAll(async () => {
    userA = createTestClient();
    userB = createTestClient();
    a = await signUp(userA, "a");
    b = await signUp(userB, "b");

    const { data: category, error: categoryError } = await userA
      .from("categories")
      .insert({ user_id: a.userId, name: `QA category ${runId}` })
      .select("id")
      .single();
    if (categoryError) throw new Error(categoryError.message);
    categoryA = category.id;

    const { data: supplier, error: supplierError } = await userA
      .from("suppliers")
      .insert({ user_id: a.userId, name: `QA supplier ${runId}` })
      .select("id")
      .single();
    if (supplierError) throw new Error(supplierError.message);
    supplierA = supplier.id;
  });

  it("creates products at zero stock and enforces tenant-safe uniqueness", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    expect(product.quantity_on_hand).toBe(0);

    const duplicate = await userA.from("products").insert({
      user_id: a.userId,
      category_id: categoryA,
      supplier_id: supplierA,
      sku: product.sku.toLowerCase(),
      name: "Duplicate SKU",
      unit: "unit",
    });

    expect(duplicate.error?.code).toBe("23505");

    const { data: categoryB, error: categoryBError } = await userB
      .from("categories")
      .insert({ user_id: b.userId, name: `QA category B ${runId}` })
      .select("id")
      .single();
    expect(categoryBError).toBeNull();

    const crossTenantRelation = await userB.from("products").insert({
      user_id: b.userId,
      category_id: categoryA,
      supplier_id: null,
      sku: `SKU-${randomUUID().slice(0, 12)}`,
      name: "Cross-tenant category",
      unit: "unit",
    });

    expect(crossTenantRelation.error?.code).toBe("23503");
    expect(categoryB?.id).toBeTruthy();
  });

  it("records stock in and out with correct ledger snapshots", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    const stockIn = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 10,
      p_note: "Initial receipt",
    });

    expect(stockIn.error).toBeNull();
    expect(stockIn.data?.quantity_before).toBe(0);
    expect(stockIn.data?.quantity_after).toBe(10);
    expect(await readQuantity(userA, product.id)).toBe(10);

    const stockOut = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_out",
      p_quantity_delta: -3,
      p_note: "Customer shipment",
    });

    expect(stockOut.error).toBeNull();
    expect(stockOut.data?.quantity_before).toBe(10);
    expect(stockOut.data?.quantity_after).toBe(7);
    expect(await readQuantity(userA, product.id)).toBe(7);
    expect(await movementCount(userA, product.id)).toBe(2);
  });

  it("rejects invalid movements and rolls back failed adjustments", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    const initial = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 5,
      p_note: "Opening stock",
    });
    expect(initial.error).toBeNull();

    const overIssue = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_out",
      p_quantity_delta: -100,
      p_note: null,
    });
    expect(overIssue.error?.message).toContain("Insufficient stock");

    const invertedIn = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: -1,
      p_note: null,
    });
    expect(invertedIn.error?.message).toContain("Stock-in quantity");

    const invertedOut = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_out",
      p_quantity_delta: 1,
      p_note: null,
    });
    expect(invertedOut.error?.message).toContain("Stock-out quantity");

    const zero = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "adjustment",
      p_quantity_delta: 0,
      p_note: "No change",
    });
    expect(zero.error?.message).toContain("non-zero");

    const missingReason = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "adjustment",
      p_quantity_delta: -1,
      p_note: null,
    });
    expect(missingReason.error?.message).toContain(
      "stock_movements_adjustment_reason",
    );

    expect(await readQuantity(userA, product.id)).toBe(5);
    expect(await movementCount(userA, product.id)).toBe(1);

    const validAdjustment = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "adjustment",
      p_quantity_delta: -2,
      p_note: "Cycle count correction",
    });
    expect(validAdjustment.error).toBeNull();
    expect(validAdjustment.data?.quantity_before).toBe(5);
    expect(validAdjustment.data?.quantity_after).toBe(3);
    expect(await readQuantity(userA, product.id)).toBe(3);
  });

  it("blocks direct quantity and movement writes through the API", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    const session = await userA.auth.getSession();
    const accessToken = session.data.session?.access_token;
    expect(accessToken).toBeTruthy();

    const headers = {
      apikey: key,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      prefer: "return=representation",
    };

    const quantityPatch = await fetch(
      `${url}/rest/v1/products?id=eq.${product.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ quantity_on_hand: 99 }),
      },
    );
    expect(quantityPatch.ok).toBe(false);

    const movementInsert = await userA.from("stock_movements").insert({
      user_id: a.userId,
      product_id: product.id,
      movement_type: "stock_in",
      quantity_delta: 5,
      quantity_before: 0,
      quantity_after: 5,
      note: "Bypass attempt",
    });
    expect(movementInsert.error).not.toBeNull();

    const movementPatch = await fetch(
      `${url}/rest/v1/stock_movements?id=eq.${randomUUID()}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ note: "tampered" }),
      },
    );
    expect(movementPatch.ok).toBe(false);

    const movementDelete = await fetch(
      `${url}/rest/v1/stock_movements?id=eq.${randomUUID()}`,
      { method: "DELETE", headers },
    );
    expect(movementDelete.ok).toBe(false);

    expect(await readQuantity(userA, product.id)).toBe(0);
    expect(await movementCount(userA, product.id)).toBe(0);
  });

  it("isolates products and ledger data between tenants", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 4,
      p_note: "Tenant isolation fixture",
    });

    const bProductRead = await userB
      .from("products")
      .select("*")
      .eq("id", product.id);
    expect(bProductRead.error).toBeNull();
    expect(bProductRead.data).toEqual([]);

    const bUpdate = await userB
      .from("products")
      .update({ name: "Hijacked" })
      .eq("id", product.id)
      .select("id");
    expect(bUpdate.error).toBeNull();
    expect(bUpdate.data).toEqual([]);

    const bMovementRead = await userB
      .from("stock_movements")
      .select("*")
      .eq("product_id", product.id);
    expect(bMovementRead.error).toBeNull();
    expect(bMovementRead.data).toEqual([]);

    const bMovement = await userB.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 1,
      p_note: "Cross-tenant attempt",
    });
    expect(bMovement.error?.message).toContain("Product not found");

    const bCategoryRead = await userB
      .from("categories")
      .select("id")
      .eq("id", categoryA);
    expect(bCategoryRead.data).toEqual([]);

    const anon = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const anonRpc = await anon.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 1,
      p_note: "Anonymous attempt",
    });
    expect(anonRpc.error).not.toBeNull();

    expect(await readQuantity(userA, product.id)).toBe(4);
    expect(await movementCount(userA, product.id)).toBe(1);
  });

  it("rejects movements for archived products and permits reactivation", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    const archived = await userA
      .from("products")
      .update({ is_active: false })
      .eq("id", product.id)
      .select("id")
      .single();
    expect(archived.error).toBeNull();

    const blocked = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 1,
      p_note: "Archived attempt",
    });
    expect(blocked.error?.message).toContain("Archived products");

    await userA
      .from("products")
      .update({ is_active: true })
      .eq("id", product.id);

    const allowed = await userA.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 1,
      p_note: "Reactivated receipt",
    });
    expect(allowed.error).toBeNull();
    expect(await readQuantity(userA, product.id)).toBe(1);
  });

  it("serializes concurrent stock updates without losing movements", async () => {
    const product = await createProduct(userA, {
      userId: a.userId,
      categoryId: categoryA,
      supplierId: supplierA,
    });

    const results = await Promise.all([
      userA.rpc("record_stock_movement", {
        p_product_id: product.id,
        p_movement_type: "stock_in",
        p_quantity_delta: 1,
        p_note: "Concurrent A",
      }),
      userA.rpc("record_stock_movement", {
        p_product_id: product.id,
        p_movement_type: "stock_in",
        p_quantity_delta: 1,
        p_note: "Concurrent B",
      }),
    ]);

    for (const result of results) {
      expect(result.error).toBeNull();
    }

    expect(await readQuantity(userA, product.id)).toBe(2);
    expect(await movementCount(userA, product.id)).toBe(2);

    const { data: movements } = await userA
      .from("stock_movements")
      .select("quantity_before, quantity_after")
      .eq("product_id", product.id)
      .order("quantity_before", { ascending: true });

    expect(movements).toEqual([
      { quantity_before: 0, quantity_after: 1 },
      { quantity_before: 1, quantity_after: 2 },
    ]);
  });

  it("reports dashboard metrics scoped to the signed-in owner", async () => {
    const userC = createTestClient();
    const c = await signUp(userC, "c");

    const product = await createProduct(userC, {
      userId: c.userId,
      categoryId: null,
      supplierId: null,
      reorderLevel: 5,
      costPrice: 2,
    });

    const empty = await userC.rpc("get_dashboard_summary");
    expect(empty.error).toBeNull();
    expect(empty.data?.[0]?.total_active_products).toBe(1);
    expect(Number(empty.data?.[0]?.inventory_value)).toBe(0);
    expect(empty.data?.[0]?.low_stock_count).toBe(1);
    expect(empty.data?.[0]?.out_of_stock_count).toBe(1);

    await userC.rpc("record_stock_movement", {
      p_product_id: product.id,
      p_movement_type: "stock_in",
      p_quantity_delta: 2,
      p_note: "Dashboard fixture",
    });

    const stocked = await userC.rpc("get_dashboard_summary");
    expect(Number(stocked.data?.[0]?.inventory_value)).toBe(4);
    expect(stocked.data?.[0]?.out_of_stock_count).toBe(0);
    expect(stocked.data?.[0]?.low_stock_count).toBe(1);

    const bSummary = await userB.rpc("get_dashboard_summary");
    expect(bSummary.error).toBeNull();
    expect(bSummary.data?.[0]?.total_active_products).toBe(0);
  });

  it("signs in with valid credentials and rejects invalid ones", async () => {
    const authClient = createTestClient();

    const invalid = await authClient.auth.signInWithPassword({
      email: a.email,
      password: "wrong-password-123",
    });
    expect(invalid.error).not.toBeNull();

    const valid = await authClient.auth.signInWithPassword({
      email: a.email,
      password,
    });
    expect(valid.error).toBeNull();
    expect(valid.data.session?.user.id).toBe(a.userId);

    const { error: signOutError } = await authClient.auth.signOut();
    expect(signOutError).toBeNull();
    expect((await authClient.auth.getUser()).data.user).toBeNull();
  });
});

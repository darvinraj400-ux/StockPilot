import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/products/product-form";
import { getProductFormOptions } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "New product",
};

export default async function NewProductPage() {
  const { categories, suppliers } = await getProductFormOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New product"
        description="Add a product to your catalog. New products start with zero stock — record a movement to receive units."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products", href: "/products" },
          { label: "New product" },
        ]}
      />
      <ProductForm mode="create" categories={categories} suppliers={suppliers} />
    </div>
  );
}

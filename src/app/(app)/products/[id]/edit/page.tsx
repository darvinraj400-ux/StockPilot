import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ProductForm } from "@/components/products/product-form";
import {
  getProductDetail,
  getProductFormOptions,
} from "@/lib/data/products";
import { isUuid } from "@/lib/search";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function EditProductPage({
  params,
}: PageProps<"/products/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const [detail, options] = await Promise.all([
    getProductDetail(id),
    getProductFormOptions(),
  ]);

  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${detail.product.name}`}
        description="Update catalog details and pricing. Stock quantity is controlled separately by recorded movements."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Products", href: "/products" },
          { label: detail.product.name, href: `/products/${detail.product.id}` },
          { label: "Edit" },
        ]}
      />
      <ProductForm
        mode="edit"
        product={detail.product}
        categories={options.categories}
        suppliers={options.suppliers}
      />
    </div>
  );
}

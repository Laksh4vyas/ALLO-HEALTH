"use client";

import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/products/product-card";
import { ProductCardSkeleton } from "@/components/products/product-card-skeleton";
import { Package, RefreshCw, AlertCircle, TrendingUp, Warehouse, ShoppingBag } from "lucide-react";

export default function ProductsPage() {
  const { data: products, isLoading, isError, refetch, isFetching } = useProducts();

  const totalAvailable = products?.reduce(
    (sum: number, p: { totalAvailable: number }) => sum + p.totalAvailable, 0
  ) ?? 0;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs text-violet-400 font-medium">
                  Real-time Inventory
                </span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Product{" "}
                <span className="gradient-text">Inventory</span>
              </h1>
              <p className="text-white/40 text-lg">
                Reserve products across Mumbai, Delhi & Bangalore warehouses
              </p>
            </div>

            {/* Stats row */}
            {!isLoading && products && (
              <div className="flex gap-4">
                <div className="glass rounded-2xl p-4 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ShoppingBag className="w-4 h-4 text-violet-400" />
                    <span className="text-2xl font-bold text-white">
                      {products.length}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">Products</span>
                </div>
                <div className="glass rounded-2xl p-4 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-2xl font-bold text-emerald-400">
                      {totalAvailable}
                    </span>
                  </div>
                  <span className="text-xs text-white/40">Available</span>
                </div>
                <div className="glass rounded-2xl p-4 text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Warehouse className="w-4 h-4 text-indigo-400" />
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <span className="text-xs text-white/40">Warehouses</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-white/40 text-sm">
            {isLoading
              ? "Loading products..."
              : `${products?.length ?? 0} products found`}
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 border border-white/5 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Failed to load products
            </h3>
            <p className="text-white/40 text-sm mb-6">
              Check your database connection and try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && products?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No products found
            </h3>
            <p className="text-white/40 text-sm">
              Run <code className="text-violet-300">npm run seed</code> to populate the database.
            </p>
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products?.map(
                (product: Parameters<typeof ProductCard>[0]["product"]) => (
                  <ProductCard key={product.id} product={product} />
                )
              )}
        </div>
      </div>
    </div>
  );
}

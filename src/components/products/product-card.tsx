"use client";

import { useState } from "react";
import { ReserveDialog } from "./reserve-dialog";
import { Package, MapPin, TrendingDown } from "lucide-react";

interface WarehouseStock {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  totalQuantity: number;
  reservedQuantity: number;
  available: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  warehouses: WarehouseStock[];
  totalAvailable: number;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    warehouse?: WarehouseStock;
  }>({ open: false });

  const isOutOfStock = product.totalAvailable === 0;

  return (
    <>
      <div className="group relative glass rounded-2xl overflow-hidden card-hover gradient-border">
        {/* Product Image */}
        <div className="relative h-52 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />

          {/* Stock badge */}
          <div className="absolute top-3 right-3">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 border border-red-500/40 text-red-400">
                Out of Stock
              </span>
            ) : product.totalAvailable <= 5 ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 border border-amber-500/40 text-amber-400">
                Only {product.totalAvailable} left
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-5">
          <h3 className="font-bold text-white text-lg leading-tight mb-1.5">
            {product.name}
          </h3>
          <p className="text-white/40 text-sm leading-relaxed mb-4 line-clamp-2">
            {product.description}
          </p>

          {/* Total Available Summary */}
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-white/50">
              <span className="font-semibold text-white">
                {product.totalAvailable}
              </span>{" "}
              units available across all warehouses
            </span>
          </div>

          {/* Warehouse Inventory Table */}
          <div className="space-y-2">
            {product.warehouses.map((wh) => (
              <div
                key={wh.warehouseId}
                className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/80 truncate">
                      {wh.warehouseName}
                    </p>
                    <p className="text-[11px] text-white/30 truncate">
                      {wh.warehouseLocation}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        wh.available === 0
                          ? "text-red-400"
                          : wh.available <= 3
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {wh.available}
                    </span>
                    <span className="text-[11px] text-white/30 ml-1">avail</span>
                  </div>

                  {wh.reservedQuantity > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-white/30">
                      <TrendingDown className="w-3 h-3" />
                      <span>{wh.reservedQuantity} rsvd</span>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setDialogState({ open: true, warehouse: wh })
                    }
                    disabled={wh.available === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Reserve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {dialogState.open && dialogState.warehouse && (
        <ReserveDialog
          isOpen={dialogState.open}
          onClose={() => setDialogState({ open: false })}
          product={product}
          warehouse={dialogState.warehouse}
        />
      )}
    </>
  );
}

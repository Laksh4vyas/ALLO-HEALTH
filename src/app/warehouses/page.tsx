"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWarehouses } from "@/lib/api-client";
import { MapPin, Package, Clock, Warehouse, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function WarehousesPage() {
  const { data: warehouses, isLoading, isError } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Warehouse className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium">Distribution Centers</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Warehouse{" "}
            <span className="gradient-text">Network</span>
          </h1>
          <p className="text-white/40 text-lg">
            3 strategic locations across India for fast delivery
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-white">Failed to load warehouses</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl h-48 shimmer" />
              ))
            : warehouses?.map(
                (wh: {
                  id: string;
                  name: string;
                  location: string;
                  createdAt: string;
                  _count: { inventories: number; reservations: number };
                }) => (
                  <div
                    key={wh.id}
                    className="glass rounded-2xl border border-white/10 p-6 card-hover gradient-border"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                      <Warehouse className="w-6 h-6 text-indigo-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1">
                      {wh.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/40 text-sm mb-5">
                      <MapPin className="w-3.5 h-3.5" />
                      {wh.location}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                        <Package className="w-4 h-4 text-violet-400 mx-auto mb-1" />
                        <p className="text-xl font-bold text-white">
                          {wh._count.inventories}
                        </p>
                        <p className="text-xs text-white/30">Products</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                        <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xl font-bold text-white">
                          {wh._count.reservations}
                        </p>
                        <p className="text-xs text-white/30">Reservations</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-white/25">
                        Active since{" "}
                        {format(new Date(wh.createdAt), "MMM yyyy")}
                      </p>
                    </div>
                  </div>
                )
              )}
        </div>
      </div>
    </div>
  );
}

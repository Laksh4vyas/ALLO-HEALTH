"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createReservation } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ShoppingCart,
  Package,
  MapPin,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
} from "lucide-react";
import axios from "axios";

interface ReserveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
  warehouse: {
    warehouseId: string;
    warehouseName: string;
    warehouseLocation: string;
    available: number;
  };
}

export function ReserveDialog({
  isOpen,
  onClose,
  product,
  warehouse,
}: ReserveDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createReservation({
        productId: product.id,
        warehouseId: warehouse.warehouseId,
        quantity,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Reservation created! Redirecting to checkout...");
      onClose();
      router.push(`/checkout/${data.reservationId}`);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const msg = error.response?.data?.error;
        if (status === 409) {
          toast.error("Not enough stock available.");
        } else {
          toast.error(msg || "Failed to create reservation.");
        }
      } else {
        toast.error("Something went wrong.");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{product.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-sm text-white/50">
                  {warehouse.warehouseName}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-white/30 hover:text-white/70 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Stock Info */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5 mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/60">Available Stock</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">
              {warehouse.available} units
            </span>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              Select Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-xl font-bold text-white countdown-digit">
                  {quantity}
                </span>
              </div>
              <button
                onClick={() =>
                  setQuantity(Math.min(warehouse.available, quantity + 1))
                }
                disabled={quantity >= warehouse.available}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Warning for low stock */}
          {warehouse.available <= 3 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                Only {warehouse.available} units left — reserve fast!
              </p>
            </div>
          )}

          {/* Timer warning */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-6">
            <span className="text-xs text-violet-300">
              🕐 Your reservation will be held for{" "}
              <strong>10 minutes</strong>. Complete checkout before it expires.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || warehouse.available === 0}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {mutation.isPending ? "Reserving..." : "Reserve Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

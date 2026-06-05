"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReservation, useConfirmReservation, useReleaseReservation } from "@/hooks/use-reservation";
import { toast } from "sonner";
import axios from "axios";
import {
  Clock,
  Package,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  ShoppingBag,
  Warehouse,
  Hash,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

function useCountdown(expiresAt: string | null, status: string) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt || status !== "PENDING") return;

    const calc = () =>
      Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    setSecondsLeft(calc());
    const interval = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return { secondsLeft, minutes, seconds };
}

function CountdownDisplay({ minutes, seconds }: { minutes: number; seconds: number }) {
  const m = String(minutes).padStart(2, "0");
  const s = String(seconds).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Minutes */}
      <div className="text-center">
        <div className="flex gap-1">
          {m.split("").map((d, i) => (
            <div
              key={i}
              className="w-16 h-20 glass rounded-2xl border border-white/10 flex items-center justify-center"
            >
              <span className="text-5xl font-bold countdown-digit text-white">
                {d}
              </span>
            </div>
          ))}
        </div>
        <span className="text-xs text-white/30 mt-2 block">MINUTES</span>
      </div>

      <div className="text-4xl font-bold text-white/30 countdown-digit mb-4">:</div>

      {/* Seconds */}
      <div className="text-center">
        <div className="flex gap-1">
          {s.split("").map((d, i) => (
            <div
              key={i}
              className="w-16 h-20 glass rounded-2xl border border-white/10 flex items-center justify-center"
            >
              <span className="text-5xl font-bold countdown-digit text-white">
                {d}
              </span>
            </div>
          ))}
        </div>
        <span className="text-xs text-white/30 mt-2 block">SECONDS</span>
      </div>
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 scale-110 pulse-ring" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-400 mb-1">
            Purchase Confirmed!
          </h2>
          <p className="text-white/40 text-sm">
            Your order has been placed successfully. Thank you!
          </p>
        </div>
      </div>
    );
  }

  if (status === "RELEASED") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-1">
            Reservation Cancelled
          </h2>
          <p className="text-white/40 text-sm">
            Stock has been returned to the warehouse.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.reservationId as string;

  const { data: reservation, isLoading, isError } = useReservation(id);
  const confirmMutation = useConfirmReservation();
  const releaseMutation = useReleaseReservation();

  const { secondsLeft, minutes, seconds } = useCountdown(
    reservation?.expiresAt ?? null,
    reservation?.status ?? ""
  );

  const isExpired = reservation?.status === "PENDING" && secondsLeft === 0;
  const isPending = reservation?.status === "PENDING" && !isExpired;
  const isTerminal =
    reservation?.status === "CONFIRMED" || reservation?.status === "RELEASED";

  const handleConfirm = async () => {
    try {
      const idempotencyKey = `confirm-${id}-${Date.now()}`;
      await confirmMutation.mutateAsync({ id, idempotencyKey });
      toast.success("Purchase confirmed successfully!");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 410) {
          toast.error("Reservation expired. Please start a new reservation.");
        } else {
          toast.error(error.response?.data?.error || "Failed to confirm.");
        }
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const handleRelease = async () => {
    try {
      await releaseMutation.mutateAsync(id);
      toast.info("Reservation cancelled. Stock has been returned.");
    } catch {
      toast.error("Failed to cancel reservation.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white/40">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (isError || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Reservation Not Found
          </h2>
          <p className="text-white/40 text-sm mb-6">
            This reservation does not exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-500/30 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const urgencyColor =
    secondsLeft <= 60
      ? "border-red-500/40 text-red-400"
      : secondsLeft <= 180
      ? "border-amber-500/40 text-amber-400"
      : "border-violet-500/40 text-violet-400";

  return (
    <div className="min-h-screen">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        {/* Page title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-400 font-medium">Checkout</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Complete Your{" "}
            <span className="gradient-text">Purchase</span>
          </h1>
        </div>

        <div className="space-y-4">
          {/* Status banner for terminal states */}
          {isTerminal && (
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              <StatusBanner status={reservation.status} />
            </div>
          )}

          {/* Expired warning */}
          {isExpired && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400">
                  Reservation Expired
                </p>
                <p className="text-xs text-red-400/70 mt-0.5">
                  This reservation has expired. Please go back and create a new one.
                </p>
              </div>
            </div>
          )}

          {/* Countdown Timer — only show for PENDING */}
          {isPending && (
            <div
              className={`glass rounded-2xl border overflow-hidden ${urgencyColor}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Clock className="w-5 h-5 opacity-70" />
                  <span className="text-sm font-medium opacity-70">
                    Reservation expires in
                  </span>
                </div>
                <CountdownDisplay minutes={minutes} seconds={seconds} />

                {secondsLeft <= 60 && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-red-400 animate-pulse">
                      ⚠️ Hurry! Your reservation is about to expire
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reservation Details */}
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                Reservation Details
              </h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Product */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reservation.productImageUrl}
                    alt={reservation.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Product
                  </p>
                  <p className="font-bold text-white">{reservation.productName}</p>
                  <p className="text-xs text-white/40 mt-1 line-clamp-1">
                    {reservation.productDescription}
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5" />
                    Warehouse
                  </p>
                  <p className="font-semibold text-white text-sm">
                    {reservation.warehouseName}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {reservation.warehouseLocation}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    Quantity
                  </p>
                  <p className="text-2xl font-bold text-white countdown-digit">
                    {reservation.quantity}
                  </p>
                  <p className="text-xs text-white/30">units reserved</p>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-white/40 mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      reservation.status === "PENDING"
                        ? "status-pending"
                        : reservation.status === "CONFIRMED"
                        ? "status-confirmed"
                        : "status-released"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {reservation.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Expires At
                  </p>
                  <p className="text-xs font-medium text-white">
                    {format(new Date(reservation.expiresAt), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-white/30">
                    {format(new Date(reservation.expiresAt), "HH:mm:ss")}
                  </p>
                </div>
              </div>

              {/* Reservation ID */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <span className="text-xs text-white/40">Reservation ID</span>
                <code className="text-xs text-violet-300 font-mono">
                  {reservation.id}
                </code>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isTerminal && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRelease}
                disabled={releaseMutation.isPending || confirmMutation.isPending || isExpired}
                className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {releaseMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {releaseMutation.isPending ? "Cancelling..." : "Cancel Reservation"}
              </button>

              <button
                onClick={handleConfirm}
                disabled={
                  confirmMutation.isPending ||
                  releaseMutation.isPending ||
                  isExpired
                }
                className="h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
              >
                {confirmMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {confirmMutation.isPending ? "Confirming..." : "Confirm Purchase"}
              </button>
            </div>
          )}

          {/* Back to products for terminal states */}
          {isTerminal && (
            <button
              onClick={() => router.push("/")}
              className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-medium flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

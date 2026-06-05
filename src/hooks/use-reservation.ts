"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReservation,
  confirmReservation,
  releaseReservation,
} from "@/lib/api-client";

export function useReservation(id: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => fetchReservation(id),
    refetchInterval: 5000,
    enabled: !!id,
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      idempotencyKey,
    }: {
      id: string;
      idempotencyKey?: string;
    }) => confirmReservation(id, idempotencyKey),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useReleaseReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => releaseReservation(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["reservation", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

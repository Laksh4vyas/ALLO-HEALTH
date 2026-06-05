"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api-client";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    refetchInterval: 30000,
  });
}

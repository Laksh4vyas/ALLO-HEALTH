import { prisma } from "@/lib/prisma";

export async function getAllWarehouses() {
  return prisma.warehouse.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { inventories: true, reservations: true },
      },
    },
  });
}

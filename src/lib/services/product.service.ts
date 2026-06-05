import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

// Use Prisma's built-in type inference for the included relations
type ProductWithInventories = Awaited<
  ReturnType<PrismaClient["product"]["findMany"]>
>[number] & {
  inventories: (Awaited<
    ReturnType<PrismaClient["inventory"]["findMany"]>
  >[number] & {
    warehouse: Awaited<
      ReturnType<PrismaClient["warehouse"]["findUnique"]>
    >;
  })[];
};

export async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return products.map((product: ProductWithInventories) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    createdAt: product.createdAt,
    warehouses: product.inventories.map((inv) => ({
      inventoryId: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse!.name,
      warehouseLocation: inv.warehouse!.location,
      totalQuantity: inv.totalQuantity,
      reservedQuantity: inv.reservedQuantity,
      available: inv.totalQuantity - inv.reservedQuantity,
    })),
    totalAvailable: product.inventories.reduce(
      (sum: number, inv) => sum + (inv.totalQuantity - inv.reservedQuantity),
      0
    ),
  }));
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventories: {
        include: { warehouse: true },
      },
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    warehouses: product.inventories.map((inv) => ({
      inventoryId: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseLocation: inv.warehouse.location,
      totalQuantity: inv.totalQuantity,
      reservedQuantity: inv.reservedQuantity,
      available: inv.totalQuantity - inv.reservedQuantity,
    })),
  };
}

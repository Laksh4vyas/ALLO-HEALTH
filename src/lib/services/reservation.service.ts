import { prisma } from "@/lib/prisma";
import { CreateReservationInput } from "@/lib/validators/reservation";
import { PrismaClient, ReservationStatus } from "@prisma/client";

// Prisma 7 transaction client type
type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

// Type for idempotency response storage — cast through unknown to satisfy Prisma's Json type
type AnyJson = Record<string, unknown>;

const RESERVATION_DURATION_MINUTES = 10;

export async function createReservation(
  input: CreateReservationInput,
  idempotencyKey?: string,
  endpoint?: string
) {
  // Check idempotency
  if (idempotencyKey && endpoint) {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key_endpoint: { key: idempotencyKey, endpoint } },
    });
    if (existing) {
      return { idempotent: true, data: existing.response };
    }
  }

  const expiresAt = new Date(
    Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000
  );

  // Use raw SQL transaction with SELECT FOR UPDATE for row-level locking.
  // This prevents race conditions: two concurrent requests for the last unit
  // will serialize at the DB level — one gets the lock, increments reservedQuantity,
  // and commits; the other then reads the updated row and sees 0 available stock.
  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    // Acquire exclusive row lock on the inventory row
    const inventories = await tx.$queryRaw<
      {
        id: string;
        total_quantity: number;
        reserved_quantity: number;
      }[]
    >`
      SELECT id, total_quantity, reserved_quantity
      FROM "Inventory"
      WHERE product_id = ${input.productId}
        AND warehouse_id = ${input.warehouseId}
      FOR UPDATE
    `;

    if (inventories.length === 0) {
      throw new InventoryNotFoundError("Inventory record not found");
    }

    const inventory = inventories[0];
    const available = inventory.total_quantity - inventory.reserved_quantity;

    if (available < input.quantity) {
      throw new InsufficientStockError(
        `Only ${available} units available, but ${input.quantity} requested`
      );
    }

    // Increment reserved quantity
    await tx.$executeRaw`
      UPDATE "Inventory"
      SET reserved_quantity = reserved_quantity + ${input.quantity},
          updated_at = NOW()
      WHERE id = ${inventory.id}
    `;

    // Create the reservation
    const reservation = await tx.reservation.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        status: ReservationStatus.PENDING,
        expiresAt,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return reservation;
  });

  const responseData = {
    reservationId: result.id,
    productId: result.productId,
    productName: result.product.name,
    warehouseId: result.warehouseId,
    warehouseName: result.warehouse.name,
    quantity: result.quantity,
    status: result.status,
    expiresAt: result.expiresAt,
    createdAt: result.createdAt,
  };

  // Store idempotency key
  if (idempotencyKey && endpoint) {
    await prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        endpoint,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: responseData as any,
      },
    });
  }

  return { idempotent: false, data: responseData };
}

export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      product: true,
      warehouse: true,
    },
  });

  if (!reservation) return null;

  return {
    id: reservation.id,
    productId: reservation.productId,
    productName: reservation.product.name,
    productDescription: reservation.product.description,
    productImageUrl: reservation.product.imageUrl,
    warehouseId: reservation.warehouseId,
    warehouseName: reservation.warehouse.name,
    warehouseLocation: reservation.warehouse.location,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

export async function confirmReservation(
  id: string,
  idempotencyKey?: string,
  endpoint?: string
) {
  // Check idempotency
  if (idempotencyKey && endpoint) {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key_endpoint: { key: idempotencyKey, endpoint } },
    });
    if (existing) {
      return { idempotent: true, data: existing.response };
    }
  }

  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });

    if (!reservation) throw new ReservationNotFoundError("Reservation not found");
    if (reservation.status === ReservationStatus.CONFIRMED) {
      return reservation;
    }
    if (reservation.status === ReservationStatus.RELEASED) {
      throw new ReservationReleasedError("Reservation has been released");
    }
    if (reservation.expiresAt < new Date()) {
      throw new ReservationExpiredError("Reservation has expired");
    }

    // Atomically decrement both totalQuantity and reservedQuantity (permanent deduction)
    await tx.$executeRaw`
      UPDATE "Inventory"
      SET total_quantity = total_quantity - ${reservation.quantity},
          reserved_quantity = reserved_quantity - ${reservation.quantity},
          updated_at = NOW()
      WHERE product_id = ${reservation.productId}
        AND warehouse_id = ${reservation.warehouseId}
    `;

    const updated = await tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED },
      include: { product: true, warehouse: true },
    });

    return updated;
  });

  const responseData = {
    id: result.id,
    status: result.status,
    quantity: result.quantity,
    expiresAt: result.expiresAt,
    updatedAt: result.updatedAt,
  };

  if (idempotencyKey && endpoint) {
    await prisma.idempotencyKey.upsert({
      where: { key_endpoint: { key: idempotencyKey, endpoint } },
      update: {},
      create: {
        key: idempotencyKey,
        endpoint,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: responseData as any,
      },
    });
  }

  return { idempotent: false, data: responseData };
}

export async function releaseReservation(id: string) {
  const result = await prisma.$transaction(async (tx: TransactionClient) => {
    const reservation = await tx.reservation.findUnique({ where: { id } });

    if (!reservation) throw new ReservationNotFoundError("Reservation not found");
    if (reservation.status === ReservationStatus.RELEASED) {
      return reservation;
    }

    // Return stock to available pool
    await tx.$executeRaw`
      UPDATE "Inventory"
      SET reserved_quantity = reserved_quantity - ${reservation.quantity},
          updated_at = NOW()
      WHERE product_id = ${reservation.productId}
        AND warehouse_id = ${reservation.warehouseId}
    `;

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.RELEASED },
      include: { product: true, warehouse: true },
    });
  });

  return {
    id: result.id,
    status: result.status,
    quantity: result.quantity,
    updatedAt: result.updatedAt,
  };
}

export async function releaseExpiredReservations() {
  const expiredReservations = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
  });

  let released = 0;

  for (const reservation of expiredReservations) {
    try {
      await prisma.$transaction(async (tx: TransactionClient) => {
        await tx.$executeRaw`
          UPDATE "Inventory"
          SET reserved_quantity = reserved_quantity - ${reservation.quantity},
              updated_at = NOW()
          WHERE product_id = ${reservation.productId}
            AND warehouse_id = ${reservation.warehouseId}
        `;

        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: ReservationStatus.RELEASED },
        });
      });
      released++;
    } catch {
      console.error(`Failed to release reservation ${reservation.id}`);
    }
  }

  return { released, total: expiredReservations.length };
}

// Custom error classes
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class InventoryNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryNotFoundError";
  }
}

export class ReservationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationNotFoundError";
  }
}

export class ReservationExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationExpiredError";
  }
}

export class ReservationReleasedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReservationReleasedError";
  }
}

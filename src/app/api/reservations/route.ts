import { NextRequest } from "next/server";
import { CreateReservationSchema } from "@/lib/validators/reservation";
import {
  createReservation,
  InsufficientStockError,
  InventoryNotFoundError,
} from "@/lib/services/reservation.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateReservationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Validation error", 422);
    }

    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
    const endpoint = "POST /api/reservations";

    const result = await createReservation(parsed.data, idempotencyKey, endpoint);

    return successResponse(result.data, result.idempotent ? 200 : 201);
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return errorResponse(error.message, 409, "INSUFFICIENT_STOCK");
    }
    if (error instanceof InventoryNotFoundError) {
      return errorResponse(error.message, 404, "INVENTORY_NOT_FOUND");
    }
    console.error("[POST /api/reservations]", error);
    return errorResponse("Failed to create reservation", 500);
  }
}

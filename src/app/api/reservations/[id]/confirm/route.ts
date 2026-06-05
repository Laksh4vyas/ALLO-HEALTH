import { NextRequest } from "next/server";
import {
  confirmReservation,
  ReservationExpiredError,
  ReservationNotFoundError,
  ReservationReleasedError,
} from "@/lib/services/reservation.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idempotencyKey =
      request.headers.get("Idempotency-Key") ?? undefined;
    const endpoint = `POST /api/reservations/${id}/confirm`;

    const result = await confirmReservation(id, idempotencyKey, endpoint);
    return successResponse(result.data);
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof ReservationExpiredError) {
      return errorResponse(error.message, 410, "RESERVATION_EXPIRED");
    }
    if (error instanceof ReservationReleasedError) {
      return errorResponse(error.message, 409, "RESERVATION_RELEASED");
    }
    console.error("[POST /api/reservations/[id]/confirm]", error);
    return errorResponse("Failed to confirm reservation", 500);
  }
}

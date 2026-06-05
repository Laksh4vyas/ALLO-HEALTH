import { NextRequest } from "next/server";
import {
  getReservationById,
  ReservationNotFoundError,
} from "@/lib/services/reservation.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservation = await getReservationById(id);

    if (!reservation) {
      return errorResponse("Reservation not found", 404);
    }

    return successResponse(reservation);
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return errorResponse(error.message, 404);
    }
    console.error("[GET /api/reservations/[id]]", error);
    return errorResponse("Failed to fetch reservation", 500);
  }
}

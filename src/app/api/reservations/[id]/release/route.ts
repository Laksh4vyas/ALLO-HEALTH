import { NextRequest } from "next/server";
import {
  releaseReservation,
  ReservationNotFoundError,
} from "@/lib/services/reservation.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await releaseReservation(id);
    return successResponse(result);
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return errorResponse(error.message, 404);
    }
    console.error("[POST /api/reservations/[id]/release]", error);
    return errorResponse("Failed to release reservation", 500);
  }
}

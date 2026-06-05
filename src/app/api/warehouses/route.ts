import { getAllWarehouses } from "@/lib/services/warehouse.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const warehouses = await getAllWarehouses();
    return successResponse(warehouses);
  } catch (error) {
    console.error("[GET /api/warehouses]", error);
    return errorResponse("Failed to fetch warehouses", 500);
  }
}

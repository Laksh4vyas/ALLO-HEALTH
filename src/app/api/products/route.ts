import { getAllProducts } from "@/lib/services/product.service";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const products = await getAllProducts();
    return successResponse(products);
  } catch (error) {
    console.error("[GET /api/products]", error);
    return errorResponse("Failed to fetch products", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/services/reservation.service";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await releaseExpiredReservations();
    console.log(
      `[Cron] Released ${result.released}/${result.total} expired reservations`
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Cron] Failed to release expired reservations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to release expired reservations" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/detections
 * Returns recent detection history (most recent first). Optionally ?limit=N.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? "20")));
  try {
    const records = await db.detection.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const data = records.map((r) => ({
      id: r.id,
      imageName: r.imageName,
      objectsCount: r.objectsCount,
      damagesCount: r.damagesCount,
      severity: r.severity,
      processingMs: r.processingMs,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ items: data });
  } catch (err) {
    console.error("Failed to list detections:", err);
    return NextResponse.json(
      { error: "Failed to list detections" },
      { status: 500 },
    );
  }
}

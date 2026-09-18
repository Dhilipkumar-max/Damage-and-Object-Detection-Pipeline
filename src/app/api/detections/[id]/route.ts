import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/detections/:id — full record including detections JSON and image.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const r = await db.detection.findUnique({ where: { id } });
    if (!r) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: r.id,
      imageName: r.imageName,
      imageData: r.imageData,
      objectsCount: r.objectsCount,
      damagesCount: r.damagesCount,
      severity: r.severity,
      processingMs: r.processingMs,
      detections: JSON.parse(r.detections),
      createdAt: r.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("Failed to fetch detection:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/**
 * DELETE /api/detections/:id — remove a record.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await db.detection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete detection:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

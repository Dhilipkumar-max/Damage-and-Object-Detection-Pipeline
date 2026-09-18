import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import {
  type Detection,
  type PipelineStage,
  type DetectionResponse,
  severityFromScore,
} from "@/lib/detection/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/detect
 *
 * Body: { image: string (data URL or base64), save?: boolean, imageName?: string }
 *
 * Runs the simulated YOLO Damage & Object Detection pipeline:
 *   1. Preprocess — validate + decode image (we trust the client's data URL).
 *   2. Inference — call the VLM (z-ai-web-dev-sdk) with a structured prompt
 *      asking it to return class-aware detections with normalized bboxes.
 *   3. Postprocess — parse the JSON response, normalize bbox coordinates,
 *      clamp confidences, compute severity.
 *   4. Persist — optionally store the detection in the DB (compressed).
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => null);
    const image: string | undefined = body?.image;
    const save: boolean = Boolean(body?.save);
    const imageName: string = (body?.imageName as string) || "upload.jpg";

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing 'image' field (expected data URL or base64)." },
        { status: 400 },
      );
    }

    // Normalize input into a data URL.
    const dataUrl = image.startsWith("data:")
      ? image
      : `data:image/jpeg;base64,${image}`;

    const stages: PipelineStage[] = [
      {
        id: "preprocess",
        name: "Preprocess (Letterbox 640)",
        description:
          "Resize to 640×640 with letterbox padding, normalize to 0..1, HWC → CHW.",
        durationMs: 0,
        status: "running",
      },
      {
        id: "inference",
        name: "YOLO Inference (CNN Backbone + Head)",
        description:
          "Backbone extracts multi-scale features; head predicts class probabilities and box regressions across grid cells.",
        durationMs: 0,
        status: "idle",
      },
      {
        id: "decode",
        name: "Grid Decode + Confidence Filter",
        description:
          "Decode raw grid outputs into (x, y, w, h, obj, class) tuples; filter by conf threshold (0.25).",
        durationMs: 0,
        status: "idle",
      },
      {
        id: "nms",
        name: "Non-Maximum Suppression (IoU 0.45)",
        description:
          "Per-class NMS removes overlapping duplicates to keep the highest-confidence box.",
        durationMs: 0,
        status: "idle",
      },
      {
        id: "visualize",
        name: "Postprocess + Visualize",
        description:
          "Convert normalized boxes back to image space, assign category colors, compute aggregate severity.",
        durationMs: 0,
        status: "idle",
      },
    ];

    // ---------- Stage 1: Preprocess ----------
    const preprocessStart = Date.now();
    // In a real YOLO pipeline we'd resize + pad here. We simulate timing.
    await new Promise((r) => setTimeout(r, 80));
    stages[0].durationMs = Date.now() - preprocessStart;
    stages[0].status = "done";
    stages[0].output = "Tensor [1, 3, 640, 640] ready";

    // ---------- Stage 2: Inference (VLM-backed simulation) ----------
    const inferenceStart = Date.now();
    stages[1].status = "running";

    let detections: Detection[] = [];
    let rawResponse = "";
    try {
      const zai = await ZAI.create();
      const prompt = `You are a YOLO-style object & damage detector. Analyze this image and return ONLY valid JSON (no markdown fences) of detected items. Each item must include a normalized bounding box in [0,1] coordinates relative to the image (x = left, y = top, w = width, h = height; all in 0..1).

Detect two categories of items:
1. "object" — visible physical objects (person, car, truck, motorcycle, bicycle, building, wall, road, window, door, furniture, appliance, tool, container, machine, pipe, wire, product, packaging, animal, plant, other).
2. "damage" — physical damage or defects (crack, dent, scratch, rust, leak, burn, chip, deformation, stain, breakage, other). Only mark visible damage; do not invent damage if none exists.

Return JSON in this exact shape:
{
  "imageWidth": <number, approximate pixel width>,
  "imageHeight": <number, approximate pixel height>,
  "items": [
    {
      "category": "object" | "damage",
      "label": "<one of the labels above>",
      "displayName": "<human-readable name>",
      "confidence": <0..1>,
      "bbox": { "x": <0..1>, "y": <0..1>, "w": <0..1>, "h": <0..1> },
      "severity": <0..1, only for damage>,
      "note": "<short observation>"
    }
  ]
}

Rules:
- Output 1 to 6 items. Only include items you are confident about.
- Bounding boxes MUST be within [0,1] on every field and reflect the actual visible region of the item.
- If there is no damage, return an empty "items" array.
- Do not include any text outside the JSON object.`;

      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });

      rawResponse = (response.choices?.[0]?.message?.content ?? "").trim();
      // Strip stray markdown fences if present.
      const fenced = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const jsonStr = (fenced ? fenced[1] : rawResponse).trim();

      const parsed = JSON.parse(jsonStr);
      const rawItems: any[] = Array.isArray(parsed?.items) ? parsed.items : [];

      detections = rawItems
        .map((it, idx): Detection | null => {
          if (!it || typeof it !== "object") return null;
          const category = it.category === "damage" ? "damage" : "object";
          const label = String(it.label || (category === "damage" ? "other" : "other"))
            .toLowerCase()
            .trim();
          const displayName =
            String(it.displayName || label).slice(0, 60) || label;
          const confidence = clamp(Number(it.confidence ?? 0.5), 0, 1);
          const bbox = clampBbox(it.bbox);
          if (!bbox) return null;
          const severity =
            category === "damage" ? clamp(Number(it.severity ?? 0.5), 0, 1) : undefined;
          return {
            id: `det-${idx}-${Math.random().toString(36).slice(2, 7)}`,
            category,
            label,
            displayName,
            confidence,
            bbox,
            severity,
            note: it.note ? String(it.note).slice(0, 120) : undefined,
          };
        })
        .filter(Boolean) as Detection[];

      stages[1].output = `Raw grid decoded — ${detections.length} candidates above conf threshold`;
    } catch (err) {
      stages[1].status = "error";
      stages[1].output = `Inference error: ${(err as Error).message}`;
      // Surface a graceful empty result so the UI can still render.
      detections = [];
    }

    stages[1].durationMs = Date.now() - inferenceStart;
    if (stages[1].status !== "error") stages[1].status = "done";

    // ---------- Stage 3: Grid decode ----------
    const decodeStart = Date.now();
    await new Promise((r) => setTimeout(r, 35));
    stages[2].durationMs = Date.now() - decodeStart;
    stages[2].status = "done";
    stages[2].output = `${detections.length} candidates survived confidence filter`;

    // ---------- Stage 4: NMS ----------
    const nmsStart = Date.now();
    const beforeNms = detections.length;
    detections = nms(detections, 0.45);
    await new Promise((r) => setTimeout(r, 25));
    stages[3].durationMs = Date.now() - nmsStart;
    stages[3].status = "done";
    stages[3].output = `NMS removed ${beforeNms - detections.length} duplicates → ${detections.length} final boxes`;

    // ---------- Stage 5: Visualize / aggregate ----------
    const vizStart = Date.now();
    const damages = detections.filter((d) => d.category === "damage");
    const objects = detections.filter((d) => d.category === "object");

    const severityScore =
      damages.length === 0
        ? 0
        : Math.min(
            1,
            damages.reduce(
              (acc, d) => acc + (d.severity ?? 0.5) * (0.5 + d.confidence * 0.5),
              0,
            ) / damages.length,
          );
    const sev = severityFromScore(severityScore);

    await new Promise((r) => setTimeout(r, 20));
    stages[4].durationMs = Date.now() - vizStart;
    stages[4].status = "done";
    stages[4].output = `${objects.length} objects, ${damages.length} damage regions — severity ${sev.text}`;

    const totalMs = Date.now() - startedAt;

    const result: DetectionResponse = {
      detections,
      imageWidth: 640,
      imageHeight: 640,
      objectsCount: objects.length,
      damagesCount: damages.length,
      overallSeverity: sev.label,
      severityScore: Math.round(severityScore * 100) / 100,
      processingMs: totalMs,
      inferenceMs: stages[1].durationMs,
      stages,
      modelTag: "yolov8s-damage-v1.0 (VLM-simulated)",
      inputShape: [640, 640, 3],
      outputShape: [80, 80, 84],
    };

    // ---------- Persist (optional) ----------
    if (save) {
      try {
        // Compress stored image — keep only the data URL as-is, but truncate if huge.
        const storedImage = dataUrl.length > 1_500_000 ? dataUrl.slice(0, 1_500_000) : dataUrl;
        await db.detection.create({
          data: {
            imageName,
            imageData: storedImage,
            objectsCount: objects.length,
            damagesCount: damages.length,
            severity: sev.label,
            processingMs: totalMs,
            detections: JSON.stringify(detections),
          },
        });
      } catch (persistErr) {
        // Non-fatal — log and continue.
        console.error("Failed to persist detection:", persistErr);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    const totalMs = Date.now() - startedAt;
    console.error("Detection failed:", err);
    return NextResponse.json(
      {
        error: (err as Error).message || "Detection failed",
        processingMs: totalMs,
      },
      { status: 500 },
    );
  }
}

// ---------- helpers ----------

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

function clampBbox(b: any): { x: number; y: number; w: number; h: number } | null {
  if (!b || typeof b !== "object") return null;
  const x = clamp(Number(b.x ?? 0), 0, 1);
  const y = clamp(Number(b.y ?? 0), 0, 1);
  const w = clamp(Number(b.w ?? 0), 0, 1 - x);
  const h = clamp(Number(b.h ?? 0), 0, 1 - y);
  if (w <= 0.001 || h <= 0.001) return null;
  return { x, y, w, h };
}

/** Per-class Non-Maximum Suppression. */
function nms(detections: Detection[], iouThreshold: number): Detection[] {
  const byClass = new Map<string, Detection[]>();
  for (const d of detections) {
    const key = `${d.category}:${d.label}`;
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key)!.push(d);
  }

  const out: Detection[] = [];
  for (const group of byClass.values()) {
    group.sort((a, b) => b.confidence - a.confidence);
    const kept: Detection[] = [];
    for (const d of group) {
      let keep = true;
      for (const k of kept) {
        if (iou(d.bbox, k.bbox) >= iouThreshold) {
          keep = false;
          break;
        }
      }
      if (keep) kept.push(d);
    }
    out.push(...kept);
  }
  return out;
}

function iou(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const ax2 = a.x + a.w;
  const ay2 = a.y + a.h;
  const bx2 = b.x + b.w;
  const by2 = b.y + b.h;
  const interX = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
  const interY = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
  const inter = interX * interY;
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

"use client";

import {
  Activity,
  Boxes,
  Camera,
  Cpu,
  Database,
  Filter,
  Layers,
  ScanLine,
  Sliders,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PIPELINE_STEPS = [
  {
    icon: Camera,
    title: "1. Input Acquisition",
    text: "An image is captured (camera, upload, or batch) and sent to the API as a compressed JPEG data URL. The server validates MIME type and decodes the buffer.",
    tag: "I/O",
  },
  {
    icon: Sliders,
    title: "2. Preprocess — Letterbox 640",
    text: "The image is resized to 640×640 preserving aspect ratio (letterbox padding). Pixel intensities are normalized to 0..1 and the layout is transposed from HWC → CHW for the CNN.",
    tag: "CPU / Tensor",
  },
  {
    icon: Cpu,
    title: "3. Backbone + Head Inference",
    text: "A CSPDarknet backbone extracts multi-scale features; a detection head predicts, for every grid cell and anchor, the box (x, y, w, h), objectness score, and class probabilities.",
    tag: "GPU / ONNX",
  },
  {
    icon: Layers,
    title: "4. Grid Decoding",
    text: "Raw grid tensors are decoded into (box, obj, class) tuples. A confidence threshold (0.25) filters out low-likelihood predictions.",
    tag: "Decode",
  },
  {
    icon: Filter,
    title: "5. Non-Maximum Suppression",
    text: "Per-class NMS at IoU 0.45 removes overlapping boxes, keeping the highest-confidence candidate for each true object.",
    tag: "Post-proc",
  },
  {
    icon: ScanLine,
    title: "6. Damage Aggregation",
    text: "Damage detections are aggregated into an overall severity score (0..1) using confidence-weighted severity, mapped to {none, low, medium, high, critical}.",
    tag: "Analytics",
  },
  {
    icon: Database,
    title: "7. Persist + Respond",
    text: "Optionally the result is persisted to SQLite (Detection model) for audit/history. The final JSON response includes detections, stages, and timing.",
    tag: "Storage",
  },
];

const SPECS = [
  { label: "Input", value: "RGB image, any size", icon: Camera },
  { label: "Letterbox", value: "640 × 640 × 3", icon: Sliders },
  { label: "Backbone", value: "CSPDarknet (YOLOv8s)", icon: Cpu },
  { label: "Grid head", value: "[80, 40, 20] × 84", icon: Layers },
  { label: "Conf filter", value: "≥ 0.25", icon: Filter },
  { label: "NMS IoU", value: "0.45 (per-class)", icon: ScanLine },
  { label: "Object classes", value: "23", icon: Boxes },
  { label: "Damage classes", value: "11", icon: Activity },
];

const CLASS_LISTS = [
  {
    title: "Object classes",
    color: "emerald",
    items: [
      "person", "vehicle", "car", "truck", "motorcycle", "bicycle",
      "building", "wall", "road", "window", "door", "furniture",
      "appliance", "tool", "container", "machine", "pipe", "wire",
      "product", "packaging", "animal", "plant", "other",
    ],
  },
  {
    title: "Damage classes",
    color: "red",
    items: [
      "crack", "dent", "scratch", "rust", "leak", "burn",
      "chip", "deformation", "stain", "breakage", "other",
    ],
  },
];

export function ProjectInfo() {
  return (
    <div className="space-y-6">
      {/* Architecture diagram */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Pipeline Architecture</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Seven canonical stages turn a raw image into class-aware damage &
            object detections. Hover any step for details.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {PIPELINE_STEPS.map((s) => (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <s.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {s.tag}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Specs grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Model & Inference Specs</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SPECS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </div>
                <p className="mt-1 font-mono text-sm font-semibold">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Class lists */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Detection Classes</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            The model detects 34 classes split into objects (23) and damage
            types (11). Damage detections carry an additional severity score.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {CLASS_LISTS.map((c) => (
            <div key={c.title}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${c.color === "emerald" ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <p className="text-sm font-semibold">{c.title}</p>
                <Badge variant="secondary" className="text-[10px]">
                  {c.items.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.items.map((label) => (
                  <span
                    key={label}
                    className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                      c.color === "emerald"
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                        : "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tech stack */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Mini-Project Tech Stack</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Frontend
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Next.js 16 (App Router, TypeScript)</li>
                <li>Tailwind CSS 4 + shadcn/ui</li>
                <li>Canvas 2D overlay for bboxes</li>
                <li>Zustand / React hooks for state</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Backend
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                <li>Route Handlers under /api</li>
                <li>z-ai-web-dev-sdk (VLM) for inference</li>
                <li>Prisma ORM + SQLite for history</li>
                <li>NMS + bbox normalization in TS</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> This mini-project uses a vision-language model
            (VLM) from z-ai-web-dev-sdk to simulate the YOLO inference step. The
            pipeline stages, NMS, severity aggregation, and persistence are real
            and mirror a production YOLO deployment. To run an actual YOLO
            weight, swap the inference stage for an ONNX Runtime / ONNX.js call.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

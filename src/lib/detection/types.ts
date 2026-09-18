/**
 * Shared types and constants for the Damage & Object Detection Pipeline (YOLO).
 *
 * The "YOLO" pipeline simulated here mirrors the canonical YOLO inference flow:
 *   Input → Letterbox Resize → CNN Backbone + Head Inference → Grid Decoding
 *   → Confidence Filter → NMS → Class-aware BBoxes → Visualization.
 *
 * Real YOLO outputs dense grid tensors; the VLM-backed simulation here returns
 * a small set of high-precision class-aware detections in the same logical shape.
 */

export type DetectionCategory = "object" | "damage";

export type DamageType =
  | "crack"
  | "dent"
  | "scratch"
  | "rust"
  | "leak"
  | "burn"
  | "chip"
  | "deformation"
  | "stain"
  | "breakage"
  | "other";

export type ObjectType =
  | "person"
  | "vehicle"
  | "car"
  | "truck"
  | "motorcycle"
  | "bicycle"
  | "building"
  | "wall"
  | "road"
  | "window"
  | "door"
  | "furniture"
  | "appliance"
  | "tool"
  | "container"
  | "machine"
  | "pipe"
  | "wire"
  | "product"
  | "packaging"
  | "animal"
  | "plant"
  | "other";

export interface BoundingBox {
  /** X of top-left corner, normalized 0..1 */
  x: number;
  /** Y of top-left corner, normalized 0..1 */
  y: number;
  /** Width, normalized 0..1 */
  w: number;
  /** Height, normalized 0..1 */
  h: number;
}

export interface Detection {
  id: string;
  category: DetectionCategory;
  /** Concrete label, e.g. "car", "crack", "rust" */
  label: string;
  /** Human-readable display name */
  displayName: string;
  /** Confidence in 0..1 */
  confidence: number;
  bbox: BoundingBox;
  /** Severity in 0..1 — only meaningful for damage detections */
  severity?: number;
  /** Optional notes (e.g. observed colour, length) */
  note?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  /** Duration in ms */
  durationMs: number;
  status: "idle" | "running" | "done" | "error";
  output?: string;
}

export interface DetectionResponse {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  objectsCount: number;
  damagesCount: number;
  overallSeverity: "none" | "low" | "medium" | "high" | "critical";
  severityScore: number;
  processingMs: number;
  inferenceMs: number;
  stages: PipelineStage[];
  modelTag: string;
  inputShape: [number, number, number]; // [H, W, C]
  outputShape: [number, number, number]; // [grid_y, grid_x, anchors * (5 + nc)]
}

export const DAMAGE_LABELS: Record<DamageType, string> = {
  crack: "Crack",
  dent: "Dent",
  scratch: "Scratch",
  rust: "Rust / Corrosion",
  leak: "Leak",
  burn: "Burn / Scorch",
  chip: "Chip / Fragment",
  deformation: "Deformation",
  stain: "Stain",
  breakage: "Breakage",
  other: "Damage",
};

export const OBJECT_LABELS: Record<ObjectType, string> = {
  person: "Person",
  vehicle: "Vehicle",
  car: "Car",
  truck: "Truck",
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  building: "Building",
  wall: "Wall",
  road: "Road",
  window: "Window",
  door: "Door",
  furniture: "Furniture",
  appliance: "Appliance",
  tool: "Tool",
  container: "Container",
  machine: "Machine",
  pipe: "Pipe",
  wire: "Wire / Cable",
  product: "Product",
  packaging: "Packaging",
  animal: "Animal",
  plant: "Plant",
  other: "Object",
};

/** Color palette per category (Tailwind-friendly hex). */
export const CATEGORY_COLORS: Record<DetectionCategory, string> = {
  object: "#10b981", // emerald-500
  damage: "#ef4444", // red-500
};

/**
 * Assigns a deterministic color per detection label for canvas rendering.
 */
export function colorForLabel(label: string): string {
  const palette = [
    "#10b981", // emerald
    "#06b6d4", // cyan
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#84cc16", // lime
    "#f97316", // orange
    "#14b8a6", // teal
    "#a855f7", // purple
    "#22c55e", // green
    "#3b82f6", // blue
    "#eab308", // yellow
    "#0891b2", // sky
    "#d946ef", // fuchsia
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Computes the overall severity label from a 0..1 score.
 */
export function severityFromScore(score: number): {
  label: "none" | "low" | "medium" | "high" | "critical";
  text: string;
} {
  if (score <= 0.05) return { label: "none", text: "None" };
  if (score <= 0.25) return { label: "low", text: "Low" };
  if (score <= 0.55) return { label: "medium", text: "Medium" };
  if (score <= 0.8) return { label: "high", text: "High" };
  return { label: "critical", text: "Critical" };
}

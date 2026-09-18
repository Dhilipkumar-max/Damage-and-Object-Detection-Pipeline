"use client";

import { useEffect, useRef } from "react";
import { ImageOff } from "lucide-react";
import {
  type Detection,
} from "@/lib/detection/types";
import { drawDetections } from "@/lib/detection/image-utils";

interface DetectionCanvasProps {
  src: string | null;
  width: number;
  height: number;
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function DetectionCanvas({
  src,
  width,
  height,
  detections,
  selectedId,
  onSelect,
}: DetectionCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redraw on any change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    drawDetections(canvas, width || 1, height || 1, detections, {
      showLabels: true,
      selectedId,
    });
  }, [src, width, height, detections, selectedId]);

  // Re-draw on resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (src) {
        drawDetections(canvas, width || 1, height || 1, detections, {
          showLabels: true,
          selectedId,
        });
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [src, width, height, detections, selectedId]);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff className="h-8 w-8 opacity-60" />
          <span>No image yet — upload to run the pipeline</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(#f5f5f5_0_25%,#fafafa_0_50%)] bg-[length:20px_20px] dark:bg-[repeating-conic-gradient(#1a1a1a_0_25%,#222222_0_50%)] dark:bg-[length:20px_20px]"
    >
      <img
        ref={imgRef}
        src={src}
        alt="Detection target"
        className="block max-h-[460px] w-full object-contain"
        onLoad={() => {
          const canvas = canvasRef.current;
          if (canvas) {
            drawDetections(canvas, width || 1, height || 1, detections, {
              showLabels: true,
              selectedId,
            });
          }
        }}
      />
      <canvas
        ref={canvasRef}
        onClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          // Hit-test (approximate — assumes image fits container without letterbox on canvas).
          let hit: string | null = null;
          for (const d of detections) {
            if (
              x >= d.bbox.x &&
              x <= d.bbox.x + d.bbox.w &&
              y >= d.bbox.y &&
              y <= d.bbox.y + d.bbox.h
            ) {
              hit = d.id;
              break;
            }
          }
          onSelect(hit);
        }}
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

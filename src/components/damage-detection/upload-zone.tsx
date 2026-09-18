"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onImageSelected: (file: File) => void;
  onSampleSelected: (url: string, name: string) => void;
  isProcessing: boolean;
  samples: { url: string; name: string; thumb: string }[];
}

export function UploadZone({
  onImageSelected,
  onSampleSelected,
  isProcessing,
  samples,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    },
    [onImageSelected],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-8 text-center transition-all",
          "cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5",
          isDragging && "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-500/10",
          isProcessing && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImageSelected(f);
            e.target.value = "";
          }}
        />
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
        </div>
        <div>
          <p className="font-semibold">
            {isProcessing ? "Running YOLO pipeline…" : "Drop image or click to upload"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG, JPG, WebP — auto-resized to 640 px (letterbox) before inference
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Or try a sample image</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {samples.map((s) => (
            <button
              key={s.url}
              type="button"
              disabled={isProcessing}
              onClick={() => onSampleSelected(s.url, s.name)}
              title={s.name}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-md border border-border bg-muted",
                "transition-all hover:border-emerald-500/60 hover:ring-2 hover:ring-emerald-500/30",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <img
                src={s.thumb}
                alt={s.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[10px] font-medium text-white">
                {s.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

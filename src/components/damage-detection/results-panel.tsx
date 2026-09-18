"use client";

import { AlertTriangle, Box, Inbox, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Detection } from "@/lib/detection/types";

interface ResultsPanelProps {
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClear: () => void;
}

export function ResultsPanel({
  detections,
  selectedId,
  onSelect,
  onClear,
}: ResultsPanelProps) {
  if (detections.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <Inbox className="h-8 w-8 opacity-50" />
        <p>No detections yet</p>
        <p className="text-xs">Results will appear here after the pipeline runs.</p>
      </div>
    );
  }

  const objects = detections.filter((d) => d.category === "object");
  const damages = detections.filter((d) => d.category === "damage");

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Box className="h-3 w-3" />
            {objects.length} objects
          </Badge>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {damages.length} damages
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 gap-1 text-xs"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>
      <ScrollArea className="max-h-[360px] flex-1 rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {detections.map((d, idx) => {
            const isDamage = d.category === "damage";
            return (
              <li
                key={d.id}
                onClick={() => onSelect(selectedId === d.id ? null : d.id)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors",
                  selectedId === d.id
                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                    : "hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white",
                    isDamage ? "bg-red-500" : "bg-emerald-500",
                  )}
                >
                  {(idx + 1).toString().padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {d.displayName}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      {(d.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      {d.label}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                      x={d.bbox.x.toFixed(2)} y={d.bbox.y.toFixed(2)} w={d.bbox.w.toFixed(2)} h={d.bbox.h.toFixed(2)}
                    </span>
                    {isDamage && d.severity !== undefined && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono font-medium",
                          d.severity > 0.6
                            ? "bg-red-500/15 text-red-600 dark:text-red-300"
                            : d.severity > 0.3
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-300"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                        )}
                      >
                        sev {(d.severity * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {d.note && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      "{d.note}"
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </div>
  );
}

"use client";

import { Check, Loader2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { type PipelineStage } from "@/lib/detection/types";

interface PipelineStagesProps {
  stages: PipelineStage[];
  active: boolean;
}

export function PipelineStages({ stages, active }: PipelineStagesProps) {
  return (
    <ol className="space-y-1">
      {stages.map((s) => {
        const Icon =
          s.status === "done"
            ? Check
            : s.status === "running"
              ? Loader2
              : s.status === "error"
                ? Circle
                : Circle;
        return (
          <li
            key={s.id}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2 transition-colors",
              s.status === "running" && "border-emerald-500/50 bg-emerald-50/40 dark:bg-emerald-500/5",
              s.status === "error" && "border-red-500/50 bg-red-50/40 dark:bg-red-500/5",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                s.status === "done" && "bg-emerald-500 text-white",
                s.status === "running" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
                s.status === "error" && "bg-red-500 text-white",
                s.status === "idle" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-3 w-3",
                  s.status === "running" && "animate-spin",
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{s.name}</p>
                {s.durationMs > 0 && (
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {s.durationMs} ms
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.description}
              </p>
              {s.output && (
                <p className="mt-1 truncate font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
                  {s.output}
                </p>
              )}
            </div>
          </li>
        );
      })}
      {!active && stages.length === 0 && (
        <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Pipeline idle — upload an image to start.
        </li>
      )}
    </ol>
  );
}

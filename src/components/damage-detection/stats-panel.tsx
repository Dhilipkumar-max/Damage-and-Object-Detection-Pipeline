"use client";

import { AlertTriangle, Box, Clock, Gauge, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { type DetectionResponse } from "@/lib/detection/types";
import { formatMs } from "@/lib/detection/image-utils";

interface StatsPanelProps {
  result: DetectionResponse | null;
}

export function StatsPanel({ result }: StatsPanelProps) {
  const objects = result?.objectsCount ?? 0;
  const damages = result?.damagesCount ?? 0;
  const sev = result?.overallSeverity ?? "none";
  const sevScore = result?.severityScore ?? 0;
  const ms = result?.processingMs ?? 0;
  const inferenceMs = result?.inferenceMs ?? 0;

  const sevColor: Record<string, string> = {
    none: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    low: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    medium: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
    high: "bg-red-500/15 text-red-600 dark:text-red-300",
    critical: "bg-red-700/20 text-red-700 dark:text-red-300",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Box className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Objects
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{objects}</p>
          <p className="text-[10px] text-muted-foreground">detected</p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Damages
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{damages}</p>
          <p className="text-[10px] text-muted-foreground">flagged</p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Severity
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-xs font-bold uppercase",
                sevColor[sev],
              )}
            >
              {sev}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {(sevScore * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">overall risk</p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">
              Latency
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMs(ms)}</p>
          <p className="text-[10px] text-muted-foreground">
            incl. {inferenceMs} ms inference
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface FpsBadgeProps {
  processingMs: number;
}

export function FpsBadge({ processingMs }: FpsBadgeProps) {
  if (processingMs <= 0) return null;
  const fps = 1000 / processingMs;
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-mono">
      <Gauge className="h-3 w-3 text-emerald-500" />
      <span>{fps.toFixed(1)} FPS</span>
    </div>
  );
}

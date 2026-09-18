"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelative } from "@/lib/detection/image-utils";

interface HistoryItem {
  id: string;
  imageName: string;
  objectsCount: number;
  damagesCount: number;
  severity: string;
  processingMs: number;
  createdAt: string;
}

interface HistoryListProps {
  refreshKey: number;
  onPick: (item: HistoryItem) => void;
  activeId?: string | null;
}

export function HistoryList({ refreshKey, onPick, activeId }: HistoryListProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // We intentionally start the fetch in the effect body (network I/O is the
    // external system we're syncing with). setLoading(true) is wrapped in a
    // microtask to avoid a synchronous setState during the effect commit phase.
    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    fetch("/api/detections?limit=20", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load history");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data?.items ?? []);
        setError(null);
      })
      .catch((e) => {
        if (cancelled || e?.name === "AbortError") return;
        setError(e.message || "Failed to load history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/detections/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 text-center text-sm text-red-500">{error}</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
        <History className="h-8 w-8 opacity-50" />
        <p>No saved detections yet</p>
        <p className="text-xs">
          Saved runs (when "Save to history" is checked) appear here.
        </p>
      </div>
    );
  }

  const sevColor: Record<string, string> = {
    none: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    low: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    medium: "bg-orange-500/15 text-orange-600 dark:text-orange-300",
    high: "bg-red-500/15 text-red-600 dark:text-red-300",
    critical: "bg-red-700/20 text-red-700 dark:text-red-300",
  };

  return (
    <ScrollArea className="max-h-[260px] rounded-lg border border-border">
      <ul className="divide-y divide-border">
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 transition-colors",
              activeId === it.id ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-muted/60",
            )}
          >
            <button
              type="button"
              onClick={() => onPick(it)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.imageName}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>{formatRelative(it.createdAt)}</span>
                  <span>•</span>
                  <span>{it.processingMs} ms</span>
                  <span>•</span>
                  <span>{it.objectsCount} obj / {it.damagesCount} dmg</span>
                </div>
              </div>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  sevColor[it.severity] ?? sevColor.none,
                )}
              >
                {it.severity}
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-500"
              onClick={() => handleDelete(it.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

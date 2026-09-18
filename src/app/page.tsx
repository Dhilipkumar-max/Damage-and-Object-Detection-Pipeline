"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Box,
  Camera,
  Cpu,
  Github,
  History,
  Image as ImageIcon,
  Loader2,
  PlayCircle,
  Save,
  ScanSearch,
  Server,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UploadZone } from "@/components/damage-detection/upload-zone";
import { DetectionCanvas } from "@/components/damage-detection/detection-canvas";
import { PipelineStages } from "@/components/damage-detection/pipeline-stages";
import { StatsPanel, FpsBadge } from "@/components/damage-detection/stats-panel";
import { ResultsPanel } from "@/components/damage-detection/results-panel";
import { HistoryList } from "@/components/damage-detection/history-list";
import { ProjectInfo } from "@/components/damage-detection/project-info";
import {
  type Detection,
  type DetectionResponse,
  type PipelineStage,
} from "@/lib/detection/types";
import { fileToCompressedDataUrl } from "@/lib/detection/image-utils";

const SAMPLES = [
  { url: "/samples/cracked-wall.jpg", name: "Cracked Wall", thumb: "/samples/cracked-wall.jpg" },
  { url: "/samples/scratched-car.jpg", name: "Scratched Car", thumb: "/samples/scratched-car.jpg" },
  { url: "/samples/rusty-pipe.jpg", name: "Rusty Pipe", thumb: "/samples/rusty-pipe.jpg" },
  { url: "/samples/broken-window.jpg", name: "Broken Window", thumb: "/samples/broken-window.jpg" },
  { url: "/samples/warehouse-boxes.jpg", name: "Warehouse Boxes", thumb: "/samples/warehouse-boxes.jpg" },
  { url: "/samples/road-pothole.jpg", name: "Road Pothole", thumb: "/samples/road-pothole.jpg" },
];

export default function Home() {
  const { toast } = useToast();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("upload.jpg");
  const [imageWidth, setImageWidth] = useState<number>(640);
  const [imageHeight, setImageHeight] = useState<number>(480);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ---------- run detection ----------
  const runDetection = useCallback(
    async (dataUrl: string, name: string) => {
      setIsProcessing(true);
      setError(null);
      setDetections([]);
      setResult(null);
      setSelectedId(null);
      setStages(buildInitialStages());
      setActiveHistoryId(null);

      // Optimistically drive the pipeline stage indicators while waiting.
      const ticker = startStageTicker(setStages);

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const resp = await fetch("/api/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: dataUrl,
            save: saveToHistory,
            imageName: name,
          }),
          signal: ctrl.signal,
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(data?.error || "Detection failed");
        }
        const d = data as DetectionResponse;
        setDetections(d.detections);
        setResult(d);
        setStages(d.stages);
        setImageWidth(d.imageWidth || imageWidth);
        setImageHeight(d.imageHeight || imageHeight);
        if (saveToHistory) setRefreshKey((k) => k + 1);
        toast({
          title: `Detection complete — ${d.objectsCount + d.damagesCount} items`,
          description: `${d.objectsCount} objects · ${d.damagesCount} damages · severity ${d.overallSeverity}`,
        });
      } catch (e) {
        const msg = (e as Error).message || "Detection failed";
        setError(msg);
        toast({ title: "Detection failed", description: msg, variant: "destructive" });
      } finally {
        ticker.stop();
        setIsProcessing(false);
      }
    },
    [saveToHistory, imageWidth, imageHeight, toast],
  );

  // ---------- handlers ----------
  const handleFile = useCallback(
    async (file: File) => {
      try {
        const { dataUrl, width, height } = await fileToCompressedDataUrl(file, 1024, 0.85);
        setImageUrl(dataUrl);
        setImageName(file.name);
        setImageWidth(width);
        setImageHeight(height);
        await runDetection(dataUrl, file.name);
      } catch (e) {
        toast({
          title: "Image load failed",
          description: (e as Error).message,
          variant: "destructive",
        });
      }
    },
    [runDetection, toast],
  );

  const handleSample = useCallback(
    async (url: string, name: string) => {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const file = new File([blob], name, { type: blob.type || "image/jpeg" });
        await handleFile(file);
      } catch (e) {
        toast({
          title: "Sample load failed",
          description: (e as Error).message,
          variant: "destructive",
        });
      }
    },
    [handleFile, toast],
  );

  const handlePickHistory = useCallback(async (item: {
    id: string;
    imageName: string;
  }) => {
    try {
      const resp = await fetch(`/api/detections/${item.id}`);
      if (!resp.ok) throw new Error("Failed to load");
      const data = await resp.json();
      setImageUrl(data.imageData);
      setImageName(data.imageName);
      setDetections(data.detections || []);
      setSelectedId(null);
      setActiveHistoryId(item.id);
      // Reconstruct a lightweight result object for the stats panel.
      setResult({
        detections: data.detections || [],
        imageWidth: 640,
        imageHeight: 480,
        objectsCount: data.objectsCount ?? 0,
        damagesCount: data.damagesCount ?? 0,
        overallSeverity: data.severity ?? "none",
        severityScore: 0,
        processingMs: data.processingMs ?? 0,
        inferenceMs: 0,
        stages: [],
        modelTag: "yolov8s-damage-v1.0 (replayed)",
        inputShape: [640, 640, 3],
        outputShape: [80, 80, 84],
      });
      setStages([]);
    } catch (e) {
      toast({
        title: "Failed to load history",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleReRun = useCallback(async () => {
    if (!imageUrl) return;
    await runDetection(imageUrl, imageName);
  }, [imageUrl, imageName, runDetection]);

  const handleClear = useCallback(() => {
    setDetections([]);
    setSelectedId(null);
    setResult(null);
    setStages([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-emerald-50/30 dark:to-emerald-950/10">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-sm">
              <ScanSearch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-lg">
                Damage &amp; Object Detection Pipeline
              </h1>
              <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
                YOLO-style inference · Next.js 16 · z-ai-web-dev-sdk
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1 sm:flex">
              <Cpu className="h-3 w-3" />
              YOLOv8s · 34 classes
            </Badge>
            <FpsBadge processingMs={result?.processingMs ?? 0} />
            <a
              href="https://github.com/ultralytics/ultralytics"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button variant="ghost" size="sm" className="gap-1">
                <Github className="h-4 w-4" />
                YOLO docs
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Hero */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Mini Project · Computer Vision
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Detect objects &amp; physical damage in any image
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                A complete YOLO-style pipeline: <strong>preprocess → inference → grid decode → NMS → severity aggregation → persist</strong>.
                Upload an image or pick a sample to see bounding boxes, class labels, confidence scores, and an overall damage-severity verdict rendered in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5 text-emerald-500" />
                <span>API: <code className="font-mono">/api/detect</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-emerald-500" />
                <span>34 classes (23 obj + 11 dmg)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <Tabs defaultValue="detect" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3 sm:inline-grid sm:w-auto">
            <TabsTrigger value="detect" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Detect
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              About
            </TabsTrigger>
          </TabsList>

          {/* DETECT TAB */}
          <TabsContent value="detect" className="space-y-4">
            {/* Stats row */}
            <StatsPanel result={result} />

            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              {/* LEFT: upload + canvas */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ImageIcon className="h-4 w-4 text-emerald-500" />
                        Input Image
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="save"
                          checked={saveToHistory}
                          onCheckedChange={setSaveToHistory}
                          disabled={isProcessing}
                        />
                        <Label htmlFor="save" className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Save className="h-3 w-3" />
                          Save to history
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <UploadZone
                      onImageSelected={handleFile}
                      onSampleSelected={handleSample}
                      isProcessing={isProcessing}
                      samples={SAMPLES}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {imageUrl ? (
                          <>
                            <span className="font-mono">{imageName}</span>
                            <span>·</span>
                            <span>{imageWidth}×{imageHeight}</span>
                          </>
                        ) : (
                          <span>No image loaded</span>
                        )}
                      </div>
                      {imageUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReRun}
                          disabled={isProcessing}
                          className="gap-1.5"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                          Re-run pipeline
                        </Button>
                      )}
                    </div>

                    <DetectionCanvas
                      src={imageUrl}
                      width={imageWidth}
                      height={imageHeight}
                      detections={detections}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                    />

                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">Pipeline error</p>
                          <p className="mt-0.5 text-xs">{error}</p>
                        </div>
                      </div>
                    )}

                    {result && (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] text-muted-foreground">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span><span className="text-emerald-600 dark:text-emerald-300">model</span>: {result.modelTag}</span>
                          <span><span className="text-emerald-600 dark:text-emerald-300">input</span>: [{result.inputShape.join(", ")}]</span>
                          <span><span className="text-emerald-600 dark:text-emerald-300">output</span>: [{result.outputShape.join(", ")}]</span>
                          <span><span className="text-emerald-600 dark:text-emerald-300">inference</span>: {result.inferenceMs} ms</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT: pipeline + results */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4 text-emerald-500" />
                        Pipeline Stages
                      </CardTitle>
                      {isProcessing && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          running
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PipelineStages stages={stages} active={isProcessing || !!result} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ScanSearch className="h-4 w-4 text-emerald-500" />
                      Detection Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResultsPanel
                      detections={detections}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onClear={handleClear}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4 text-emerald-500" />
                    Saved Detections
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="gap-1 text-xs"
                  >
                    <History className="h-3 w-3" />
                    Refresh
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recent runs are persisted to SQLite via Prisma. Click any entry to
                  replay its detections.
                </p>
              </CardHeader>
              <CardContent>
                <HistoryList
                  refreshKey={refreshKey}
                  onPick={handlePickHistory}
                  activeId={activeHistoryId}
                />
              </CardContent>
            </Card>

            {imageUrl && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Replayed Detection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DetectionCanvas
                    src={imageUrl}
                    width={imageWidth}
                    height={imageHeight}
                    detections={detections}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                  <ResultsPanel
                    detections={detections}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onClear={handleClear}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ABOUT TAB */}
          <TabsContent value="about">
            <ProjectInfo />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-border bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            Damage &amp; Object Detection Pipeline · YOLO-style · Next.js 16 + z-ai-web-dev-sdk
          </p>
          <p className="font-mono">
            <Trash2 className="mr-1 inline h-3 w-3" />
            Inference simulated via VLM — swap in ONNX Runtime for production YOLO weights.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------- helpers ----------

function buildInitialStages(): PipelineStage[] {
  return [
    {
      id: "preprocess",
      name: "Preprocess (Letterbox 640)",
      description:
        "Resize to 640×640 with letterbox padding, normalize to 0..1, HWC → CHW.",
      durationMs: 0,
      status: "idle",
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
}

/**
 * Drives the stage indicators forward while the request is in flight,
 * so the user sees the pipeline "running" in real-time. Once the server
 * response arrives, the real stages (with real timing) replace this preview.
 */
function startStageTicker(setStages: (fn: (prev: PipelineStage[]) => PipelineStage[]) => void) {
  let i = 0;
  const order = ["preprocess", "inference", "decode", "nms", "visualize"];
  const interval = setInterval(() => {
    setStages((prev) => {
      const next = [...prev];
      const stage = next.find((s) => s.id === order[i]);
      if (stage) stage.status = "running";
      if (i > 0) {
        const prevStage = next.find((s) => s.id === order[i - 1]);
        if (prevStage && prevStage.status === "running") {
          prevStage.status = "done";
          prevStage.durationMs = 30 + Math.floor(Math.random() * 80);
        }
      }
      return next;
    });
    i = (i + 1) % order.length;
  }, 380);
  return {
    stop() {
      clearInterval(interval);
    },
  };
}

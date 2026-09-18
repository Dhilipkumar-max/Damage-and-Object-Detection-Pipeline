import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Damage & Object Detection Pipeline (YOLO) · Mini Project",
  description: "A YOLO-style damage & object detection pipeline built with Next.js 16, TypeScript, Prisma, and z-ai-web-dev-sdk. Upload an image to detect objects and physical damage with bounding boxes, confidence scores, and severity verdicts.",
  keywords: ["YOLO", "object detection", "damage detection", "computer vision", "Next.js", "TypeScript", "Prisma", "z-ai-web-dev-sdk"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Damage & Object Detection Pipeline (YOLO)",
    description: "A YOLO-style damage & object detection pipeline mini-project.",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Damage & Object Detection Pipeline (YOLO)",
    description: "A YOLO-style damage & object detection pipeline mini-project.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

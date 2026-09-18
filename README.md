# Damage-and-Object-Detection-Pipeline

A modern web application for analyzing images and identifying both damage areas and general objects in a scene. The project combines a Next.js frontend, Prisma-backed data persistence, and a simulated YOLO-style detection pipeline to visualize results, severity, and processing stages in a polished dashboard.

## Overview

This application lets users:

- Upload images or use built-in sample images
- Detect visible objects such as vehicles, walls, pipes, windows, containers, and more
- Detect damage indicators such as cracks, scratches, rust, dents, breaks, and stains
- View normalized bounding boxes, confidence scores, and severity classification
- Inspect the processing pipeline stage-by-stage
- Save detection history to a local SQLite database

The solution is designed as a demonstration of a damage and object detection workflow with a user-friendly visual interface and a structured backend API.

## Features

- Image upload and preview
- Sample dataset gallery
- Real-time detection pipeline visualization
- Object and damage categorization
- Bounding boxes over the original image
- Severity scoring and aggregate detection summary
- Detection history and replay support
- SQLite persistence through Prisma
- Responsive UI using Next.js and Tailwind CSS

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- SQLite database
- VLM-backed simulated inference pipeline

## Project Structure

```text
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   ├── hooks/
│   └── lib/
├── prisma/
│   └── schema.prisma
├── public/
│   └── samples/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── Caddyfile
├── components.json
├── README.md
└── .gitignore
```

## How It Works

1. The user uploads an image or selects a sample.
2. The frontend sends the image to the detection API.
3. The backend runs a simulated YOLO-style pipeline:
   - preprocess
   - inference
   - decode
   - NMS
   - postprocess and visualization
4. The system returns object and damage detections with confidence and bounding boxes.
5. Results can be displayed on the canvas and optionally saved to the database.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- SQLite support

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the project root with:

```bash
DATABASE_URL="file:./dev.db"
```

### Database Initialization

```bash
npx prisma generate
npx prisma db push
```

### Run the App

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:reset
```

## Notes

This project is a demonstration pipeline and uses a simulated inference flow rather than a production-grade model deployment. It focuses on visualization, architecture, and an end-to-end detection workflow that can later be upgraded to real YOLO, Ultralytics, or custom model inference.

## License

This project is intended for learning, prototyping, and demonstration purposes.

## Repository

GitHub: https://github.com/Dhilipkumar-max/Damage-and-Object-Detection-Pipeline.git


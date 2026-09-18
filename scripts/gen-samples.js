/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generate sample test images for the Damage & Object Detection demo.
 * Uses sharp to render simple but visually-distinct PNGs that the VLM can analyze.
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUT_DIR = path.join(process.cwd(), "public", "samples");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 640;
const H = 480;

/** Build an SVG string for a "cracked wall" sample. */
function crackedWall() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#d6c9b3"/>
        <stop offset="1" stop-color="#b9a684"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#wall)"/>
    <!-- subtle texture -->
    ${Array.from({length: 80}).map(() => {
      const x = Math.random() * W, y = Math.random() * H, r = Math.random() * 1.5;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#000" opacity="0.05"/>`;
    }).join("")}
    <!-- main crack -->
    <path d="M 80 40 L 140 120 L 110 180 L 200 240 L 170 320 L 260 380 L 240 460" stroke="#2a1d0e" stroke-width="3" fill="none" opacity="0.85"/>
    <path d="M 140 120 L 200 100" stroke="#2a1d0e" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M 200 240 L 280 220" stroke="#2a1d0e" stroke-width="2" fill="none" opacity="0.7"/>
    <path d="M 260 380 L 340 360" stroke="#2a1d0e" stroke-width="2" fill="none" opacity="0.7"/>
    <!-- smaller crack -->
    <path d="M 420 60 L 460 140 L 430 220 L 500 300" stroke="#3a2716" stroke-width="2" fill="none" opacity="0.7"/>
    <!-- patch of rust -->
    <ellipse cx="500" cy="380" rx="60" ry="40" fill="#8a3b1a" opacity="0.55"/>
    <ellipse cx="500" cy="380" rx="40" ry="25" fill="#a4541f" opacity="0.7"/>
    <!-- a label / window in the wall -->
    <rect x="40" y="380" width="80" height="60" fill="#7d6f55" stroke="#3a2716" stroke-width="2"/>
  </svg>`;
}

function scratchedCar() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#9bb7d4"/>
    <!-- ground -->
    <rect x="0" y="380" width="${W}" height="100" fill="#6d6d6d"/>
    <!-- car body -->
    <path d="M 80 320 L 160 220 L 360 220 L 460 320 L 560 320 L 560 380 L 80 380 Z" fill="#c8332c" stroke="#3a0c0a" stroke-width="3"/>
    <!-- windows -->
    <path d="M 180 230 L 250 230 L 250 310 L 170 310 Z" fill="#9bc4d8" stroke="#3a0c0a" stroke-width="2"/>
    <path d="M 270 230 L 340 230 L 340 310 L 270 310 Z" fill="#9bc4d8" stroke="#3a0c0a" stroke-width="2"/>
    <!-- wheels -->
    <circle cx="180" cy="380" r="35" fill="#1a1a1a"/>
    <circle cx="180" cy="380" r="14" fill="#555"/>
    <circle cx="430" cy="380" r="35" fill="#1a1a1a"/>
    <circle cx="430" cy="380" r="14" fill="#555"/>
    <!-- deep scratch on the door -->
    <path d="M 270 250 Q 290 290 280 340" stroke="#1a1a1a" stroke-width="3" fill="none"/>
    <path d="M 274 252 Q 294 292 284 342" stroke="#3a3a3a" stroke-width="2" fill="none"/>
    <!-- dent shading -->
    <ellipse cx="320" cy="320" rx="40" ry="14" fill="#8a1f1a" opacity="0.6"/>
    <!-- headlight -->
    <ellipse cx="540" cy="330" rx="15" ry="9" fill="#fff6a8"/>
  </svg>`;
}

function rustyPipe() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#2a2a2a"/>
    <!-- pipe -->
    <rect x="40" y="200" width="560" height="100" fill="#7a7a7a" stroke="#1a1a1a" stroke-width="3"/>
    <!-- rust patches -->
    <ellipse cx="180" cy="250" rx="80" ry="35" fill="#8a3b1a" opacity="0.85"/>
    <ellipse cx="180" cy="250" rx="55" ry="22" fill="#a4541f" opacity="0.85"/>
    <ellipse cx="380" cy="240" rx="60" ry="28" fill="#8a3b1a" opacity="0.75"/>
    <ellipse cx="380" cy="240" rx="40" ry="18" fill="#b25c1f" opacity="0.85"/>
    <!-- leak -->
    <path d="M 280 280 L 290 340 L 270 360 L 300 380 L 280 420" stroke="#1a3a5a" stroke-width="6" fill="none" opacity="0.85"/>
    <circle cx="280" cy="420" r="8" fill="#1a3a5a" opacity="0.9"/>
    <!-- crack on pipe -->
    <path d="M 470 200 L 480 230 L 460 260 L 480 300" stroke="#1a1a1a" stroke-width="3" fill="none"/>
    <!-- flange / bolt -->
    <rect x="540" y="180" width="20" height="140" fill="#5a5a5a" stroke="#1a1a1a" stroke-width="2"/>
    <circle cx="550" cy="200" r="5" fill="#1a1a1a"/>
    <circle cx="550" cy="300" r="5" fill="#1a1a1a"/>
  </svg>`;
}

function brokenWindow() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#d8d2c4"/>
    <!-- frame -->
    <rect x="60" y="40" width="520" height="400" fill="none" stroke="#5a4a3a" stroke-width="10"/>
    <!-- glass -->
    <rect x="70" y="50" width="500" height="380" fill="#b8d4dc" opacity="0.7"/>
    <!-- impact point -->
    <circle cx="320" cy="220" r="10" fill="#3a3a3a"/>
    <!-- radiating cracks -->
    ${Array.from({length: 14}).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      const r1 = 12 + Math.random() * 8;
      const r2 = 80 + Math.random() * 180;
      const x1 = 320 + Math.cos(angle) * r1;
      const y1 = 220 + Math.sin(angle) * r1;
      const x2 = 320 + Math.cos(angle) * r2;
      const y2 = 220 + Math.sin(angle) * r2;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a1a1a" stroke-width="1.5" opacity="0.8"/>`;
    }).join("")}
    <!-- concentric cracks -->
    <circle cx="320" cy="220" r="60" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.6"/>
    <circle cx="320" cy="220" r="110" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.5"/>
    <circle cx="320" cy="220" r="170" fill="none" stroke="#1a1a1a" stroke-width="1" opacity="0.4"/>
    <!-- missing glass piece -->
    <path d="M 320 220 L 360 260 L 330 290 L 290 250 Z" fill="#d8d2c4" stroke="#3a3a3a" stroke-width="1.5"/>
  </svg>`;
}

function warehouseBoxes() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#c4b59a"/>
    <!-- floor -->
    <rect x="0" y="380" width="${W}" height="100" fill="#9a8d75"/>
    <!-- box 1 -->
    <rect x="60" y="240" width="140" height="140" fill="#b78a4f" stroke="#5a3a18" stroke-width="3"/>
    <line x1="60" y1="280" x2="200" y2="280" stroke="#5a3a18" stroke-width="2"/>
    <line x1="130" y1="240" x2="130" y2="380" stroke="#5a3a18" stroke-width="1.5"/>
    <!-- box 2 -->
    <rect x="200" y="180" width="120" height="200" fill="#a8763d" stroke="#4a2f12" stroke-width="3"/>
    <line x1="200" y1="220" x2="320" y2="220" stroke="#4a2f12" stroke-width="2"/>
    <line x1="260" y1="180" x2="260" y2="380" stroke="#4a2f12" stroke-width="1.5"/>
    <!-- damaged corner on box 2 -->
    <path d="M 320 360 L 320 380 L 300 380 Z" fill="#5a3a18"/>
    <path d="M 280 360 L 290 380 L 270 380 Z" fill="#5a3a18" opacity="0.7"/>
    <!-- box 3 (toppled) -->
    <rect x="340" y="280" width="180" height="100" fill="#c89968" stroke="#5a3a18" stroke-width="3"/>
    <line x1="340" y1="320" x2="520" y2="320" stroke="#5a3a18" stroke-width="2"/>
    <!-- box 4 -->
    <rect x="340" y="200" width="100" height="80" fill="#b78a4f" stroke="#5a3a18" stroke-width="3"/>
    <!-- a person -->
    <circle cx="500" cy="200" r="20" fill="#e3b48a"/>
    <rect x="485" y="220" width="30" height="60" fill="#2a4a7a"/>
    <rect x="480" y="280" width="14" height="60" fill="#1a1a1a"/>
    <rect x="506" y="280" width="14" height="60" fill="#1a1a1a"/>
    <!-- torn tape on box 1 -->
    <rect x="80" y="260" width="100" height="10" fill="#d8d2c4" opacity="0.8"/>
    <path d="M 80 265 L 180 263 L 178 270 L 80 268 Z" fill="#d8d2c4" opacity="0.6"/>
  </svg>`;
}

function roadScene() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9bc4d8"/>
        <stop offset="1" stop-color="#d8e4ec"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="300" fill="url(#sky)"/>
    <rect x="0" y="300" width="${W}" height="180" fill="#4a4a4a"/>
    <!-- road markings -->
    <g fill="#f0e68c">
      <rect x="310" y="310" width="20" height="40"/>
      <rect x="310" y="380" width="20" height="50"/>
      <rect x="310" y="450" width="20" height="40"/>
    </g>
    <!-- horizon buildings -->
    <rect x="40" y="200" width="100" height="100" fill="#6a6a6a"/>
    <rect x="160" y="180" width="80" height="120" fill="#7a7a7a"/>
    <rect x="480" y="170" width="100" height="130" fill="#6a6a6a"/>
    <!-- a pothole (damage on the road) -->
    <ellipse cx="180" cy="400" rx="60" ry="22" fill="#1a1a1a" opacity="0.85"/>
    <ellipse cx="180" cy="400" rx="42" ry="14" fill="#000" opacity="0.95"/>
    <ellipse cx="170" cy="396" rx="20" ry="6" fill="#2a2a2a"/>
    <!-- another smaller pothole -->
    <ellipse cx="440" cy="430" rx="35" ry="12" fill="#1a1a1a" opacity="0.85"/>
    <!-- a car -->
    <rect x="380" y="330" width="120" height="40" fill="#2a4a7a" stroke="#0a1a2a" stroke-width="2"/>
    <path d="M 400 330 L 420 310 L 460 310 L 480 330 Z" fill="#3a5a8a" stroke="#0a1a2a" stroke-width="2"/>
    <circle cx="410" cy="380" r="15" fill="#1a1a1a"/>
    <circle cx="470" cy="380" r="15" fill="#1a1a1a"/>
    <!-- crack on road -->
    <path d="M 60 350 L 80 380 L 60 420 L 90 460" stroke="#1a1a1a" stroke-width="2" fill="none" opacity="0.7"/>
  </svg>`;
}

const samples = [
  { name: "cracked-wall.jpg", svg: crackedWall() },
  { name: "scratched-car.jpg", svg: scratchedCar() },
  { name: "rusty-pipe.jpg", svg: rustyPipe() },
  { name: "broken-window.jpg", svg: brokenWindow() },
  { name: "warehouse-boxes.jpg", svg: warehouseBoxes() },
  { name: "road-pothole.jpg", svg: roadScene() },
];

(async () => {
  for (const s of samples) {
    const outPath = path.join(OUT_DIR, s.name);
    await sharp(Buffer.from(s.svg)).jpeg({ quality: 88 }).toFile(outPath);
    console.log("Wrote", outPath);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

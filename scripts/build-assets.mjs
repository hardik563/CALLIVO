import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Official CALLIVO Favicon SVG
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Brand Primary Gradient -->
    <linearGradient id="callivoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="35%" stop-color="#2563EB" />
      <stop offset="70%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>

    <!-- Top Ambient Sheen -->
    <linearGradient id="sheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>

    <!-- Subtle Drop Shadow for Camera Emblem -->
    <filter id="cameraShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F172A" flood-opacity="0.28" />
    </filter>
  </defs>

  <!-- Modern Rounded Squircle Base (fills canvas for crisp scaling) -->
  <rect x="0" y="0" width="512" height="512" rx="124" fill="url(#callivoGrad)" />
  
  <!-- Subtle specular light overlay -->
  <rect x="0" y="0" width="512" height="256" rx="124" fill="url(#sheen)" />
  
  <!-- Premium Glass Rim Border -->
  <rect x="4" y="4" width="504" height="504" rx="120" fill="none" stroke="rgba(255, 255, 255, 0.2)" stroke-width="8" />

  <!-- The CALLIVO Video Camera & C Emblem -->
  <g filter="url(#cameraShadow)">
    <!-- Main Camera Housing (Solid Pure White for Ultra-High Tab Contrast) -->
    <rect x="92" y="144" width="208" height="224" rx="50" fill="#FFFFFF" />

    <!-- Stylized "C" Aperture Cutout exposing the vivid brand gradient -->
    <path d="M 238,194 
             A 62 62 0 1 0 238,318 
             L 218,298 
             A 34 34 0 1 1 218,214 Z" 
          fill="url(#callivoGrad)" />

    <!-- Central Collaboration & Video Sensor Focal Hub -->
    <circle cx="196" cy="256" r="15" fill="url(#callivoGrad)" />

    <!-- Camera Projection Lens Cone -->
    <path d="M 330,204 
             L 416,148 
             C 426,141 440,148 440,162 
             L 440,350 
             C 440,364 426,371 416,364 
             L 330,308 
             C 322,303 316,293 316,282 
             L 316,230 
             C 316,219 322,209 330,204 Z" 
          fill="#FFFFFF" />
  </g>
</svg>`;

// Social Share Open Graph Banner SVG (1200 x 630)
const ogBannerSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0D13" />
      <stop offset="60%" stop-color="#111522" />
      <stop offset="100%" stop-color="#171C2E" />
    </linearGradient>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="40%" stop-color="#2563EB" />
      <stop offset="70%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <radialGradient id="glowBack" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#4F46E5" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#ogBg)" />
  <circle cx="600" cy="220" r="450" fill="url(#glowBack)" />

  <!-- Grid overlay -->
  <g stroke="#232B42" stroke-width="1" opacity="0.35">
    <line x1="0" y1="105" x2="1200" y2="105" />
    <line x1="0" y1="210" x2="1200" y2="210" />
    <line x1="0" y1="315" x2="1200" y2="315" />
    <line x1="0" y1="420" x2="1200" y2="420" />
    <line x1="0" y1="525" x2="1200" y2="525" />
    <line x1="200" y1="0" x2="200" y2="630" />
    <line x1="400" y1="0" x2="400" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="800" y1="0" x2="800" y2="630" />
    <line x1="1000" y1="0" x2="1000" y2="630" />
  </g>

  <!-- Centered Logo Icon (140x140) -->
  <g transform="translate(530, 90)">
    <rect x="0" y="0" width="140" height="140" rx="34" fill="url(#logoGrad)" />
    <rect x="1" y="1" width="138" height="138" rx="33" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    <!-- Camera Glyph scaled to fit -->
    <g transform="translate(25, 39) scale(0.273)">
      <rect x="0" y="0" width="208" height="224" rx="50" fill="#FFFFFF" />
      <path d="M 146,50 A 62 62 0 1 0 146,174 L 126,154 A 34 34 0 1 1 126,70 Z" fill="url(#logoGrad)" />
      <circle cx="104" cy="112" r="15" fill="url(#logoGrad)" />
      <path d="M 238,60 L 324,4 C 334,-3 348,4 348,18 L 348,206 C 348,220 334,227 324,220 L 238,164 C 230,159 224,149 224,138 L 224,86 C 224,75 230,65 238,60 Z" fill="#FFFFFF" />
    </g>
  </g>

  <!-- Brand Title -->
  <text x="600" y="300" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="52" fill="#FFFFFF" letter-spacing="-1">
    CALLIVO
  </text>
  <!-- Green live dot -->
  <circle cx="730" cy="272" r="6" fill="#34D399" />

  <!-- Tagline -->
  <text x="600" y="360" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="24" fill="#818CF8" letter-spacing="3">
    MEET. CONNECT. COLLABORATE.
  </text>

  <!-- Subtitle -->
  <text x="600" y="420" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" font-weight="400" font-size="20" fill="#94A3B8">
    Enterprise video conferencing with ultra-low latency &amp; 3D spatial rooms
  </text>

  <!-- Badges / Features -->
  <g transform="translate(600, 480)">
    <!-- Pill 1 -->
    <g transform="translate(-240, 0)">
      <rect x="0" y="0" width="140" height="38" rx="19" fill="#171C2E" stroke="#232B42" stroke-width="1.5" />
      <text x="70" y="24" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="500" fill="#CBD5E1">HD Audio/Video</text>
    </g>
    <!-- Pill 2 -->
    <g transform="translate(-70, 0)">
      <rect x="0" y="0" width="140" height="38" rx="19" fill="#171C2E" stroke="#232B42" stroke-width="1.5" />
      <text x="70" y="24" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="500" fill="#CBD5E1">End-to-End Safe</text>
    </g>
    <!-- Pill 3 -->
    <g transform="translate(100, 0)">
      <rect x="0" y="0" width="140" height="38" rx="19" fill="#171C2E" stroke="#232B42" stroke-width="1.5" />
      <text x="70" y="24" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="500" fill="#CBD5E1">3D Spatial Rooms</text>
    </g>
  </g>
</svg>`;

// Helper function to create multi-size ICO buffer from PNG buffers
function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0); // Width
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1); // Height
    entry.writeUInt8(0, 2); // Color palette count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function run() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Writing public/favicon.svg...');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

  // Generate PNG icons using sharp
  const svgBuffer = Buffer.from(faviconSvg);

  console.log('Generating favicon-16x16.png...');
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);

  console.log('Generating favicon-32x32.png...');
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);

  console.log('Generating favicon-48x48.png...');
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-48x48.png'), png48);

  console.log('Generating apple-touch-icon.png (180x180)...');
  const pngApple = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

  console.log('Generating android-chrome-192x192.png...');
  const png192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'android-chrome-192x192.png'), png192);

  console.log('Generating android-chrome-512x512.png...');
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'android-chrome-512x512.png'), png512);

  console.log('Building multi-resolution public/favicon.ico (16, 32, 48px)...');
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  console.log('Generating public/og-image.png (1200x630)...');
  const ogPng = await sharp(Buffer.from(ogBannerSvg)).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogPng);

  // Generate Web App Manifest
  console.log('Writing public/site.webmanifest...');
  const manifest = {
    name: "CALLIVO — Meet. Connect. Collaborate.",
    short_name: "CALLIVO",
    description: "Enterprise-grade video conferencing, ultra-low latency collaboration, and signature 3D spatial conference rooms.",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    theme_color: "#2563EB",
    background_color: "#0B0D13",
    display: "standalone",
    start_url: "/"
  };
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('All branding assets generated successfully in public/ !');
}

run().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

/**
 * PWA Icon Generation Script
 *
 * Generates all required PWA icon sizes from the source logo.
 * Run with: npx tsx scripts/generate-pwa-icons.ts
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'images', 'logo.png');
const OUT = path.join(ROOT, 'public', 'icons');

// Ensure output directory exists
fs.mkdirSync(OUT, { recursive: true });

interface IconSpec {
  filename: string;
  size: number;
  maskable?: boolean;
}

const icons: IconSpec[] = [
  { filename: 'icon-192x192.png', size: 192 },
  { filename: 'icon-384x384.png', size: 384 },
  { filename: 'icon-512x512.png', size: 512 },
  { filename: 'maskable-icon-512x512.png', size: 512, maskable: true },
  { filename: 'apple-touch-icon.png', size: 180 },
];

async function generateIcon(spec: IconSpec): Promise<void> {
  const destPath = path.join(OUT, spec.filename);

  if (spec.maskable) {
    // Maskable icon: add 10% safe-zone padding with warm cream background
    // Safe zone = 80% of total size, so padding = 10% on each side
    const paddingPercent = 0.1;
    const logoSize = Math.round(spec.size * (1 - paddingPercent * 2));

    // Resize the logo to fit within the safe zone
    const resizedLogo = await sharp(SRC)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Composite onto warm cream background
    await sharp({
      create: {
        width: spec.size,
        height: spec.size,
        channels: 4,
        background: { r: 0xf8, g: 0xee, b: 0xe5, alpha: 1 }, // #F8EEE5
      },
    })
      .composite([
        {
          input: resizedLogo,
          gravity: 'center',
        },
      ])
      .png()
      .toFile(destPath);
  } else {
    // Standard icon: simple resize maintaining aspect ratio with transparent bg
    await sharp(SRC)
      .resize(spec.size, spec.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(destPath);
  }

  console.log(`Generated: public/icons/${spec.filename} (${spec.size}x${spec.size})`);
}

async function main(): Promise<void> {
  console.log('Generating PWA icons from:', SRC);
  console.log('Output directory:', OUT);
  console.log('');

  if (!fs.existsSync(SRC)) {
    console.error('Error: Source logo not found at', SRC);
    process.exit(1);
  }

  for (const icon of icons) {
    await generateIcon(icon);
  }

  console.log('\nAll PWA icons generated successfully.');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

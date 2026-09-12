import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

const sizes = [16, 32, 48, 64, 180];

for (const s of sizes) {
    await sharp(path.join(publicDir, 'favicon.svg'))
        .resize(s, s)
        .png()
        .toFile(path.join(publicDir, `favicon-${s}x${s}.png`));
    console.log('generated', s);
}

await sharp(path.join(publicDir, 'apple-touch-icon.svg'))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

await sharp(path.join(publicDir, 'apple-touch-icon.svg'))
    .resize(180, 180)
    .toFile(path.join(publicDir, 'apple-touch-icon.ico'));

console.log('done');
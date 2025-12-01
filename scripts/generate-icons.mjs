// 簡単なPNGアイコンを生成するスクリプト
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function generateIcon(size, outputPath) {
  // 黒背景に白い「W」の文字を表示する簡単なアイコン
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#000000"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="#ffffff" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >W</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  const publicDir = join(process.cwd(), 'public');
  
  console.log('Generating PWA icons...');
  
  await generateIcon(192, join(publicDir, 'icon-192.png'));
  await generateIcon(512, join(publicDir, 'icon-512.png'));
  
  console.log('✓ All icons generated successfully!');
}

main().catch(console.error);


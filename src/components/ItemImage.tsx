"use client";

import { useState, useRef } from 'react';

// ColorThiefの型定義
declare module 'colorthief' {
  export default class ColorThief {
    getColor(img: HTMLImageElement | null, quality?: number): [number, number, number];
    getPalette(img: HTMLImageElement | null, colorCount?: number, quality?: number): Array<[number, number, number]>;
  }
}

interface ItemImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ItemImage({ imageUrl, alt, className = "", containerClassName = "" }: ItemImageProps) {
  const [bgColor, setBgColor] = useState<string>('rgb(255, 255, 255)');
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImageLoad = async () => {
    if (!imgRef.current) return;

    try {
      // 動的インポートでColorThiefを読み込む
      const ColorThiefModule = await import('colorthief');
      const ColorThief = ColorThiefModule.default;
      const colorThief = new ColorThief();
      const color = colorThief.getColor(imgRef.current);
      // 色を少し明るくして背景に適用（白背景の商品でも違和感がないように）
      const adjustedColor = color.map(c => Math.min(255, c + 30));
      setBgColor(`rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`);
    } catch (error) {
      console.error('Failed to get color:', error);
      // エラー時は白背景のまま
      setBgColor('rgb(255, 255, 255)');
    }
  };

  return (
    <div 
      style={{ backgroundColor: bgColor }}
      className={`w-full h-full flex items-center justify-center overflow-hidden ${containerClassName}`}
    >
      <img 
        ref={imgRef}
        src={imageUrl} 
        alt={alt}
        className={className}
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        onError={() => setBgColor('rgb(255, 255, 255)')}
      />
    </div>
  );
}


'use client';

import React from 'react';

interface Props {
  value: string;
  width?: number;
  height?: number;
}

export default function BarcodeGenerator({ value, width = 180, height = 50 }: Props) {
  // Generate deterministic barcode lines pattern based on string characters
  const bars: { width: number; isBlack: boolean }[] = [];

  // Start quiet zone & start guard
  bars.push({ width: 2, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });

  // Body bars
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    const pattern = (charCode * 7 + i * 13) % 16;
    for (let b = 0; b < 4; b++) {
      const bit = (pattern >> b) & 1;
      bars.push({ width: bit ? 2 : 1, isBlack: b % 2 === 0 });
    }
  }

  // End guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 2, isBlack: false });

  let currentX = 0;

  return (
    <div className="flex flex-col items-center bg-white p-2 border border-slate-200 rounded-lg inline-block">
      <svg width={width} height={height} className="overflow-visible">
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width * 2;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={bar.width * 2}
              height={height - 12}
              fill="#000000"
            />
          );
        })}
      </svg>
      <span className="font-mono text-[10px] text-black font-bold tracking-widest mt-1">
        {value}
      </span>
    </div>
  );
}

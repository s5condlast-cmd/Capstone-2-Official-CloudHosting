import React, { useState } from 'react';
import { cn } from '../../lib/utils';

export interface CircleItem {
  id?: string | number;
  img?: string;
  icon?: React.ReactNode;
  alt?: string;
  label?: string;
  tooltip?: string;
  bg?: string;
  border?: string;
}

export interface CirclesProps {
  rows?: (string | CircleItem)[][];
  circleSize?: number;
  baseRadius?: number;
  orbitGap?: number;
  rotationDuration?: number;
  direction?: 'clockwise' | 'counter-clockwise' | 'alternate';
  showPaths?: boolean;
  fadeMode?: 'none' | 'radial' | 'linear';
  centerElement?: React.ReactNode;
  pauseOnHover?: boolean;
  className?: string;
}

export const Circles: React.FC<CirclesProps> = ({
  rows = [],
  circleSize = 48,
  baseRadius = 110,
  orbitGap = 70,
  rotationDuration = 40,
  direction = 'alternate',
  showPaths = true,
  fadeMode = 'radial',
  centerElement,
  pauseOnHover = true,
  className
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Total diameter needed for the container
  const maxRadius = baseRadius + Math.max(0, rows.length - 1) * orbitGap;
  const containerSize = (maxRadius + circleSize) * 2;

  return (
    <div
      className={cn("relative flex items-center justify-center select-none overflow-visible", className)}
      style={{ width: '100%', maxWidth: `${containerSize}px`, aspectRatio: '1/1' }}
      onMouseEnter={() => pauseOnHover && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateY(calc(var(--radius) * -1px)) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateY(calc(var(--radius) * -1px)) rotate(-360deg);
          }
        }
      `}</style>

      {/* SVG Orbit Path Lines */}
      {showPaths && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${containerSize} ${containerSize}`}
        >
          {rows.map((_, rowIndex) => {
            const radius = baseRadius + rowIndex * orbitGap;
            return (
              <circle
                key={rowIndex}
                cx={containerSize / 2}
                cy={containerSize / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-zinc-300/80"
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />
            );
          })}
        </svg>
      )}

      {/* Center Element */}
      {centerElement && (
        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
          {centerElement}
        </div>
      )}

      {/* Orbit Items */}
      {rows.map((row, rowIndex) => {
        const radius = baseRadius + rowIndex * orbitGap;
        const count = row.length;
        const isClockwise =
          direction === 'clockwise'
            ? true
            : direction === 'counter-clockwise'
            ? false
            : rowIndex % 2 === 0;

        const duration = rotationDuration * (1 + rowIndex * 0.35);

        return row.map((item, itemIndex) => {
          const angle = (360 / count) * itemIndex;
          const delay = (angle / 360) * duration;
          const itemObj: CircleItem =
            typeof item === 'string' ? { img: item } : item;

          return (
            <div
              key={`${rowIndex}-${itemIndex}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${circleSize}px`,
                height: `${circleSize}px`,
                marginLeft: `-${circleSize / 2}px`,
                marginTop: `-${circleSize / 2}px`,
                ['--radius' as string]: radius,
                animation: `orbit ${duration}s linear infinite`,
                animationDelay: `-${delay}s`,
                animationDirection: isClockwise ? 'normal' : 'reverse',
                animationPlayState: isHovered ? 'paused' : 'running'
              }}
              className="pointer-events-auto will-change-transform z-10"
            >
              {/* Rock-solid stagnant upright node */}
              <div
                className={cn(
                  "w-full h-full rounded-full flex items-center justify-center p-1.5 shadow-md bg-white border-2 transition-transform duration-300 hover:scale-125 cursor-pointer relative group/node",
                  itemObj.border || "border-zinc-200/90",
                  itemObj.bg
                )}
              >
                {itemObj.img ? (
                  <img
                    src={itemObj.img}
                    alt={itemObj.alt || itemObj.label || 'Avatar'}
                    className="w-full h-full object-contain rounded-full select-none pointer-events-none"
                  />
                ) : itemObj.icon ? (
                  itemObj.icon
                ) : null}

                {/* Tooltip on Hover */}
                {itemObj.label && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-zinc-900 text-white text-[11px] font-mono font-bold whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none shadow-xl z-30">
                    {itemObj.label}
                  </span>
                )}
              </div>
            </div>
          );
        });
      })}

      {/* Radial Edge Fade Mode */}
      {fadeMode === 'radial' && (
        <div className="absolute inset-0 pointer-events-none rounded-full bg-[radial-gradient(circle,transparent_65%,rgba(248,249,250,0.85)_100%)]" />
      )}
    </div>
  );
};

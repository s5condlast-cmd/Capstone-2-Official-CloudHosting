import React from 'react';
import { cn } from '@/src/lib/utils';

interface CircularProgressProps {
  value: number; // 0 - 100
  size?: number; // pixel diameter (default: 56)
  strokeWidth?: number; // stroke width (default: 5)
  className?: string;
  indicatorClassName?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 56,
  strokeWidth = 5,
  className,
  indicatorClassName = 'text-primary',
  trackClassName = 'text-muted/50',
  children,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clampedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] overflow-visible"
        aria-hidden="true"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          className={trackClassName}
        />
        {/* Animated Progress Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', indicatorClassName)}
        />
      </svg>
      {/* Central Content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
};

export default CircularProgress;

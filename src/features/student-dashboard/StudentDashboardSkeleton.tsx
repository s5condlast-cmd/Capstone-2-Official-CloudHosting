/**
 * StudentDashboardSkeleton.tsx
 * Zero-CLS loading placeholder matching the exact dimensions and radii of the Bento grid cards.
 */

import React from 'react';

export const StudentDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted/60 rounded-2xl" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 w-24 bg-muted/40 rounded-xl" />
            <div className="h-6 w-32 bg-muted/40 rounded-xl" />
            <div className="h-6 w-28 bg-muted/40 rounded-xl" />
          </div>
        </div>
        <div className="h-9 w-36 bg-muted/60 rounded-2xl" />
      </div>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top-Left Card */}
          <div className="bg-card border border-border/70 rounded-3xl p-7 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 w-28 bg-muted/60 rounded-xl" />
              <div className="h-7 w-32 bg-muted/40 rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-32 bg-muted/30 rounded-2xl" />
              <div className="h-32 bg-muted/30 rounded-2xl" />
            </div>
            <div className="h-24 bg-muted/30 rounded-2xl" />
            <div className="h-10 bg-muted/20 rounded-xl" />
          </div>

          {/* Bottom-Left Card */}
          <div className="bg-card border border-border/70 rounded-3xl p-7 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-6 w-36 bg-muted/60 rounded-xl" />
              <div className="h-7 w-24 bg-muted/40 rounded-full" />
            </div>
            <div className="h-48 bg-muted/20 rounded-2xl" />
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top-Right Card */}
          <div className="bg-card border border-border/70 rounded-3xl p-7 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-36 bg-muted/60 rounded-xl" />
              <div className="h-6 w-16 bg-muted/40 rounded-full" />
            </div>
            <div className="space-y-2.5">
              <div className="h-14 bg-muted/30 rounded-2xl" />
              <div className="h-14 bg-muted/30 rounded-2xl" />
              <div className="h-14 bg-muted/30 rounded-2xl" />
              <div className="h-14 bg-muted/30 rounded-2xl" />
            </div>
            <div className="h-10 bg-muted/30 rounded-full mt-2" />
          </div>

          {/* Bottom-Right Card */}
          <div className="bg-card border border-border/70 rounded-3xl p-7 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-36 bg-muted/60 rounded-xl" />
              <div className="h-6 w-16 bg-muted/40 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-muted/20 rounded-2xl" />
              <div className="h-20 bg-muted/20 rounded-2xl" />
            </div>
            <div className="h-10 bg-muted/30 rounded-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

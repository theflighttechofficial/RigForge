import React from 'react';

// Grey placeholder blocks shown while a page's code or data is loading
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-md bg-zinc-800/80 ${className}`} aria-hidden />
);

// Generic page layout: title, controls row, two content panels and a table
export const PageSkeleton: React.FC = () => (
  <div className="w-full space-y-6 py-2" role="status" aria-label="Loading page">
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-72 max-w-full" />
      <SkeletonBlock className="h-4 w-[28rem] max-w-full" />
    </div>
    <div className="flex flex-wrap gap-3">
      <SkeletonBlock className="h-10 w-56" />
      <SkeletonBlock className="h-10 w-56" />
      <SkeletonBlock className="h-10 w-32" />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonBlock className="h-64" />
      <SkeletonBlock className="h-64" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <SkeletonBlock key={i} className="h-9" />
      ))}
    </div>
    <span className="sr-only">Loading</span>
  </div>
);

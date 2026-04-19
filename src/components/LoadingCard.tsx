import React from 'react';

interface LoadingCardProps {
  count?: number;
  className?: string;
}

export default function LoadingCard({ count = 3, className = '' }: LoadingCardProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
          <div className="flex items-center gap-4">
            <div className="skeleton w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
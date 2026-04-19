import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({ width = '100%', height = '1rem', className = '', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : 'rounded-xl'} ${className}`}
      style={{ width, height }}
    />
  );
}
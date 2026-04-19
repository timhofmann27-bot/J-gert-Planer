import { useState, useEffect } from 'react';

/**
 * Hook that simulates a loading state for skeleton screens
 * Returns true for a minimum duration to prevent flash of loading state
 */
export function useSkeletonLoader(minDuration: number = 300) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  return isLoading;
}

/**
 * Hook for staggered animations
 * Returns an array of delay values for child elements
 */
export function useStaggeredAnimation(count: number, baseDelay: number = 100) {
  const [delays, setDelays] = useState<number[]>([]);

  useEffect(() => {
    const newDelays = Array.from({ length: count }, (_, i) => i * baseDelay);
    setDelays(newDelays);
  }, [count, baseDelay]);

  return delays;
}
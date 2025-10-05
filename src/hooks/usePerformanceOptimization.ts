import { useMemo, useRef, useEffect } from 'react';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Custom hook for debounced search
export const useDebouncedCallback = (callback: (...args: any[]) => void, delay: number) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useMemo(
    () => debounce((...args: any[]) => callbackRef.current(...args), delay),
    [delay]
  );
};

// Custom hook for memoized filtering
export const useMemoizedFilter = <T>(
  items: T[],
  filterFn: (item: T) => boolean,
  _dependencies: any[]
) => {
  return useMemo(() => items.filter(filterFn), [items, filterFn]);
};

// Custom hook for intersection observer (lazy loading)
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) {return;}

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback();
      }
    }, options);

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return targetRef;
};

// Custom hook for virtual scrolling
export const useVirtualScrolling = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const scrollTop = useRef(0);
  const startIndex = Math.floor(scrollTop.current / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  return {
    visibleItems,
    startIndex,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight,
  };
};
import { useEffect, useRef } from "react";

export function useIntersection(callback: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) callbackRef.current(); },
      { rootMargin: "200px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}

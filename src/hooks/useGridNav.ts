import { useCallback, useEffect, useRef, useState } from "react";

interface UseGridNavOptions {
  itemCount: number;
  numCols: number;
  enabled: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onEnter?: (index: number) => void;
}

function findFirstVisibleIndex(container: HTMLElement): number {
  const items = container.querySelectorAll<HTMLElement>("[data-grid-index]");
  const scrollParent = container.closest("[class*='overflow']") || document.documentElement;
  let best = 0;
  let bestTop = Infinity;
  items.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const absTop = rect.top + (scrollParent === document.documentElement ? window.scrollY : scrollParent.scrollTop);
    if (rect.top >= 0 && absTop < bestTop) {
      bestTop = absTop;
      best = Number(el.dataset.gridIndex);
    }
  });
  return best;
}

export function useGridNav({ itemCount, numCols, enabled, containerRef, onEnter }: UseGridNavOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const initialized = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    if (!containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-grid-index="${index}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [containerRef]);

  const navigate = useCallback((delta: number) => {
    setFocusedIndex((prev) => {
      let next: number;
      if (prev < 0 && containerRef.current) {
        next = findFirstVisibleIndex(containerRef.current);
        initialized.current = true;
      } else {
        next = Math.max(0, Math.min(prev + delta, itemCount - 1));
      }
      scrollToIndex(next);
      return next;
    });
  }, [itemCount, scrollToIndex, containerRef]);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (itemCount === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight": e.preventDefault(); navigate(1); break;
        case "ArrowLeft":  e.preventDefault(); navigate(-1); break;
        case "ArrowDown":  e.preventDefault(); navigate(numCols); break;
        case "ArrowUp":    e.preventDefault(); navigate(-numCols); break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0) onEnter?.(focusedIndex);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, itemCount, numCols, focusedIndex, navigate, onEnter]);

  const setFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    scrollToIndex(index);
  }, [scrollToIndex]);

  const resetFocus = useCallback(() => {
    setFocusedIndex(-1);
    initialized.current = false;
  }, []);

  return { focusedIndex, setFocus, resetFocus };
}

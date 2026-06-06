import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props<T> {
  items: T[];
  columnCounts?: { base: number; md: number; lg: number };
  gap?: number;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  onColumnsChange?: (cols: number) => void;
}

function getColumns(width: number, counts: { base: number; md: number; lg: number }) {
  if (width >= 1024) return counts.lg;
  if (width >= 768) return counts.md;
  return counts.base;
}

export default function MasonryGrid<T>({ items, columnCounts = { base: 2, md: 4, lg: 5 }, gap = 8, renderItem, keyExtractor, onColumnsChange }: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numCols, setNumCols] = useState(columnCounts.base);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = (cols: number) => {
      setNumCols(cols);
      onColumnsChange?.(cols);
    };
    const ro = new ResizeObserver(([entry]) => {
      update(getColumns(entry.contentRect.width, columnCounts));
    });
    ro.observe(el);
    update(getColumns(el.offsetWidth, columnCounts));
    return () => ro.disconnect();
  }, [columnCounts, onColumnsChange]);

  const columns: T[][] = Array.from({ length: numCols }, () => []);
  const heights = new Array(numCols).fill(0);
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    columns[shortest].push(item);
    heights[shortest] += 1;
  }

  return (
    <div ref={containerRef} className="flex" style={{ gap }}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 flex flex-col" style={{ gap }}>
          {col.map((item) => {
            const globalIndex = items.indexOf(item);
            return <div key={keyExtractor(item)} data-grid-index={globalIndex}>{renderItem(item, globalIndex)}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

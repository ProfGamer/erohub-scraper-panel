import { useCallback, useRef, useState } from "react";

interface ZoomPanState {
  scale: number;
  x: number;
  y: number;
}

export function useZoomPan(minScale = 1, maxScale = 8) {
  const [state, setState] = useState<ZoomPanState>({ scale: 1, x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => setState({ scale: 1, x: 0, y: 0 }), []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setState((prev) => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const next = Math.min(maxScale, Math.max(minScale, prev.scale * delta));
      if (next <= 1) return { scale: 1, x: 0, y: 0 };
      return { ...prev, scale: next };
    });
  }, [minScale, maxScale]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (state.scale <= 1) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [state.scale]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setState((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const onDoubleClick = useCallback(() => {
    setState((prev) => prev.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 3, x: 0, y: 0 });
  }, []);

  const style: React.CSSProperties = {
    transform: `translate(${state.x}px, ${state.y}px) scale(${state.scale})`,
    cursor: state.scale > 1 ? "grab" : "zoom-in",
    transition: dragging.current ? "none" : "transform 0.2s ease-out",
  };

  return { state, style, reset, handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp, onDoubleClick } };
}

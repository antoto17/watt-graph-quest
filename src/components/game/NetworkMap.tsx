import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { EdgeStates } from "@/game/graph";
import { EDGES, NODES, NODE_BY_ID } from "@/game/network";

export const MAP_W = 1600;
export const MAP_H = 1040;
const MIN_Z = 0.5;
const MAX_Z = 3.5;

export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  center: () => void;
}

interface Props {
  states: EdgeStates;
  reachable: Set<string>;
  failedNode: string | null;
  built: Set<string>;
  highlightAlternatives: boolean;
  startNode: string | null;
  currentNode: string | null;
  onNodeClick: (id: string) => void;
  onBackground: () => void;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const NetworkMap = forwardRef<MapHandle, Props>(function NetworkMap(p, ref) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const toMap = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const r = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: r.x, y: r.y };
  };

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_Z, MAX_Z);
      const f = k / v.k;
      return { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
    });
  }, []);

  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomAt(MAP_W / 2, MAP_H / 2, 1.25),
    zoomOut: () => zoomAt(MAP_W / 2, MAP_H / 2, 0.8),
    center: () => setView({ x: 0, y: 0, k: 1 }),
  }));

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { x, y } = toMap(e.clientX, e.clientY);
      zoomAt(x, y, Math.exp(-dy * 0.0015));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    const m = toMap(e.clientX, e.clientY);
    drag.current = { x: m.x, y: m.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || e.buttons !== 1) return;
    const m = toMap(e.clientX, e.clientY);
    const dx = m.x - drag.current.x;
    const dy = m.y - drag.current.y;
    if (!drag.current.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.current.moved) (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { x: m.x, y: m.y, moved: true };
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const onPointerUp = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const click = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (drag.current?.moved) return;
    p.onNodeClick(id);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={() => !drag.current?.moved && p.onBackground()}
      role="img"
      aria-label="Mapa de la red eléctrica"
    >
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {EDGES.map((e) => {
          const a = NODE_BY_ID.get(e.source)!;
          const b = NODE_BY_ID.get(e.target)!;
          const st = p.states[e.id];
          const built = p.built.has(e.id);
          const energized = st === "on" && p.reachable.has(e.source) && p.reachable.has(e.target);
          const alt = e.kind === "alternative";
          let stroke = alt && p.highlightAlternatives ? "var(--alternative)" : "var(--line-off)";
          let dash: string | undefined = "6 8";
          let width = e.kind === "main" ? 3.5 : 2.5;
          let opacity = 0.75;
          if (st === "broken") {
            stroke = "var(--fault)";
            dash = "3 7";
            opacity = 1;
          } else if (st === "on") {
            stroke = alt ? "var(--alternative)" : built ? "var(--school-on)" : "var(--power)";
            dash = undefined;
            opacity = energized ? 1 : 0.45;
            if (built) width += 1.5;
          }
          return (
            <g key={e.id} data-edge={e.id} data-state={st} pointerEvents="none">
              {built && st === "on" && (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width + 8} strokeOpacity={0.18} strokeLinecap="round" />
              )}
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeOpacity={opacity} strokeLinecap="round" />
              {energized && (
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--foreground)" strokeWidth={1.2} strokeOpacity={0.6} className="edge-flow" />
              )}
              {st === "broken" && (
              <g
                transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2})`} 
                className="fault-icon"
                >
                  <title>Conexión averiada</title>
                  <circle 
                  r={19} fill="#431b1b" 
                  stroke="#ef4444" 
                  strokeWidth={2.5}/>
                  <text
                   x={0}
                   y={8}
                   textAnchor="middle"
                   fontSize={25}
                  >
                    🔥
                  </text>
              </g>
            )}
            {alt && p.highlightAlternatives && st === "off" && (
              <g
              transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2})`}
              className="backup-icon"
              >
                <title>Ruta alternativa disponible</title>
                <circle
                r={18}
                fill="#493313"
                stroke="#f59e0b"
                strokeWidth={2}
              />
              <text
               x={0}
               y={7}
               textAnchor="middle"
               fontSize={23}
               > 
               🛡️
              </text>
            </g>
        )}
      </g>
    );
})}
        {NODES.map((n) => {
          const r = n.type === "central" ? 34 : n.type === "substation" ? 24 : n.type === "school" ? 22 : 13;
          const powered = p.reachable.has(n.id);
          const fill =
            n.type === "central"
              ? "var(--central)"
              : n.type === "substation"
                ? "var(--substation)"
                : n.type === "distribution"
                  ? "var(--distribution)"
                  : powered
                    ? "var(--school-on)"
                    : "var(--school-off)";
          const isStart = p.startNode === n.id;
          const isCurrent = p.currentNode === n.id;
          const failed = p.failedNode === n.id;
          return (
            <g key={n.id} onClick={click(n.id)} className="cursor-pointer" data-node={n.id}>
              <circle cx={n.x} cy={n.y} r={r + 14} fill="transparent" />
              {isCurrent && <circle cx={n.x} cy={n.y} r={r + 9} fill="none" stroke="var(--primary)" strokeWidth={4} strokeOpacity={0.9} className="animate-pulse" />}
              {(n.type === "school" && powered) || n.type === "central" ? (
                <circle cx={n.x} cy={n.y} r={r + 10} fill={fill} opacity={0.25} />
              ) : null}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={fill}
                stroke={failed ? "var(--fault)" : isStart ? "var(--accent)" : isCurrent ? "var(--primary)" : "var(--background)"}
                strokeWidth={failed || isCurrent || isStart ? 6 : 3}
                opacity={failed ? 0.45 : n.type !== "school" && n.type !== "central" && !powered ? 0.7 : 1}
              />
              {n.type === "school" && (
                <text x={n.x} y={n.y + 7} textAnchor="middle" fontSize={20} fill="var(--background)">
                  ⌂
                </text>
              )}
              {n.type === "central" && (
                <text x={n.x} y={n.y + 9} textAnchor="middle" fontSize={28} fill="var(--background)">
                  ⚡
                </text>
              )}
              <text
                x={n.x}
                y={n.y + r + (n.type === "distribution" ? 20 : 26)}
                textAnchor="middle"
                fontSize={n.type === "distribution" ? 20 : 25}
                fontWeight={n.type === "distribution" ? 400 : 600}
                className="map-label"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
});

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { edgeKey, type Edge, type Graph, type NodeId } from '../domain/graph';
import { edgeGeometry } from './edgeGeometry';
import { componentStyle } from './componentStyles';
import { circlePosition, clampPosition, type NodePositions, type Point } from './layout';
import { useAnimatedPositions } from './useAnimatedPositions';
import { Icon } from '../ui/Icon';

type Props = {
  graph: Graph;
  selected?: NodeId | null;
  highlighted?: readonly NodeId[];
  highlightedEdges?: readonly Edge[];
  components?: ReadonlyArray<readonly NodeId[]>;
  onSelect?: (node: NodeId) => void;
  positions?: NodePositions;
  onMove?: (node: NodeId, point: Point) => void;
};
type DisplayNode = { id: NodeId; point: Point };
const emptyPositions: NodePositions = {};

export function GraphView({
  graph,
  selected,
  highlighted = [],
  highlightedEdges = [],
  components = [],
  onSelect,
  positions = emptyPositions,
  onMove,
}: Props) {
  const arrowId = useId().replaceAll(':', '');
  const canvas = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ radius: 22, scale: 1 });
  const [dragging, setDragging] = useState<NodeId | null>(null);
  const drag = useRef<{ id: NodeId; x: number; y: number; start: Point; moved: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  const targetPositions = useMemo(
    () =>
      Object.fromEntries(
        graph.nodes.map((id, index) => [
          id,
          positions[id] ?? circlePosition(index, graph.nodes.length),
        ]),
      ),
    [graph.nodes, positions],
  );
  const animatedPositions = useAnimatedPositions(targetPositions, dragging !== null);
  const displayNodes = graph.nodes.map((id) => ({
    id,
    point: animatedPositions[id] ?? targetPositions[id],
  }));
  const previousNodes = useRef(displayNodes);
  const [leaving, setLeaving] = useState<DisplayNode[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const removed = previousNodes.current.filter((node) => !graph.nodes.includes(node.id));
    previousNodes.current = graph.nodes.map((id, index) => ({
      id,
      point: positions[id] ?? circlePosition(index, graph.nodes.length),
    }));
    if (!removed.length) return;
    const frame = requestAnimationFrame(() => {
      setLeaving((old) => [
        ...old.filter((node) => !removed.some((item) => item.id === node.id)),
        ...removed,
      ]);
      timers.current.push(
        setTimeout(
          () =>
            setLeaving((old) => old.filter((node) => !removed.some((item) => item.id === node.id))),
          280,
        ),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [graph.nodes, positions]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const element = canvas.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const node = element.querySelector<HTMLElement>('.graph-node');
      if (node && entry.contentRect.width > 0)
        setMetrics({
          radius: ((node.offsetWidth / 2) * 600) / entry.contentRect.width,
          scale: 600 / entry.contentRect.width,
        });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const activeEdges = new Set(highlightedEdges.map(edgeKey));
  function moveNode(id: NodeId, point: Point) {
    const next = clampPosition(point);
    const minimum = metrics.radius * 2 + 3 * metrics.scale;
    if (
      displayNodes.some(
        (node) =>
          node.id !== id && Math.hypot(node.point.x - next.x, node.point.y - next.y) < minimum,
      )
    )
      return;
    onMove?.(id, next);
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>, id: NodeId, point: Point) {
    if (!onMove || event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { id, x: event.clientX, y: event.clientY, start: point, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    const bounds = canvas.current?.getBoundingClientRect();
    if (!current || !bounds?.width || !onMove) return;
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    current.moved = true;
    setDragging(current.id);
    moveNode(
      current.id,
      clampPosition({
        x: current.start.x + (dx * 600) / bounds.width,
        y: current.start.y + (dy * 440) / bounds.height,
      }),
    );
  }
  function pointerEnd(event: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = !!drag.current?.moved || event.type === 'pointercancel';
    drag.current = null;
    setDragging(null);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return (
    <>
      <div
        ref={canvas}
        className={`graph-canvas ${onMove ? 'editable' : ''} ${dragging ? 'is-dragging' : ''}`}
        data-tour="canvas"
        aria-label="Grafo dirigido"
      >
        <svg
          viewBox="0 0 600 440"
          role="img"
          aria-label={`Grafo dirigido de ${graph.nodes.length} vértices y ${graph.edges.length} conexiones`}
        >
          {graph.edges.map((edge) => {
            const source = displayNodes[edge.source - 1].point,
              target = displayNodes[edge.target - 1].point;
            const shape = edgeGeometry(
              source,
              target,
              graph.edges.some(
                (other) => other.source === edge.target && other.target === edge.source,
              ),
              metrics.radius,
              metrics.scale,
              displayNodes
                .filter((node) => node.id !== edge.source && node.id !== edge.target)
                .map((node) => node.point),
            );
            const active = activeEdges.has(edgeKey(edge));
            return (
              <g key={edgeKey(edge)} className={`edge-group ${active ? 'highlighted-edge' : ''}`}>
                <title>
                  {edge.source} hacia {edge.target}
                </title>
                <path className="graph-edge" pathLength={1} d={shape.path} />
                <polygon className="arrow-head" points={shape.arrow} />
              </g>
            );
          })}
        </svg>
        {displayNodes.map(({ id, point }) => {
          const active = selected === id || highlighted.includes(id);
          const component = components.findIndex((group) => group.includes(id));
          const nodeClass = `graph-node ${active ? 'active' : ''} ${component >= 0 ? 'in-component' : ''} ${dragging === id ? 'dragging' : ''}`;
          return (
            <div
              data-tour={id === 1 ? 'vertex' : undefined}
              className={`node-slot ${dragging === id ? 'dragging' : ''}`}
              key={id}
              style={{
                left: `${point.x / 6}%`,
                top: `${point.y / 4.4}%`,
                ...(component >= 0 ? componentStyle(component) : {}),
              }}
            >
              {onSelect ? (
                <button
                  type="button"
                  className={nodeClass}
                  aria-label={`Vértice ${id}`}
                  aria-pressed={selected === id}
                  aria-describedby={`${arrowId}-help`}
                  title="Clic para conectar; arrastra o usa las flechas del teclado para mover"
                  onPointerDown={(e) => pointerDown(e, id, point)}
                  onPointerMove={pointerMove}
                  onPointerUp={pointerEnd}
                  onPointerCancel={pointerEnd}
                  onClick={() => {
                    if (suppressClick.current) {
                      suppressClick.current = false;
                      return;
                    }
                    onSelect(id);
                  }}
                  onKeyDown={(event) => {
                    if (!onMove) return;
                    const shifts: Record<string, Point> = {
                      ArrowLeft: { x: -12, y: 0 },
                      ArrowRight: { x: 12, y: 0 },
                      ArrowUp: { x: 0, y: -12 },
                      ArrowDown: { x: 0, y: 12 },
                    };
                    const delta = shifts[event.key];
                    if (delta) {
                      event.preventDefault();
                      moveNode(id, {
                        x: targetPositions[id].x + delta.x,
                        y: targetPositions[id].y + delta.y,
                      });
                    }
                  }}
                >
                  {id}
                </button>
              ) : (
                <span
                  className={nodeClass}
                  aria-label={`Vértice ${id}${active ? ', destacado' : ''}${component >= 0 ? `, componente C${component + 1}` : ''}`}
                >
                  {id}
                  {component >= 0 && <small aria-hidden="true">C{component + 1}</small>}
                </span>
              )}
            </div>
          );
        })}
        {leaving
          .filter((node) => !graph.nodes.includes(node.id))
          .map(({ id, point }) => (
            <div
              key={`leaving-${id}`}
              className="node-slot leaving"
              aria-hidden="true"
              style={{ left: `${point.x / 6}%`, top: `${point.y / 4.4}%` }}
            >
              <span className="graph-node">{id}</span>
            </div>
          ))}
        {!graph.edges.length && !components.length && (
          <div className="canvas-hint">
            {onSelect ? (
              <>
                <span className="hint-dots">● ··· ●</span>Toca dos vértices para conectar
              </>
            ) : (
              'Tu próxima idea empieza aquí'
            )}
          </div>
        )}
        <span className="sr-only" id={`${arrowId}-help`}>
          Selecciona un origen y después un destino. Arrastra o usa las flechas del teclado para
          mover.
        </span>
      </div>
      {onMove && selected && (
        <div className="node-controls" role="group" aria-label={`Mover vértice ${selected}`}>
          <span>
            Mover <b>{selected}</b>
          </span>
          {[
            { label: 'izquierda', x: -18, y: 0, rotate: 180 },
            { label: 'arriba', x: 0, y: -18, rotate: 270 },
            { label: 'abajo', x: 0, y: 18, rotate: 90 },
            { label: 'derecha', x: 18, y: 0, rotate: 0 },
          ].map((d) => (
            <button
              key={d.label}
              className="icon-button"
              aria-label={`Mover vértice ${selected} hacia ${d.label}`}
              onClick={() =>
                moveNode(selected, {
                  x: targetPositions[selected].x + d.x,
                  y: targetPositions[selected].y + d.y,
                })
              }
            >
              <Icon name="arrow" size={16} style={{ transform: `rotate(${d.rotate}deg)` }} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

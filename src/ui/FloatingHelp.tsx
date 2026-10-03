import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { Icon } from './Icon';

type Position = { x: number; y: number };
const width = 104,
  height = 56,
  margin = 16;
function clamp(p: Position): Position {
  return {
    x: Math.max(margin, Math.min(window.innerWidth - width - margin, p.x)),
    y: Math.max(margin, Math.min(window.innerHeight - height - margin, p.y)),
  };
}
function initialPosition(): Position {
  try {
    const p = JSON.parse(sessionStorage.getItem('conexa-help-position') ?? 'null');
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return clamp(p);
  } catch {
    /* Posición inicial si no hay preferencia disponible. */
  }
  return clamp({ x: window.innerWidth, y: window.innerHeight });
}

export function FloatingHelp({ onOpen }: { onOpen: () => void }) {
  const [position, setPosition] = useState(initialPosition);
  const [menu, setMenu] = useState(false);
  const [moving, setMoving] = useState(false);
  const drag = useRef<{
    pointer: number;
    x: number;
    y: number;
    start: Position;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const handle = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const hintId = useId();
  useEffect(() => {
    const resize = () => setPosition((p) => clamp(p));
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem('conexa-help-position', JSON.stringify(position));
    } catch {
      /* Sin persistencia. */
    }
  }, [position]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: globalThis.PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);
  function down(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return;
    suppressClick.current = false;
    drag.current = {
      pointer: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      start: position,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = true;
    setMoving(true);
    setMenu(false);
    setPosition(clamp({ x: d.start.x + dx, y: d.start.y + dy }));
  }
  function end(e: PointerEvent<HTMLButtonElement>) {
    suppressClick.current = !!drag.current?.moved || e.type === 'pointercancel';
    drag.current = null;
    setMoving(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function activate(action: () => void) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    action();
  }
  const pointerEvents = {
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: end,
    onPointerCancel: end,
  };
  return (
    <div
      ref={root}
      className={`help-dock ${moving ? 'moving' : ''}`}
      style={{ left: position.x, top: position.y }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setMenu(false);
          handle.current?.focus();
        }
      }}
    >
      <button
        className="help-open"
        aria-label="Ayúdame en esta etapa"
        title="Una pista, justo aquí"
        {...pointerEvents}
        onClick={() => activate(onOpen)}
      >
        <Icon name="bulb" size={25} />
      </button>
      <button
        ref={handle}
        className="help-handle"
        aria-label="Mover ayuda"
        title="Arrastra o elige una esquina"
        aria-expanded={menu}
        aria-controls={`${hintId}-positions`}
        aria-describedby={hintId}
        {...pointerEvents}
        onClick={() => activate(() => setMenu(!menu))}
        onKeyDown={(e) => {
          const shifts: Record<string, Position> = {
            ArrowLeft: { x: -20, y: 0 },
            ArrowRight: { x: 20, y: 0 },
            ArrowUp: { x: 0, y: -20 },
            ArrowDown: { x: 0, y: 20 },
          };
          if (shifts[e.key]) {
            e.preventDefault();
            const d = shifts[e.key];
            setPosition((p) => clamp({ x: p.x + d.x, y: p.y + d.y }));
          }
          if (e.key === 'Home') {
            e.preventDefault();
            setPosition(clamp({ x: window.innerWidth, y: window.innerHeight }));
          }
        }}
      >
        <Icon name="grip" size={18} />
      </button>
      <span className="sr-only" id={hintId}>
        Arrastra, usa las flechas del teclado o pulsa para elegir una esquina. Inicio restablece la
        posición.
      </span>
      {menu && (
        <div
          className={`help-positions ${position.y < window.innerHeight / 2 ? 'below' : ''} ${position.x < window.innerWidth / 2 ? 'from-left' : ''}`}
          id={`${hintId}-positions`}
        >
          <span>Colocar ayuda</span>
          <div>
            {[
              'Arriba a la izquierda',
              'Arriba a la derecha',
              'Abajo a la izquierda',
              'Abajo a la derecha',
            ].map((label, i) => (
              <button
                key={label}
                aria-label={label}
                title={label}
                onClick={() => {
                  setPosition(
                    clamp({ x: i % 2 ? window.innerWidth : 0, y: i > 1 ? window.innerHeight : 0 }),
                  );
                  setMenu(false);
                  handle.current?.focus();
                }}
              >
                <Icon name="corner" style={{ transform: `rotate(${[0, 90, 270, 180][i]}deg)` }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

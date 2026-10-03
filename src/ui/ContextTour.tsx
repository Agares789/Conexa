import { useEffect, useId, useRef, useState } from 'react';
import type { TourStep } from './tourSteps';
import { Icon } from './Icon';

export function ContextTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [bounds, setBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const maskId = useId();
  const step = steps[index];
  const last = index === steps.length - 1;
  function next() {
    if (last) onClose();
    else setIndex(index + 1);
  }
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const target = document.querySelector(`[data-tour="${step.target}"]`);
    target?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
    function measure() {
      const rect = target?.getBoundingClientRect();
      setBounds({
        x: Math.max(8, (rect?.x ?? 0) - 9),
        y: Math.max(8, (rect?.y ?? 0) - 9),
        width: Math.min(window.innerWidth - 16, (rect?.width ?? 0) + 18),
        height: (rect?.height ?? 0) + 18,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    }
    const frame = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (target) observer?.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      observer?.disconnect();
    };
  }, [step.target]);
  const cardWidth = Math.min(350, bounds.viewportWidth - 32);
  const cardHeight = 250;
  let top = bounds.y + bounds.height + 20;
  let left = Math.max(
    16,
    Math.min(bounds.x + bounds.width / 2 - cardWidth / 2, bounds.viewportWidth - cardWidth - 16),
  );
  if (top + cardHeight > bounds.viewportHeight - 12) {
    if (bounds.y > cardHeight + 24) top = bounds.y - cardHeight - 16;
    else if (bounds.x + bounds.width + cardWidth + 40 < bounds.viewportWidth) {
      left = bounds.x + bounds.width + 20;
      top = Math.max(16, bounds.y);
    } else if (bounds.x > cardWidth + 40) {
      left = bounds.x - cardWidth - 20;
      top = Math.max(16, bounds.y);
    } else top = bounds.viewportHeight - cardHeight - 16;
  }
  top = Math.max(16, Math.min(top, bounds.viewportHeight - cardHeight - 16));
  return (
    <div
      className="tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onClick={next}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        } else if (
          ['ArrowRight', 'Enter', ' '].includes(event.key) &&
          event.target === event.currentTarget
        ) {
          event.preventDefault();
          next();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          next();
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setIndex(Math.max(0, index - 1));
        } else if (event.key === 'Tab') {
          const buttons =
            panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
          if (!buttons?.length) return;
          const first = buttons[0],
            final = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            final.focus();
          } else if (!event.shiftKey && document.activeElement === final) {
            event.preventDefault();
            first.focus();
          }
        }
      }}
      tabIndex={-1}
    >
      <svg className="tour-shade" width="100%" height="100%" aria-hidden="true">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              className="spotlight-hole"
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              rx={Math.min(28, bounds.height / 2)}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="#263830"
          fillOpacity=".66"
          mask={`url(#${maskId})`}
        />
        <rect
          className="spotlight-hole"
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          rx={Math.min(28, bounds.height / 2)}
          fill="none"
          stroke="#d1f09b"
          strokeWidth="2"
        />
      </svg>
      <div ref={panel} className="tour-card" style={{ top, left, width: cardWidth }}>
        <div className="tour-top">
          <span>
            <Icon name="bulb" size={18} /> Una pista, justo aquí
          </span>
          <button
            ref={closeButton}
            className="icon-button"
            aria-label="Cerrar tutorial"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <div key={index} className="tour-copy">
          <h2 id="tour-title">{step.title}</h2>
          <p id="tour-description">{step.text}</p>
        </div>
        <div className="tour-bottom">
          <div className="tour-dots" aria-label={`Paso ${index + 1} de ${steps.length}`}>
            {steps.map((_, i) => (
              <i className={i === index ? 'current' : ''} key={i} />
            ))}
          </div>
          <div>
            <button
              className="text-button"
              disabled={index === 0}
              onClick={(event) => {
                event.stopPropagation();
                setIndex(index - 1);
              }}
            >
              Atrás
            </button>
            <button
              className="button primary small"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
            >
              {last ? '¡A explorar!' : 'Siguiente'}
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
        <p className="tour-hint">Toca cualquier parte de la pantalla para continuar</p>
      </div>
    </div>
  );
}

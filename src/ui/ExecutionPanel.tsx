import { useEffect, useState, type Dispatch } from 'react';
import type { Action } from '../app/state';
import type { CompleteExecution, ExecutionPhase } from '../execution/types';
import { MatrixView } from '../visualization/MatrixView';
import { Icon } from './Icon';

const phases: Record<ExecutionPhase, { label: string; caption: string }> = {
  adjacency: { label: 'Adyacencia', caption: 'Matriz de adyacencia A' },
  reflexive: { label: 'Diagonal', caption: 'Matriz de trabajo · preparación de la diagonal' },
  paths: { label: 'Caminos', caption: 'Matriz de caminos R · cierre booleano' },
  counts: { label: 'Conteo de unos', caption: 'Matriz de caminos · conteo por fila' },
  rows: { label: 'Ordenar filas', caption: 'Matriz con filas reordenadas' },
  columns: { label: 'Ordenar columnas', caption: 'Matriz con filas y columnas reordenadas' },
  components: { label: 'Componentes', caption: 'Bloques de componentes fuertemente conexas' },
};

export function ExecutionPanel({
  execution,
  index,
  dispatch,
  paused = false,
}: {
  execution: CompleteExecution;
  index: number;
  dispatch: Dispatch<Action>;
  paused?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const step = execution.steps[index];
  const isLast = index === execution.steps.length - 1;
  const active = playing && !isLast && !paused;
  const destinations = Object.entries(phases).map(([phase, content]) => ({
    phase,
    label: content.label,
    index: execution.steps.findIndex((item) => item.phase === phase),
  }));
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => dispatch({ type: 'move', delta: 1 }), 1700);
    return () => clearTimeout(timer);
  }, [active, index, dispatch]);
  function act(action: Action) {
    setPlaying(false);
    dispatch(action);
  }
  return (
    <section className="side-panel card execution-panel" aria-label="Procedimiento paso a paso">
      <div data-tour="phases">
        <div className="execution-heading">
          <span className="section-kicker">Paso a paso</span>
          <span className="pill">
            {index + 1} / {execution.steps.length}
          </span>
        </div>
        <label className="phase-picker" htmlFor="execution-phase">
          <span className="sr-only">Ir a una etapa</span>
          <select
            id="execution-phase"
            value={step.phase}
            onChange={(event) => {
              const destination = destinations.find((item) => item.phase === event.target.value);
              if (destination) act({ type: 'jump', index: destination.index });
            }}
          >
            {destinations.map((destination) => (
              <option key={destination.phase} value={destination.phase}>
                {destination.label}
              </option>
            ))}
          </select>
        </label>
        <input
          className="timeline"
          aria-label="Paso del procedimiento"
          aria-valuetext={`Paso ${index + 1} de ${execution.steps.length}: ${step.title}`}
          type="range"
          min={0}
          max={execution.steps.length - 1}
          value={index}
          onChange={(event) => act({ type: 'jump', index: Number(event.target.value) })}
        />
      </div>
      <div className="step-copy" key={step.id} aria-live={active ? 'off' : 'polite'}>
        <h2>{step.title}</h2>
        {step.witness && (
          <div className="path-witness">
            <Icon name="connect" size={16} />
            <span>{step.witness.join(' → ')}</span>
          </div>
        )}
      </div>
      <div data-tour="matrix">
        <MatrixView
          matrix={step.after}
          rows={step.rowOrder}
          columns={step.columnOrder}
          changed={step.changedCells}
          counts={step.rowCounts}
          components={step.components}
          caption={phases[step.phase].caption}
        />
      </div>
      {!!step.changedCells.length && (
        <p className="matrix-key">
          <span /> Celda actualizada
        </p>
      )}
      <div className="step-controls" data-tour="playback">
        <button
          className="icon-button"
          aria-label="Paso anterior"
          disabled={index === 0}
          onClick={() => act({ type: 'move', delta: -1 })}
        >
          <Icon name="back" />
        </button>
        <button
          className={`icon-button play-button ${active ? 'playing' : ''}`}
          aria-label={active ? 'Pausar reproducción' : 'Reproducir pasos'}
          aria-pressed={active}
          disabled={isLast}
          onClick={() => setPlaying(!playing)}
        >
          <Icon name={active ? 'pause' : 'play'} size={18} />
        </button>
        <button
          className="button primary"
          onClick={() => act(isLast ? { type: 'result' } : { type: 'move', delta: 1 })}
        >
          {isLast ? 'Ver resultado' : 'Siguiente'}
          <Icon name="arrow" size={18} />
        </button>
      </div>
      <div className="execution-shortcuts">
        <button
          className="text-button"
          disabled={index === 0}
          onClick={() => act({ type: 'restart' })}
        >
          <Icon name="reset" size={14} />
          Reiniciar
        </button>
        {!isLast && (
          <button className="text-button" onClick={() => act({ type: 'result' })}>
            Ir al resultado <Icon name="arrow" size={14} />
          </button>
        )}
      </div>
      <details className="context-help" data-tour="explanation">
        <summary>¿Por qué este paso?</summary>
        <p>{step.explanation}</p>
      </details>
      <details className="context-help">
        <summary>Ver matriz antes de este paso</summary>
        <MatrixView
          matrix={step.before}
          rows={step.beforeRowOrder ?? step.rowOrder}
          columns={step.beforeColumnOrder ?? step.columnOrder}
          caption="Matriz anterior al paso actual"
        />
      </details>
      <details className="context-help">
        <summary>Comparar con la matriz original</summary>
        <MatrixView
          matrix={execution.steps[0].after}
          rows={execution.graph.nodes}
          caption="Matriz original, sin modificaciones"
        />
      </details>
    </section>
  );
}

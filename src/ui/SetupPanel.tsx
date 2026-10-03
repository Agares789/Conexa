import { useState, type FormEvent } from 'react';
import { createGraph, nodeCountError, type Graph } from '../domain/graph';
import { generateGraph, lectureGraph } from '../generation/generateGraph';
import { Icon } from './Icon';

export function SetupPanel({
  onCreate,
  onCountChange,
}: {
  onCreate: (graph: Graph) => void;
  onCountChange: (count: number) => void;
}) {
  const [count, setCount] = useState('5');
  const [mode, setMode] = useState<'manual' | 'random'>('manual');
  const [error, setError] = useState<string | null>(null);
  function changeCount(value: string) {
    setCount(value);
    setError(null);
    if (!nodeCountError(Number(value))) onCountChange(Number(value));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const validation = nodeCountError(Number(count));
    setError(validation);
    if (!validation)
      onCreate(mode === 'manual' ? createGraph(Number(count)) : generateGraph(Number(count)));
  }
  return (
    <section className="setup-panel card" aria-labelledby="setup-title">
      <span className="section-kicker">A tu manera</span>
      <h2 id="setup-title">
        Todo empieza
        <br />
        con unos puntos.
      </h2>
      <p className="muted">Elige cuántos. Después, conéctalos.</p>
      <form onSubmit={submit} noValidate>
        <div data-tour="size">
          <label className="field-label" htmlFor="node-count">
            Cantidad de vértices <span>4–12</span>
          </label>
          <div className="count-stepper">
            <button
              type="button"
              className="icon-button"
              aria-label="Quitar un vértice"
              disabled={Number(count) <= 4}
              onClick={() => changeCount(String(Math.max(4, Number(count) - 1)))}
            >
              <Icon name="minus" />
            </button>
            <input
              id="node-count"
              name="nodes"
              type="number"
              inputMode="numeric"
              min={4}
              max={12}
              step={1}
              value={count}
              onChange={(event) => changeCount(event.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'count-error' : undefined}
            />
            <button
              type="button"
              className="icon-button"
              aria-label="Añadir un vértice"
              disabled={Number(count) >= 12}
              onClick={() => changeCount(String(Math.min(12, Number(count) + 1)))}
            >
              <Icon name="plus" />
            </button>
          </div>
        </div>
        {error && (
          <p id="count-error" className="error" role="alert">
            {error}
          </p>
        )}
        <fieldset className="mode-options" data-tour="mode">
          <legend>Tu punto de partida</legend>
          {(['manual', 'random'] as const).map((value) => (
            <label key={value} className={`mode ${mode === value ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <Icon name={value === 'manual' ? 'connect' : 'shuffle'} />
              <span>
                <strong>{value === 'manual' ? 'Manual' : 'Aleatorio'}</strong>
                <small>
                  {value === 'manual' ? 'Empieza desde cero' : 'Prueba una combinación'}
                </small>
              </span>
              <span className="radio-mark">
                {mode === value && <Icon name="check" size={12} />}
              </span>
            </label>
          ))}
        </fieldset>
        <button className="button primary full" type="submit" data-tour="create">
          Crear grafo <Icon name="arrow" />
        </button>
      </form>
      <button className="example-link" onClick={() => onCreate(lectureGraph())}>
        <span className="mini-icon">
          <Icon name="book" size={18} />
        </span>
        <span>
          <strong>Abrir ejemplo de la lectura</strong>
          <small>5 vértices. Una buena primera prueba.</small>
        </span>
        <Icon name="arrow" size={17} />
      </button>
    </section>
  );
}

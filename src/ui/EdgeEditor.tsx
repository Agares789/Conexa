import { useState, type FormEvent } from 'react';
import type { Graph, NodeId } from '../domain/graph';
import { Icon } from './Icon';

export function EdgeEditor({
  graph,
  onToggle,
}: {
  graph: Graph;
  onToggle: (source: NodeId, target: NodeId) => void;
}) {
  const [chosenSource, setSource] = useState(1);
  const [chosenTarget, setTarget] = useState(2);
  const source = Math.min(chosenSource, graph.nodes.length);
  const target = Math.min(chosenTarget, graph.nodes.length);
  const [error, setError] = useState('');
  const exists = graph.edges.some((edge) => edge.source === source && edge.target === target);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (source === target) {
      setError('Elige dos vértices diferentes; este grafo no admite lazos.');
      return;
    }
    setError('');
    onToggle(source, target);
  }
  return (
    <form className="edge-editor" onSubmit={submit}>
      <div className="edge-fields">
        <label htmlFor="edge-source">
          Origen
          <select
            id="edge-source"
            value={source}
            onChange={(event) => {
              setSource(Number(event.target.value));
              setError('');
            }}
          >
            {graph.nodes.map((node) => (
              <option key={node}>{node}</option>
            ))}
          </select>
        </label>
        <span>
          <Icon name="arrow" size={18} />
        </span>
        <label htmlFor="edge-target">
          Destino
          <select
            id="edge-target"
            value={target}
            onChange={(event) => {
              setTarget(Number(event.target.value));
              setError('');
            }}
          >
            {graph.nodes.map((node) => (
              <option key={node}>{node}</option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="button full">
        {exists ? 'Quitar conexión' : 'Añadir conexión'}
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}

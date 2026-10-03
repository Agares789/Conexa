import type { Dispatch } from 'react';
import type { Action } from '../app/state';
import type { CompleteExecution } from '../execution/types';
import { MatrixView } from '../visualization/MatrixView';
import { componentStyle } from '../visualization/componentStyles';
import { Icon } from './Icon';

export function ResultPanel({
  execution,
  dispatch,
  onNewGraph,
}: {
  execution: CompleteExecution;
  dispatch: Dispatch<Action>;
  onNewGraph: () => void;
}) {
  const { components, orderedMatrix, order } = execution.result;
  return (
    <section className="side-panel card result-panel" aria-label="Resultado de componentes">
      <p className="section-kicker">Conexiones que van y vuelven</p>
      <div className="result-total" role="status">
        <strong>{components.length}</strong>
        <h2>
          {components.length === 1
            ? 'componente fuertemente conexa'
            : 'componentes fuertemente conexas'}
        </h2>
      </div>
      <p className="muted">
        {components.length === 1
          ? 'Todos los vértices se alcanzan entre sí, respetando la dirección de las flechas.'
          : 'Dentro de cada grupo existe un camino de ida y vuelta entre cualquier par de vértices.'}
      </p>
      <ul className="component-list" data-tour="groups" aria-label="Vértices por componente">
        {components.map((group, index) => (
          <li key={group.join('-')} style={componentStyle(index)}>
            <span className="component-tag">C{index + 1}</span>
            <div>
              <strong>Vértices: {group.join(', ')}</strong>
              <span>
                {group.length} {group.length === 1 ? 'vértice' : 'vértices'}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <details className="context-help">
        <summary>Ver bloques en la matriz</summary>
        <MatrixView
          matrix={orderedMatrix}
          rows={order}
          components={components}
          caption="Matriz final · bloques de componentes"
        />
      </details>
      <button className="button light full" onClick={() => dispatch({ type: 'resume' })}>
        Revisar procedimiento <Icon name="arrow" />
      </button>
      <button
        className="button primary full new-graph-action"
        data-tour="continue"
        onClick={onNewGraph}
      >
        <Icon name="plus" /> Crear otro grafo
      </button>
      <details className="context-help">
        <summary>¿Qué significa una componente de un solo vértice?</summary>
        <p>
          Ese vértice no tiene caminos de ida y vuelta con otros. Puede estar aislado o tener
          conexiones en un único sentido hacia otras componentes.
        </p>
      </details>
    </section>
  );
}

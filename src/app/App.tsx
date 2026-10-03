import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { adjacencyMatrix, createGraph, type Graph } from '../domain/graph';
import { generateGraph, lectureGraph } from '../generation/generateGraph';
import { runComponents } from '../math/runComponents';
import { GraphView } from '../visualization/GraphView';
import { MatrixView } from '../visualization/MatrixView';
import { circlePosition, type NodePositions } from '../visualization/layout';
import { SetupPanel } from '../ui/SetupPanel';
import { ContextTour } from '../ui/ContextTour';
import { tourSteps } from '../ui/tourSteps';
import { EdgeEditor } from '../ui/EdgeEditor';
import { ExecutionPanel } from '../ui/ExecutionPanel';
import { ResultPanel } from '../ui/ResultPanel';
import { Icon, type IconName } from '../ui/Icon';
import { Welcome, LearnPage, CreditsPage } from '../ui/Welcome';
import { ScreenCurtain } from '../ui/ScreenCurtain';
import { useScreenTransition } from '../ui/useScreenTransition';
import { ThemeToggle } from '../ui/ThemeToggle';
import { FloatingHelp } from '../ui/FloatingHelp';
import { initialWorkspace, workspaceReducer, type Action } from './state';

type Page = 'home' | 'lab' | 'learn' | 'credits';
const stages: { label: string; icon: IconName }[] = [
  { label: 'Configura', icon: 'plus' },
  { label: 'Conecta', icon: 'connect' },
  { label: 'Observa', icon: 'grid' },
  { label: 'Explora', icon: 'play' },
  { label: 'Descubre', icon: 'spark' },
];
const stageIndex = { setup: 0, build: 1, review: 2, execution: 3, result: 4 };
const titles = {
  setup: 'Prepara tu espacio.',
  build: 'Un lienzo. Tus conexiones.',
  review: 'Mira lo que conectaste.',
  execution: 'Sigue las conexiones.',
  result: 'Cada grupo, una historia.',
};
const subtitles = {
  setup: 'Elige los puntos de partida.',
  build: 'Toca para conectar. Arrastra para acomodar.',
  review: 'Cada flecha tiene su lugar en la matriz.',
  execution: 'Descubre cómo aparecen los caminos y sus componentes.',
  result: 'Los vértices que pueden ir y volver entre sí.',
};

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [state, rawDispatch] = useReducer(workspaceReducer, initialWorkspace);
  const [tourOpen, setTourOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState(5);
  const [positions, setPositions] = useState<NodePositions>({});
  const { phase, mode, transition, busy } = useScreenTransition();
  const dispatch = useCallback(
    (action: Action) => {
      if (['review', 'edit', 'execute', 'result', 'resume', 'setup'].includes(action.type))
        transition(() => rawDispatch(action));
      else rawDispatch(action);
    },
    [transition],
  );
  const content = useRef<HTMLDivElement>(null);
  const previewGraph = useMemo(() => createGraph(previewCount), [previewCount]);
  const graph = state.stage === 'setup' ? previewGraph : state.graph;
  const matrix = adjacencyMatrix(graph);
  const currentStep = state.stage === 'execution' ? state.execution.steps[state.index] : null;
  useEffect(() => {
    if (busy) return;
    content.current?.querySelector<HTMLElement>('h1')?.focus();
    window.scrollTo?.({ top: 0, behavior: 'instant' });
  }, [page, state.stage, busy]);
  function navigate(nextPage: Page, transitionMode: 'wave' | 'slide' = 'slide') {
    if (page === nextPage) return;
    setTourOpen(false);
    transition(() => setPage(nextPage), transitionMode);
  }
  function startOver() {
    transition(() => {
      rawDispatch({ type: 'setup' });
      setPreviewCount(5);
      setPositions({});
    });
  }
  function create(nextGraph: Graph, guided = false) {
    transition(() => {
      setPositions({});
      dispatch({ type: 'create', graph: nextGraph });
      setPage('lab');
      setTourOpen(guided);
    });
  }
  function resize(count: number) {
    if (count < 4 || count > 12) return;
    setPositions((old) =>
      Object.fromEntries(Object.entries(old).filter(([id]) => Number(id) <= count)),
    );
    dispatch({ type: 'resize', count });
  }
  return (
    <>
      <div
        className="app-shell"
        data-transition={mode === 'slide' && phase !== 'idle' ? `slide-${phase}` : undefined}
        ref={content}
        inert={tourOpen || busy}
      >
        <a className="skip-link" href="#main-content">
          Saltar al contenido
        </a>
        <header className="site-header">
          <button
            className="brand"
            aria-label="Conexa, ir al inicio"
            onClick={() => navigate('home')}
          >
            <span className="brand-symbol">
              <Icon name="connect" size={23} />
            </span>
            conexa<span className="brand-dot">.</span>
          </button>
          <nav className="top-nav" aria-label="Navegación principal">
            {(
              [
                { id: 'home', name: 'Inicio' },
                { id: 'lab', name: 'Laboratorio' },
                { id: 'learn', name: 'Tutorial' },
                { id: 'credits', name: 'Créditos' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                className={page === item.id ? 'selected' : ''}
                aria-current={page === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                {item.name}
              </button>
            ))}
          </nav>
          <div className="header-end">
            <ThemeToggle />
            {page === 'lab' ? (
              <button
                className="icon-button help-button"
                title="Una guía para esta pantalla"
                aria-label="Abrir tutorial de esta pantalla"
                onClick={() => setTourOpen(true)}
              >
                <Icon name="bulb" size={23} />
              </button>
            ) : null}
          </div>
        </header>
        {page === 'home' && (
          <Welcome
            onStart={() => navigate('lab', 'wave')}
            onTutorial={() => navigate('learn', 'wave')}
          />
        )}
        {page === 'learn' && <LearnPage onTry={() => create(lectureGraph(), true)} />}
        {page === 'credits' && <CreditsPage />}
        {page === 'lab' && (
          <main id="main-content" className="lab-page">
            <div className="page-intro">
              <div>
                <span className="breadcrumb">
                  Tu laboratorio <span>/</span> {stages[stageIndex[state.stage]].label}
                </span>
                <h1 tabIndex={-1}>{titles[state.stage]}</h1>
                <p>{subtitles[state.stage]}</p>
              </div>
              {state.stage !== 'setup' && (
                <button className="button light small" onClick={startOver}>
                  <Icon name="plus" size={17} />
                  Nuevo grafo
                </button>
              )}
            </div>
            <ol className="stage-nav" aria-label="Etapas del laboratorio">
              {stages.map(({ label, icon }, index) => (
                <li
                  key={label}
                  className={
                    index === stageIndex[state.stage]
                      ? 'current'
                      : index < stageIndex[state.stage]
                        ? 'done'
                        : ''
                  }
                  aria-current={index === stageIndex[state.stage] ? 'step' : undefined}
                >
                  <span className="stage-number">
                    <Icon name={index < stageIndex[state.stage] ? 'check' : icon} size={17} />
                  </span>
                  <span>{label}</span>
                  <small>0{index + 1}</small>
                </li>
              ))}
            </ol>
            <div className="stage-content" key={state.stage}>
              {state.stage === 'setup' ? (
                <div className="workspace setup-workspace">
                  <SetupPanel onCreate={create} onCountChange={setPreviewCount} />
                  <section className="preview-panel card" aria-label="Vista previa del grafo">
                    <div className="panel-topline">
                      <span className="section-kicker">Así empieza tu grafo</span>
                      <span className="pill live">
                        <span className="live-dot" /> En vivo
                      </span>
                    </div>
                    <GraphView graph={previewGraph} />
                    <div className="preview-bottom">
                      <span>
                        <strong key={previewCount}>{previewCount}</strong> vértices, infinitas
                        posibilidades.
                      </span>
                      <Icon name="spark" size={25} />
                    </div>
                  </section>
                </div>
              ) : (
                <div className="workspace active-workspace">
                  <section className="graph-panel card" aria-labelledby="graph-title">
                    <div className="panel-topline">
                      <h2 id="graph-title">
                        Tu grafo <span className="pill">Dirigido</span>
                      </h2>
                      <span className="graph-stats">
                        {graph.nodes.length} vértices · {graph.edges.length}{' '}
                        {graph.edges.length === 1 ? 'conexión' : 'conexiones'}
                      </span>
                    </div>
                    {state.stage === 'build' && (
                      <div className="canvas-toolbar">
                        <span className="canvas-instruction" data-tour="tools">
                          <Icon name="move" size={16} /> Clic para conectar · arrastra para mover
                        </span>
                        <div className="vertex-controls" data-tour="vertices">
                          <button
                            className="icon-button"
                            aria-label="Quitar último vértice"
                            title="Quitar último vértice y sus conexiones"
                            disabled={graph.nodes.length <= 4}
                            onClick={() => resize(graph.nodes.length - 1)}
                          >
                            <Icon name="minus" size={17} />
                          </button>
                          <span>
                            {graph.nodes.length}
                            <small>vértices</small>
                          </span>
                          <button
                            className="icon-button"
                            aria-label="Añadir vértice"
                            disabled={graph.nodes.length >= 12}
                            onClick={() => resize(graph.nodes.length + 1)}
                          >
                            <Icon name="plus" size={17} />
                          </button>
                        </div>
                      </div>
                    )}
                    <GraphView
                      graph={graph}
                      positions={positions}
                      selected={state.stage === 'build' ? state.selectedNode : null}
                      highlighted={currentStep?.highlightedNodes}
                      highlightedEdges={currentStep?.highlightedEdges}
                      components={
                        state.stage === 'result'
                          ? state.execution.result.components
                          : currentStep?.components
                      }
                      onSelect={
                        state.stage === 'build'
                          ? (node) => dispatch({ type: 'select', node })
                          : undefined
                      }
                      onMove={
                        state.stage === 'build'
                          ? (node, point) => setPositions((old) => ({ ...old, [node]: point }))
                          : undefined
                      }
                    />
                    <div className="graph-footer">
                      <span className="footer-dot" />
                      <p role={state.stage === 'build' ? 'status' : undefined}>
                        {state.stage === 'build'
                          ? state.message
                          : currentStep?.witness
                            ? `Recorrido: ${currentStep.witness.join(' → ')}`
                            : state.stage === 'result'
                              ? 'Cada etiqueta C identifica una componente.'
                              : 'Las flechas originales se conservan.'}
                      </p>
                    </div>
                    <div className="graph-toolbar">
                      {state.stage === 'build' ? (
                        <button
                          className="text-button"
                          onClick={() =>
                            setPositions(
                              Object.fromEntries(
                                graph.nodes.map((node, index) => [
                                  node,
                                  circlePosition(index, graph.nodes.length),
                                ]),
                              ),
                            )
                          }
                        >
                          <Icon name="reset" size={16} />
                          Ordenar vértices
                        </button>
                      ) : (
                        <button
                          className="button light small"
                          onClick={() => dispatch({ type: 'edit' })}
                        >
                          <Icon name="back" size={16} />
                          Editar grafo
                        </button>
                      )}
                      <span className="quiet-label">4–12 vértices · sin lazos</span>
                    </div>
                  </section>
                  {state.stage === 'build' && (
                    <section className="side-panel card" aria-labelledby="connections-title">
                      <span className="section-kicker">Haz una conexión</span>
                      <h2 id="connections-title">¿A dónde vamos?</h2>
                      <p className="muted">Elige el origen y el destino de la flecha.</p>
                      <div data-tour="edge-editor">
                        <EdgeEditor
                          graph={graph}
                          onToggle={(source, target) =>
                            dispatch({ type: 'toggle', source, target })
                          }
                        />
                      </div>
                      <details className="context-help">
                        <summary>
                          Conexiones <span className="count-badge">{graph.edges.length}</span>
                        </summary>
                        {graph.edges.length ? (
                          <ul className="edge-list">
                            {graph.edges.map((edge) => (
                              <li key={`${edge.source}-${edge.target}`}>
                                <span>
                                  {edge.source} <Icon name="arrow" size={13} /> {edge.target}
                                </span>
                                <button
                                  className="icon-button"
                                  aria-label={`Eliminar conexión ${edge.source} a ${edge.target}`}
                                  onClick={() => dispatch({ type: 'toggle', ...edge })}
                                >
                                  <Icon name="close" size={14} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            Tu grafo aún no tiene flechas. También puedes explorar vértices
                            aislados.
                          </p>
                        )}
                      </details>
                      <details className="context-help">
                        <summary>Ver matriz actual</summary>
                        <MatrixView
                          matrix={matrix}
                          rows={graph.nodes}
                          caption="Matriz de adyacencia actual"
                        />
                      </details>
                      <div className="secondary-actions">
                        <button
                          className="button light small"
                          onClick={() =>
                            dispatch({ type: 'create', graph: generateGraph(graph.nodes.length) })
                          }
                        >
                          <Icon name="shuffle" size={16} />
                          Al azar
                        </button>
                        <button
                          className="icon-button"
                          title="Vaciar conexiones"
                          aria-label="Vaciar conexiones"
                          disabled={!graph.edges.length}
                          onClick={() =>
                            dispatch({ type: 'create', graph: createGraph(graph.nodes.length) })
                          }
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>
                      <button
                        className="button primary full"
                        data-tour="continue"
                        onClick={() => dispatch({ type: 'review' })}
                      >
                        Revisar matriz <Icon name="arrow" />
                      </button>
                    </section>
                  )}
                  {state.stage === 'review' && (
                    <section className="side-panel card" aria-labelledby="matrix-title">
                      <span className="section-kicker">De flechas a números</span>
                      <h2 id="matrix-title">Tu matriz de adyacencia</h2>
                      <div data-tour="matrix">
                        <MatrixView
                          matrix={matrix}
                          rows={graph.nodes}
                          caption="Matriz de adyacencia A"
                        />
                      </div>
                      <div className="matrix-legend">
                        <span>
                          <b>1</b> Hay conexión
                        </span>
                        <span>
                          <b>0</b> No hay conexión
                        </span>
                      </div>
                      <details className="context-help">
                        <summary>¿Cómo se lee?</summary>
                        <p>
                          La fila indica el origen y la columna el destino. La diagonal empieza en
                          cero porque el grafo no tiene lazos.
                        </p>
                      </details>
                      <button
                        className="button primary full"
                        data-tour="continue"
                        onClick={() =>
                          dispatch({ type: 'execute', execution: runComponents(state.graph) })
                        }
                      >
                        Iniciar procedimiento <Icon name="play" size={17} />
                      </button>
                    </section>
                  )}
                  {state.stage === 'execution' && (
                    <ExecutionPanel
                      execution={state.execution}
                      index={state.index}
                      dispatch={dispatch}
                      paused={tourOpen || busy}
                    />
                  )}
                  {state.stage === 'result' && (
                    <ResultPanel
                      execution={state.execution}
                      dispatch={dispatch}
                      onNewGraph={startOver}
                    />
                  )}
                </div>
              )}
            </div>
            <footer className="page-footer">
              <span>
                <Icon name="leaf" size={15} /> Un espacio para aprender haciendo.
              </span>
              <span>Método matricial · Lectura 5.1</span>
            </footer>
          </main>
        )}
        {page === 'lab' && <FloatingHelp onOpen={() => setTourOpen(true)} />}
      </div>
      {mode === 'wave' && <ScreenCurtain phase={phase} />}
      {tourOpen && !busy && page === 'lab' && (
        <ContextTour
          key={state.stage + (currentStep?.phase ?? '')}
          steps={tourSteps(state.stage, currentStep?.phase)}
          onClose={() => setTourOpen(false)}
        />
      )}
    </>
  );
}

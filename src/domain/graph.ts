export const MIN_NODES = 4;
export const MAX_NODES = 12;

export type NodeId = number;
export type Edge = Readonly<{ source: NodeId; target: NodeId }>;
export type Matrix = ReadonlyArray<ReadonlyArray<0 | 1>>;
export type Graph = Readonly<{
  kind: 'directed';
  nodes: readonly NodeId[];
  edges: readonly Edge[];
}>;

export function nodeCountError(value: number): string | null {
  return Number.isInteger(value) && value >= MIN_NODES && value <= MAX_NODES
    ? null
    : 'Ingresa un número entero entre 4 y 12.';
}

export function edgeKey(edge: Edge): string {
  return `${edge.source}-${edge.target}`;
}

export function createGraph(count: number, edges: readonly Edge[] = []): Graph {
  const error = nodeCountError(count);
  if (error) throw new Error(error);
  const nodes = Array.from({ length: count }, (_, index) => index + 1);
  const keys = new Set<string>();
  for (const edge of edges) {
    if (!nodes.includes(edge.source) || !nodes.includes(edge.target)) {
      throw new Error('Cada conexión debe unir vértices del grafo actual.');
    }
    if (edge.source === edge.target) throw new Error('Elige dos vértices diferentes.');
    if (keys.has(edgeKey(edge))) throw new Error('La conexión ya existe.');
    keys.add(edgeKey(edge));
  }
  return { kind: 'directed', nodes, edges: edges.map((edge) => ({ ...edge })) };
}

export function toggleEdge(graph: Graph, source: NodeId, target: NodeId): Graph {
  const exists = graph.edges.some((edge) => edge.source === source && edge.target === target);
  const edges = exists
    ? graph.edges.filter((edge) => edge.source !== source || edge.target !== target)
    : [...graph.edges, { source, target }];
  return createGraph(graph.nodes.length, edges);
}

/** Al reducir el tamaño, quita los últimos vértices y sus conexiones. */
export function resizeGraph(graph: Graph, count: number): Graph {
  return createGraph(
    count,
    graph.edges.filter((edge) => edge.source <= count && edge.target <= count),
  );
}

export function adjacencyMatrix(graph: Graph): Matrix {
  const edges = new Set(graph.edges.map(edgeKey));
  return graph.nodes.map((source) =>
    graph.nodes.map((target) => (edges.has(edgeKey({ source, target })) ? 1 : 0)),
  );
}

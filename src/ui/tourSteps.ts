import type { Workspace } from '../app/state';
import type { ExecutionPhase } from '../execution/types';

export type TourStep = { target: string; title: string; text: string };
const phaseTips: Record<ExecutionPhase, string> = {
  adjacency: 'Cada fila es un origen y cada columna, un destino. Un 1 representa una flecha.',
  reflexive:
    'Encendemos la diagonal: cada vértice puede alcanzarse a sí mismo sin recorrer una flecha.',
  paths:
    'Buscamos caminos pasando por un vértice intermedio. Cada nuevo 1 viene acompañado de un recorrido real.',
  counts: 'Contamos cuántos vértices se alcanzan desde cada fila. Mira la columna Σ.',
  rows: 'Las filas se ordenan según sus unos. Las etiquetas conservan el número de cada vértice.',
  columns: 'Las columnas siguen el mismo orden que las filas. Así aparecen los bloques.',
  components:
    'Cada bloque reúne vértices que pueden ir y regresar entre sí. Los colores y las etiquetas C los identifican.',
};

export function tourSteps(
  stage: Workspace['stage'],
  phase: ExecutionPhase = 'adjacency',
): TourStep[] {
  if (stage === 'setup')
    return [
      {
        target: 'size',
        title: 'Empieza por los vértices',
        text: 'Usa + y −, o escribe un número entre 4 y 12. Verás los cambios al instante.',
      },
      {
        target: 'mode',
        title: 'Elige cómo empezar',
        text: 'Manual te deja conectar todo a tu manera. Aleatorio crea una red que también podrás editar.',
      },
      {
        target: 'create',
        title: 'Tu lienzo está listo',
        text: 'Pulsa Crear grafo para empezar a conectar. El ejemplo de la lectura también es una buena primera prueba.',
      },
    ];
  if (stage === 'build')
    return [
      {
        target: 'vertex',
        title: 'Conecta dos puntos',
        text: 'Toca un vértice de origen y después un destino. Repite la pareja para quitar su flecha.',
      },
      {
        target: 'tools',
        title: 'Muévelos a tu manera',
        text: 'Arrastra cualquier vértice. También puedes enfocarlo con Tab y usar las flechas del teclado.',
      },
      {
        target: 'vertices',
        title: 'Haz crecer tu grafo',
        text: 'Añade un vértice con +. El botón − quita el último y sus conexiones. Puedes tener entre 4 y 12.',
      },
      {
        target: 'edge-editor',
        title: 'Otra forma de conectar',
        text: 'Elige origen y destino en estos selectores. El botón añade o quita esa conexión.',
      },
      {
        target: 'continue',
        title: 'Descubre su matriz',
        text: 'Cuando estés listo, continúa. Siempre puedes volver a editar tu grafo.',
      },
    ];
  if (stage === 'review')
    return [
      { target: 'matrix', title: 'Tus conexiones, en números', text: phaseTips.adjacency },
      {
        target: 'continue',
        title: 'Mira cómo se transforma',
        text: 'Inicia el procedimiento y avanza a tu ritmo. Cada cambio tendrá una explicación.',
      },
    ];
  if (stage === 'execution')
    return [
      { target: 'matrix', title: 'Lo que estás viendo', text: phaseTips[phase] },
      {
        target: 'playback',
        title: 'Tú marcas el ritmo',
        text: 'Avanza, retrocede o activa la reproducción automática. Puedes pausarla en cualquier momento.',
      },
      {
        target: 'phases',
        title: 'Ve directo a una etapa',
        text: 'Salta entre diagonal, caminos, orden y componentes. La barra te lleva a un paso concreto.',
      },
      {
        target: 'explanation',
        title: 'Una explicación cuando la necesites',
        text: 'Abre ¿Por qué este paso? para ver el detalle. También puedes comparar con la matriz anterior y la original.',
      },
    ];
  return [
    {
      target: 'groups',
      title: 'Estos son tus grupos',
      text: 'Dentro de cada componente hay caminos de ida y vuelta entre sus vértices.',
    },
    {
      target: 'canvas',
      title: 'Encuéntralos en el grafo',
      text: 'Las etiquetas C y los colores relacionan cada vértice con su grupo. Puede haber flechas entre grupos distintos.',
    },
    {
      target: 'continue',
      title: 'Sigue explorando',
      text: 'Crea otro grafo desde cero con este botón. También puedes revisar el procedimiento o editar el actual.',
    },
  ];
}

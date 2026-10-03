import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('educational workspace', () => {
  it('uses a wave only for the two portada buttons', async () => {
    const user = userEvent.setup();
    const matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Cómo funciona' }));
    expect(document.querySelector('.curtain-shield .wave-crest')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
  it('adds and removes live vertices, removes incident edges and moves a node with the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Empezar a explorar' }));
    await user.click(screen.getByRole('button', { name: 'Crear grafo' }));
    await user.click(screen.getByRole('button', { name: 'Añadir vértice' }));
    await user.click(screen.getByRole('button', { name: 'Vértice 6' }));
    await user.click(screen.getByRole('button', { name: 'Vértice 2' }));
    expect(screen.getByText('6 vértices · 1 conexión')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Origen'), '6');
    await user.click(screen.getByRole('button', { name: 'Quitar último vértice' }));
    expect(screen.queryByRole('button', { name: 'Vértice 6' })).not.toBeInTheDocument();
    expect(screen.getByText('5 vértices · 0 conexiones')).toBeInTheDocument();
    expect(screen.getByLabelText('Origen')).toHaveValue('5');
    const node = screen.getByRole('button', { name: 'Vértice 1' });
    const before = node.parentElement!.style.left;
    node.focus();
    await user.keyboard('{ArrowRight}');
    expect(node.parentElement!.style.left).not.toBe(before);
    expect(screen.getByText('5 vértices · 0 conexiones')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Créditos' }));
    expect(screen.getByText('Kenneth Anthony Cortez Pantaleon')).toBeInTheDocument();
    expect(screen.getByText('Universidad Peruana de Ciencias Aplicadas')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Laboratorio' }));
    expect(screen.getByRole('button', { name: 'Vértice 1' }).parentElement!.style.left).toBe(
      node.parentElement!.style.left,
    );
  });
  it('validates sizes, creates a manual graph, edits an arc and navigates real preparation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Empezar a explorar' }));
    const count = screen.getByLabelText(/Cantidad de vértices/);
    await user.clear(count);
    await user.type(count, '13');
    await user.click(screen.getByRole('button', { name: /Crear grafo/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('entero entre 4 y 12');
    await user.clear(count);
    await user.type(count, '4');
    await user.click(screen.getByRole('button', { name: /Crear grafo/ }));
    await user.click(screen.getByRole('button', { name: 'Vértice 1' }));
    await user.click(screen.getByRole('button', { name: 'Vértice 2' }));
    expect(screen.getByRole('status')).toHaveTextContent('1 → 2 añadida');
    await user.click(screen.getByRole('button', { name: /Revisar matriz/ }));
    const original = screen.getByRole('table', { name: 'Matriz de adyacencia A' });
    expect(within(original).getAllByRole('row')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: /Iniciar procedimiento/ }));
    expect(screen.getByRole('button', { name: /anterior/ })).toBeDisabled();
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(
      screen.getByRole('heading', { name: 'El vértice 4 se alcanza a sí mismo' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ir al resultado' }));
    expect(screen.getByRole('status')).toHaveTextContent('4componentes fuertemente conexas');
    await user.click(screen.getByRole('button', { name: /Revisar procedimiento/ }));
    await user.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(
      screen.getByRole('heading', { name: 'Partimos de la matriz de adyacencia' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Editar grafo/ }));
    expect(screen.getByRole('button', { name: 'Vértice 1' })).toBeInTheDocument();
  });
  it('advances a contextual tour with the backdrop and closes it with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Empezar a explorar' }));
    await user.click(screen.getByRole('button', { name: 'Abrir tutorial de esta pantalla' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Empieza por los vértices');
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.getByRole('dialog')).toHaveTextContent('Elige cómo empezar');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Abrir ejemplo/ }));
    expect(screen.getByText('5 vértices · 7 conexiones')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Destino'), '1');
    await user.click(screen.getByRole('button', { name: /Añadir conexión/ }));
    expect(screen.getByRole('alert')).toHaveTextContent('dos vértices diferentes');
  });
  it('creates a random graph at the upper boundary and returns twelve isolated components', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Empezar a explorar' }));
    const count = screen.getByLabelText(/Cantidad de vértices/);
    await user.clear(count);
    await user.type(count, '12');
    await user.click(screen.getByRole('radio', { name: /Aleatorio/ }));
    await user.click(screen.getByRole('button', { name: /Crear grafo/ }));
    expect(screen.getByText('12 vértices · 0 conexiones')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Vértice / })).toHaveLength(12);
    await user.click(screen.getByRole('button', { name: /Revisar matriz/ }));
    await user.click(screen.getByRole('button', { name: /Iniciar procedimiento/ }));
    await user.click(screen.getByRole('button', { name: 'Ir al resultado' }));
    expect(
      within(screen.getByRole('list', { name: 'Vértices por componente' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(12);
    expect(screen.getByLabelText('Vértice 12, componente C12')).toBeInTheDocument();
  });
  it('runs the lecture example through all steps by keyboard and renders final blocks and labels', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Empezar a explorar' }));
    await user.click(screen.getByRole('button', { name: /Abrir ejemplo/ }));
    await user.click(screen.getByRole('button', { name: /Revisar matriz/ }));
    await user.click(screen.getByRole('button', { name: /Iniciar procedimiento/ }));
    let iterations = 0;
    while (screen.queryByRole('button', { name: 'Siguiente' })) {
      screen.getByRole('button', { name: 'Siguiente' }).focus();
      await user.keyboard('{Enter}');
      if (++iterations > 100) throw new Error('The lecture trace did not finish.');
    }
    expect(screen.getByRole('heading', { name: '2 componentes encontradas' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver resultado' }));
    const list = screen.getByRole('list', { name: 'Vértices por componente' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Vértices: 1, 2, 4')).toBeInTheDocument();
    expect(within(list).getByText('Vértices: 3, 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Vértice 4, componente C1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Revisar procedimiento/ }));
    await user.selectOptions(screen.getByLabelText('Ir a una etapa'), 'rows');
    const current = screen.getByRole('table', { name: 'Matriz con filas reordenadas' });
    expect(
      within(current)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['1', '2', '4', '3', '5']);
    await user.click(screen.getByText('Ver matriz antes de este paso'));
    const before = screen.getByRole('table', { name: 'Matriz anterior al paso actual' });
    expect(
      within(before)
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent),
    ).toEqual(['1', '2', '3', '4', '5']);
    await user.click(screen.getByRole('button', { name: /Editar grafo/ }));
    await user.click(screen.getByRole('button', { name: 'Vaciar conexiones' }));
    await user.click(screen.getByRole('button', { name: /Revisar matriz/ }));
    await user.click(screen.getByRole('button', { name: /Iniciar procedimiento/ }));
    await user.click(screen.getByRole('button', { name: 'Ir al resultado' }));
    expect(
      within(screen.getByRole('list', { name: 'Vértices por componente' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Crear otro grafo' }));
    expect(screen.getByLabelText(/Cantidad de vértices/)).toHaveValue(5);
  }, 15000);
});

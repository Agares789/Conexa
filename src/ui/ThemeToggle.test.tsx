import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('tema visual', () => {
  it('abre siempre de día y permite cambiar durante la sesión', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    localStorage.setItem('conexa-theme', 'dark');
    const user = userEvent.setup();
    const { unmount } = render(<ThemeToggle />);
    const switcher = screen.getByRole('switch', { name: 'Modo oscuro' });
    expect(switcher).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.dataset.theme).toBe('light');
    await user.click(switcher);
    expect(switcher).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    unmount();
    render(<ThemeToggle />);
    expect(screen.getByRole('switch', { name: 'Modo oscuro' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    vi.unstubAllGlobals();
  });
});

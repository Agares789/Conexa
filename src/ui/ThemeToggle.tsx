import { useLayoutEffect, useState } from 'react';
import { Icon } from './Icon';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  return (
    <button
      className="theme-toggle"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Modo oscuro"
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <span className="theme-track" aria-hidden="true">
        <Icon name="sun" size={16} />
        <Icon name="moon" size={16} />
        <span className="theme-thumb">
          <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} />
        </span>
      </span>
      <span className="theme-label">{theme === 'dark' ? 'Noche' : 'Día'}</span>
    </button>
  );
}

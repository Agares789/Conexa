# Conexa

Laboratorio web del Proyecto D de Matemática Computacional de la Universidad Peruana de Ciencias Aplicadas (UPC). Permite construir grafos dirigidos de 4 a 12 vértices y explorar, paso a paso, su matriz de caminos y sus componentes fuertemente conexas.

## Equipo

- Kenneth Anthony Cortez Pantaleon
- Enrique Lopez Loyola
- Alexander Edilberto Liñan Lezama
- Jean Andre Contreras Perea
- Johan Joel Rojas Valero

## Desarrollo local

Requisitos: Node.js 24 y pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abre la dirección indicada por Vite, normalmente `http://127.0.0.1:5173/`.

```sh
pnpm check    # formato, lint, tipos, pruebas y compilación
pnpm build    # genera dist/
pnpm preview  # sirve localmente la compilación
```

## Estructura

- `src/domain`: grafo y matriz de adyacencia.
- `src/generation`: generación aleatoria y ejemplo de la lectura.
- `src/math`: cierre de caminos, ordenamiento y componentes.
- `src/execution`: pasos del procedimiento.
- `src/visualization`: grafo SVG y matrices.
- `src/ui` y `src/app`: pantallas, controles y flujo.
- `public`: favicon y logo UPC.

Las posiciones de los vértices y el grafo actual se conservan al navegar entre pantallas durante la sesión. La página abre en modo claro; el interruptor permite pasar al modo oscuro.

## Publicación

El programa es estático y no requiere backend. `pnpm build` genera `dist/`; Netlify puede usar `netlify.toml` y Vercel `vercel.json`. El repositorio debe contener el código fuente y el lockfile; `node_modules/` y `dist/` se reconstruyen y están excluidos por `.gitignore`.

La referencia académica del ejemplo es la Lectura 5.1, página 3, de la asignatura. Las fuentes Fraunces y Plus Jakarta Sans llegan mediante sus paquetes npm con licencia SIL Open Font License. El logo UPC procede de [Enfoque UPC](https://enfoque.upc.edu.pe/logo-upc/).

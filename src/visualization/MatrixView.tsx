import type { Matrix, NodeId } from '../domain/graph';
import type { Cell } from '../execution/types';
import { componentStyle } from './componentStyles';

type Props = {
  matrix: Matrix;
  rows: readonly NodeId[];
  columns?: readonly NodeId[];
  caption: string;
  changed?: readonly Cell[];
  counts?: readonly (number | null)[];
  components?: ReadonlyArray<readonly NodeId[]>;
};

export function MatrixView({
  matrix,
  rows,
  columns = rows,
  caption,
  changed = [],
  counts,
  components = [],
}: Props) {
  return (
    <div className="matrix-scroll" role="region" aria-label={caption} tabIndex={0}>
      <table className="matrix">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" aria-label="Origen hacia destino">
              ↗
            </th>
            {columns.map((node) => (
              <th key={node} scope="col">
                {node}
              </th>
            ))}
            {counts && (
              <th scope="col" aria-label="Cantidad de unos en la fila">
                Σ
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={rows[i]}>
              <th scope="row">{rows[i]}</th>
              {row.map((value, j) => {
                const isChanged = changed.some((cell) => cell.row === i && cell.column === j);
                const blockIndex = components.findIndex(
                  (group) => group.includes(rows[i]) && group.includes(columns[j]),
                );
                const group = components[blockIndex];
                const borders = group
                  ? [
                      !group.includes(rows[i - 1]) ? 'block-top' : '',
                      !group.includes(rows[i + 1]) ? 'block-bottom' : '',
                      !group.includes(columns[j - 1]) ? 'block-left' : '',
                      !group.includes(columns[j + 1]) ? 'block-right' : '',
                    ].join(' ')
                  : '';
                return (
                  <td
                    key={columns[j]}
                    className={`${value ? 'one' : ''} ${isChanged ? 'changed' : ''} ${group ? 'component-cell' : ''} ${borders}`}
                    style={group ? componentStyle(blockIndex) : undefined}
                  >
                    {value}
                    {isChanged && <span className="sr-only">, celda modificada en este paso</span>}
                    {group && <span className="sr-only">, bloque C{blockIndex + 1}</span>}
                  </td>
                );
              })}
              {counts && <td className="row-count">{counts[i] ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

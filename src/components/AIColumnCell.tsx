import { AI_COLUMN_KINDS } from './aiColumns'
import type { AIColumnCellProps } from './aiColumns'

/** Render one AI column's cell for a row, whatever its kind. */
export function AIColumnCell({ engine, column, rowId }: AIColumnCellProps) {
  const { Cell } = AI_COLUMN_KINDS[column.kind]
  return <Cell engine={engine} column={column} rowId={rowId} />
}

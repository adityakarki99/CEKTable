import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { EngineState } from '../core'
import { CategoryCell } from './CategoryCell'
import { useEngineState } from './useEngine'
import { CATEGORY_COLORS } from './types'
import type { AIColumnCellProps, AIColumnOptionsProps } from './aiColumns'

// Per-kind cells and option controls. The registry in ./aiColumns wires them up.

const NOT_COMPUTED = 'not computed yet'

/** Plain value cell: subscribes itself, so it updates when the engine does. */
function ValueCell({ engine, children }: Pick<AIColumnCellProps, 'engine'> & { children: (state: EngineState) => ReactNode }) {
  const state = useEngineState(engine)
  return <span className="ai-cell num">{children(state)}</span>
}

export function CategoryColumnCell({ engine, rowId }: AIColumnCellProps) {
  return <CategoryCell engine={engine} rowId={rowId} />
}

export function OutlierColumnCell({ engine, rowId }: AIColumnCellProps) {
  return <ValueCell engine={engine}>{state => String(state.outliers[rowId] ?? NOT_COMPUTED)}</ValueCell>
}

export function SimilarityColumnCell({ engine, column, rowId }: AIColumnCellProps) {
  return (
    <ValueCell engine={engine}>
      {() => {
        if (rowId === column.anchor) return 'this row'
        return engine.similarity(column.anchor ?? '', rowId)?.toFixed(2) ?? NOT_COMPUTED
      }}
    </ValueCell>
  )
}

export function CategoryOptions({ engine, options, onChange }: AIColumnOptionsProps) {
  const state = useEngineState(engine)
  const { space } = state
  // Live preview: discovery is instant, so apply it as the control changes.
  const applyK = (k: number) => {
    onChange({ k })
    engine.discoverCategories(k)
  }
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const id of state.rowIds) {
      const v = state.categories[id]?.value
      if (v) out[v] = (out[v] ?? 0) + 1
    }
    return out
  }, [state.rowIds, state.categories])

  return (
    <>
      <div className="form-group">
        <label htmlFor="ai-k">Groups</label>
        <div className="stepper" id="ai-k">
          {[2, 3, 4, 5, 6].map(n => (
            <button type="button" key={n} className={options.k === n ? 'active' : ''} onClick={() => applyK(n)}>{n}</button>
          ))}
        </div>
      </div>
      {space ? (
        <ul className="preview-list" aria-label="Preview of groups">
          {space.categories.map((c, i) => (
            <li key={c.value}>
              <i style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <span className="label">{c.label}</span>
              <span className="count">{counts[c.value] ?? 0}</span>
            </li>
          ))}
        </ul>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => applyK(options.k)}>Preview groups</button>
      )}
    </>
  )
}

export function SimilarityOptions({ rowIds, options, onChange }: AIColumnOptionsProps) {
  return (
    <div className="form-group">
      <label htmlFor="ai-anchor">Anchor row</label>
      <select id="ai-anchor" className="form-input" value={options.anchor} onChange={e => onChange({ anchor: e.target.value })}>
        {rowIds.map(id => <option key={id} value={id}>{id}</option>)}
      </select>
    </div>
  )
}

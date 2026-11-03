import { useState } from 'react'
import type { EngineTable } from '../core'
import { CATEGORY_COLORS } from './types'

/** Category chip with an inline correction menu. Dot first, label, faint confidence. */
export function CategoryCell({ engine, rowId }: { engine: EngineTable<unknown>; rowId: string }) {
  const [open, setOpen] = useState(false)
  const cell = engine.state.categories[rowId]
  const space = engine.state.space
  if (!cell || !space) return <span className="ai-cell">not computed yet</span>
  const idx = space.categories.findIndex(c => c.value === cell.value)
  return (
    <span className="ai-category-wrap">
      <button
        type="button"
        className={`ai-chip ${cell.flagged ? 'flagged' : ''}`}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Click to correct"
      >
        <i style={{ background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
        {cell.label}
        <small>{Math.round(cell.confidence * 100)}%{cell.flagged ? ' review' : ''}</small>
      </button>
      {open && (
        <span className="ai-menu" onClick={e => e.stopPropagation()}>
          {space.categories.map((c, i) => (
            <button type="button" key={c.value} onClick={() => { engine.correct(rowId, c.value); setOpen(false) }}>
              <i style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />{c.label}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

import { useMemo, useState } from 'react'
import type { EngineTable, ChartResult } from '../core'
import { CATEGORY_KEY } from '../core'
import { CategoryCell } from './CategoryCell'
import { CATEGORY_COLORS } from './types'
import type { AIColumn, AIColumnKind } from './types'

/** Which panel occupies the single right-hand slot. */
export type PanelState = { kind: 'add' } | { kind: 'row'; rowId: string } | null

interface AddColumnPanelProps {
  engine: EngineTable<unknown>
  rowIds: string[]
  onAdd: (col: Omit<AIColumn, 'id'>) => void
  onClose: () => void
}

/** Column setup beside the data, with a live preview of the groups it would create. */
export function AddColumnPanel({ engine, rowIds, onAdd, onClose }: AddColumnPanelProps) {
  const [kind, setKind] = useState<AIColumnKind>('category')
  const [k, setK] = useState(engine.state.space?.categories.length ?? 4)
  const [anchor, setAnchor] = useState(rowIds[0] ?? '')
  const [name, setName] = useState('')

  const defaultName = kind === 'category' ? 'Category' : kind === 'outlier' ? 'Unusual' : `Similar to ${anchor}`

  // Live preview: discovery is instant, so apply it as the control changes.
  const applyK = (n: number) => {
    setK(n)
    engine.discoverCategories(n)
  }
  const space = engine.state.space
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const id of engine.state.rowIds) {
      const v = engine.state.categories[id]?.value
      if (v) out[v] = (out[v] ?? 0) + 1
    }
    return out
  }, [engine.state.rowIds, engine.state.categories])

  return (
    <div className="side-panel" role="dialog" aria-label="Add AI column">
      <div className="panel-head">
        <h3>Add AI column</h3>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
      <div className="panel-body">
        <div className="seg" role="radiogroup" aria-label="Column kind">
          {(['category', 'outlier', 'similarity'] as AIColumnKind[]).map(kd => (
            <button type="button" key={kd} role="radio" aria-checked={kind === kd} className={kind === kd ? 'active' : ''} onClick={() => setKind(kd)}>
              {kd === 'category' ? 'Categories' : kd === 'outlier' ? 'Outlier score' : 'Similarity'}
            </button>
          ))}
        </div>
        <p className="panel-help">
          {kind === 'category' && 'Groups rows by how alike they are. Click any chip later to correct it.'}
          {kind === 'outlier' && 'Scores each row 0–100 by distance from its own group.'}
          {kind === 'similarity' && 'Scores every row by closeness to one anchor row.'}
        </p>
        {kind === 'category' && (
          <>
            <div className="form-group">
              <label htmlFor="ai-k">Groups</label>
              <div className="stepper" id="ai-k">
                {[2, 3, 4, 5, 6].map(n => (
                  <button type="button" key={n} className={k === n ? 'active' : ''} onClick={() => applyK(n)}>{n}</button>
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
              <button type="button" className="btn-secondary" onClick={() => applyK(k)}>Preview groups</button>
            )}
          </>
        )}
        {kind === 'similarity' && (
          <div className="form-group">
            <label htmlFor="ai-anchor">Anchor row</label>
            <select id="ai-anchor" className="form-input" value={anchor} onChange={e => setAnchor(e.target.value)}>
              {rowIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="ai-name">Column name</label>
          <input id="ai-name" type="text" className="form-input" value={name} placeholder={defaultName} onChange={e => setName(e.target.value)} />
        </div>
      </div>
      <div className="panel-foot">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={() => onAdd({ header: name.trim() || defaultName, kind, k, anchor })}>
          Add column
        </button>
      </div>
    </div>
  )
}

interface RowDetailPanelProps {
  engine: EngineTable<unknown>
  rowId: string
  onSelectRow: (rowId: string) => void
  onClose: () => void
}

/** A row's fields, its nearest rows, why it got its category, and one chart. */
export function RowDetailPanel({ engine, rowId, onSelectRow, onClose }: RowDetailPanelProps) {
  const idx = engine.state.rowIds.indexOf(rowId)
  const row = (engine.rows[idx] ?? {}) as Record<string, unknown>
  const profile = engine.state.profile
  const space = engine.state.space
  const cell = engine.state.categories[rowId]
  const outlier = engine.state.outliers[rowId]
  const neighbors = useMemo(() => engine.neighbors(rowId, 5), [engine, rowId])
  const numericKey = Object.values(profile).find(p => p.type === 'number')?.key
  const chart: ChartResult | null = useMemo(
    () => (space && numericKey ? engine.chart({ x: CATEGORY_KEY, y: numericKey }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, space, numericKey, engine.state.version]
  )
  const nameKey = Object.values(profile).find(p => p.type === 'text' || p.type === 'id')?.key
  const title = nameKey ? String(row[nameKey]) : rowId

  return (
    <div className="side-panel" role="dialog" aria-label="Row detail">
      <div className="panel-head">
        <h3 title={title}>{title}</h3>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
      <div className="panel-body">
        <dl className="fields">
          {Object.keys(profile).map(key => (
            <div key={key}>
              <dt>{key}</dt>
              <dd className={profile[key].type === 'number' ? 'num' : ''}>{String(row[key] ?? '')}</dd>
            </div>
          ))}
        </dl>

        {space && cell && (
          <section>
            <h4>Why this category</h4>
            <div className="why">
              <CategoryCell engine={engine} rowId={rowId} />
              <p>
                {Math.round(cell.confidence * 100)}% confidence by distance to the group's prototype
                {cell.flagged ? ', below the review threshold' : ''}.
                {outlier != null ? ` Unusual: ${outlier} of 100.` : ''}
              </p>
            </div>
          </section>
        )}

        <section>
          <h4>Similar rows</h4>
          <ul className="neighbors">
            {neighbors.map(n => (
              <li key={n.rowId}>
                <button type="button" onClick={() => onSelectRow(n.rowId)}>{n.rowId}</button>
                <span className="num">{n.similarity.toFixed(2)}{n.similarity > 0.9 ? ' · duplicate?' : ''}</span>
              </li>
            ))}
            {neighbors.length === 0 && <li className="empty">No other rows yet.</li>}
          </ul>
        </section>

        {chart && (
          <section>
            <h4>{chart.title}</h4>
            <MiniBar chart={chart} highlight={cell?.label} />
          </section>
        )}
      </div>
    </div>
  )
}

/** Tiny bar renderer for one engine chart. A Vega-Lite runtime is not required inside the component. */
export function MiniBar({ chart, highlight }: { chart: ChartResult; highlight?: string }) {
  const values = chart.spec.data.values as { category?: string; value: number; [k: string]: unknown }[]
  const xField = chart.spec.encoding.x.field
  const max = Math.max(...values.map(v => v.value), 0) || 1
  const W = 280
  const BAR = 22
  const GAP = 8
  const H = values.length * (BAR + GAP)
  return (
    <svg className="mini-bar" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chart.title}>
      {values.map((v, i) => {
        const label = String(v[xField])
        const w = Math.max(2, (v.value / max) * (W - 120))
        const y = i * (BAR + GAP)
        const hot = highlight != null && label === highlight
        return (
          <g key={label} transform={`translate(0 ${y})`}>
            <text x="0" y={BAR / 2 + 4} fontSize="11" fill="var(--cek-text-muted)">{label.length > 14 ? label.slice(0, 13) + '…' : label}</text>
            <rect x="96" y="3" width={w} height={BAR - 6} rx="4" fill={hot ? 'var(--cek-accent)' : 'var(--cek-accent-soft-hover)'} />
            <text x={96 + w + 6} y={BAR / 2 + 4} fontSize="11" fill="var(--cek-text-faint)" style={{ fontVariantNumeric: 'tabular-nums' }}>{Number.isInteger(v.value) ? v.value : v.value.toFixed(1)}</text>
          </g>
        )
      })}
    </svg>
  )
}

import { useMemo, useState } from 'react'
import type { EngineTable, ChartResult } from '../core'
import { CATEGORY_KEY } from '../core'
import { CategoryCell } from './CategoryCell'
import { AI_COLUMN_KINDS, AI_COLUMN_KIND_ORDER } from './aiColumns'
import type { AIColumnOptions } from './aiColumns'
import { useEngineState } from './useEngine'
import type { AIColumn, AIColumnKind } from './types'

/** Which panel occupies the single right-hand slot. */
export type PanelState = { kind: 'add' } | { kind: 'row'; rowId: string } | null

interface AddColumnPanelProps {
  engine: EngineTable<unknown>
  rowIds: string[]
  onAdd: (col: Omit<AIColumn, 'id'>) => void
  onClose: () => void
}

/** Column setup beside the data. Kind-specific controls come from the AI column registry. */
export function AddColumnPanel({ engine, rowIds, onAdd, onClose }: AddColumnPanelProps) {
  const [kind, setKind] = useState<AIColumnKind>('category')
  const [options, setOptions] = useState<AIColumnOptions>(() => ({
    k: engine.state.space?.categories.length ?? 4,
    anchor: rowIds[0] ?? '',
  }))
  const [name, setName] = useState('')

  const def = AI_COLUMN_KINDS[kind]
  const defaultName = def.defaultName(options)
  const Options = def.Options

  return (
    <div className="side-panel" role="dialog" aria-label="Add AI column">
      <div className="panel-head">
        <h3>Add AI column</h3>
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
      <div className="panel-body">
        <div className="seg" role="radiogroup" aria-label="Column kind">
          {AI_COLUMN_KIND_ORDER.map(kd => (
            <button type="button" key={kd} role="radio" aria-checked={kind === kd} className={kind === kd ? 'active' : ''} onClick={() => setKind(kd)}>
              {AI_COLUMN_KINDS[kd].label}
            </button>
          ))}
        </div>
        <p className="panel-help">{def.help}</p>
        {Options && (
          <Options engine={engine} rowIds={rowIds} options={options} onChange={patch => setOptions(o => ({ ...o, ...patch }))} />
        )}
        <div className="form-group">
          <label htmlFor="ai-name">Column name</label>
          <input id="ai-name" type="text" className="form-input" value={name} placeholder={defaultName} onChange={e => setName(e.target.value)} />
        </div>
      </div>
      <div className="panel-foot">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={() => onAdd({ header: name.trim() || defaultName, kind, ...options })}>
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
  const state = useEngineState(engine)
  const { profile, space } = state
  const row = (engine.rows[state.rowIds.indexOf(rowId)] ?? {}) as Record<string, unknown>
  const cell = state.categories[rowId]
  const outlier = state.outliers[rowId]
  const neighbors = useMemo(
    () => engine.neighbors(rowId, 5),
    // Vectors change only on re-encode, which bumps the version.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, rowId, state.rowIds]
  )
  const numericKey = Object.values(profile).find(p => p.type === 'number')?.key
  const chart: ChartResult | null = useMemo(
    () => (space && numericKey ? engine.chart({ x: CATEGORY_KEY, y: numericKey }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, space, numericKey, state.version]
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

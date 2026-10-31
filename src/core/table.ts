import { assignCategory, correctCategory, discoverCategories, drift } from './category'
import { recommendCharts, toVegaLite } from './charts'
import { hashingEncoder } from './encoders/hashing'
import { dot } from './math'
import { profile as profileRows } from './profile'
import type { CategoryCell, CategorySpace, ChartResult, Encoder, Neighbor, Profile, RowRecord, Vector } from './types'

export interface CreateTableOptions<T> {
  data: T[]
  getRowId?: (row: T, index: number) => string
  encoder?: Encoder
  /** Columns the encoder should ignore (ids, timestamps, free notes). */
  exclude?: string[]
  /** Column used to name exemplars and fallback labels. Defaults to the first text or id column. */
  nameKey?: string
}

export interface EngineState {
  encoderId: string
  rowIds: string[]
  profile: Profile
  space: CategorySpace | null
  categories: Record<string, CategoryCell>
  /** 0–100 distance from the row's own prototype; present after `scoreOutliers()`. */
  outliers: Record<string, number>
  charts: ChartResult[]
  /** Monotonic counter so subscribers can cheaply detect change. */
  version: number
}

export interface EngineTable<T> {
  readonly state: EngineState
  readonly rows: T[]
  subscribe(listener: (state: EngineState) => void): () => void
  /** Re-encode every row. Called on creation; call again after `setData`. */
  encode(): void
  setData(data: T[]): void
  vector(rowId: string): Vector | undefined
  discoverCategories(k: number, opts?: { minConfidence?: number }): CategorySpace
  loadCategories(space: CategorySpace): void
  correct(rowId: string, value: string): void
  scoreOutliers(): Record<string, number>
  neighbors(rowId: string, k?: number): Neighbor[]
  recommendCharts(opts?: { max?: number }): ChartResult[]
  chart(opts: { x: string; y?: string }): ChartResult
  drift(rowIds?: string[]): number
}

const defaultGetRowId = <T,>(row: T, index: number): string => {
  const id = (row as RowRecord).id
  return id != null ? String(id) : String(index)
}

/**
 * The headless engine. Owns rows, vectors, the category space and derived cells.
 * No DOM, no React, no model runtime: a Node script and the React adapter use the same object.
 */
export function createTable<T extends object>(opts: CreateTableOptions<T>): EngineTable<T> {
  const encoder = opts.encoder ?? hashingEncoder()
  const getRowId = opts.getRowId ?? defaultGetRowId<T>
  let rows: T[] = opts.data
  let vectors: Record<string, Vector> = {}
  const listeners = new Set<(s: EngineState) => void>()
  const state: EngineState = { encoderId: encoder.id, rowIds: [], profile: {}, space: null, categories: {}, outliers: {}, charts: [], version: 0 }

  const emit = () => {
    state.version++
    const snapshot = { ...state }
    for (const l of listeners) l(snapshot)
  }
  const nameKey = () => opts.nameKey ?? Object.values(state.profile).find((p) => p.type === 'text' || p.type === 'id')?.key ?? state.rowIds[0]
  const records = () => rows as unknown as RowRecord[]
  const vecList = () => state.rowIds.map((id) => vectors[id])
  const labels = () => (state.space ? state.rowIds.map((id) => state.categories[id]?.label ?? state.space!.fallback) : null)

  const reassign = () => {
    if (!state.space) return
    const cells: Record<string, CategoryCell> = {}
    for (const id of state.rowIds) cells[id] = assignCategory(state.space, vectors[id])
    state.categories = cells
  }
  const rescore = () => {
    if (!state.space) return
    const raw: Record<string, number> = {}
    for (const id of state.rowIds) {
      const cell = state.categories[id]
      const cat = state.space.categories.find((c) => c.value === cell.value)!
      raw[id] = (1 - dot(vectors[id], cat.prototype)) / cat.radius
    }
    const max = Math.max(...Object.values(raw)) || 1
    const out: Record<string, number> = {}
    for (const id of state.rowIds) out[id] = Math.round((100 * raw[id]) / max)
    state.outliers = out
  }

  const table: EngineTable<T> = {
    get state() {
      return state
    },
    get rows() {
      return rows
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    encode() {
      state.profile = profileRows(records(), { exclude: opts.exclude })
      state.rowIds = rows.map((r, i) => getRowId(r, i))
      vectors = {}
      records().forEach((r, i) => (vectors[state.rowIds[i]] = encoder.encode(r, state.profile)))
      if (state.space) reassign()
      if (Object.keys(state.outliers).length) rescore()
      state.charts = []
      emit()
    },
    setData(data) {
      rows = data
      table.encode()
    },
    vector(rowId) {
      return vectors[rowId]
    },
    discoverCategories(k, o = {}) {
      state.space = discoverCategories(vecList(), records(), state.profile, { k, encoderId: encoder.id, nameKey: nameKey(), minConfidence: o.minConfidence })
      reassign()
      if (Object.keys(state.outliers).length) rescore()
      emit()
      return state.space
    },
    loadCategories(space) {
      if (space.encoder !== encoder.id) throw new Error(`Category space was built with encoder "${space.encoder}", table uses "${encoder.id}"`)
      state.space = space
      reassign()
      emit()
    },
    correct(rowId, value) {
      if (!state.space) throw new Error('No category space to correct')
      state.space = correctCategory(state.space, value, rowId, vectors[rowId])
      reassign()
      if (Object.keys(state.outliers).length) rescore()
      emit()
    },
    scoreOutliers() {
      if (!state.space) table.discoverCategories(Math.min(4, Math.max(2, Math.round(Math.sqrt(rows.length / 2)))))
      rescore()
      emit()
      return state.outliers
    },
    neighbors(rowId, k = 5) {
      const v = vectors[rowId]
      if (!v) return []
      return state.rowIds
        .filter((id) => id !== rowId)
        .map((id) => ({ rowId: id, similarity: dot(v, vectors[id]) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
    },
    recommendCharts(o = {}) {
      const cands = recommendCharts(records(), state.profile, labels(), o)
      state.charts = cands.map((c) => toVegaLite(c, { rows: records(), rowIds: state.rowIds, labels: labels(), vectors: vecList() }))
      emit()
      return state.charts
    },
    chart({ x, y }) {
      const px = state.profile[x]
      const kind = y && px?.type === 'number' ? 'scatter' : 'bar'
      return toVegaLite({ kind, x, y, agg: y ? 'mean' : 'count', score: 1, why: 'explicit' }, { rows: records(), rowIds: state.rowIds, labels: labels(), vectors: vecList() })
    },
    drift(ids) {
      if (!state.space) return 0
      return drift(state.space, (ids ?? state.rowIds).map((id) => vectors[id]).filter(Boolean))
    },
  }
  table.encode()
  return table
}

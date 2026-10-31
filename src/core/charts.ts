import { pca2 } from './math'
import type { ChartCandidate, ChartResult, Profile, RowRecord, VegaLiteSpec, Vector } from './types'

/**
 * How much each column explains the current category structure.
 * Numbers: between/within variance ratio. Enums: normalised mutual information.
 * Without labels, falls back to a cardinality / spread heuristic.
 */
export function explanatoryPower(rows: RowRecord[], prof: Profile, labels: string[] | null): Record<string, number> {
  const out: Record<string, number> = {}
  for (const key in prof) {
    const p = prof[key]
    if (p.type === 'id' || p.type === 'text') continue
    if (!labels) {
      out[key] = p.type === 'enum' ? 0.5 / Math.sqrt(p.cardinality) : Math.min(1, (p.sd ?? 0) / (Math.abs(p.mean ?? 0) + 1e-6))
      continue
    }
    if (p.type === 'number') {
      const groups: Record<string, number[]> = {}
      rows.forEach((r, i) => (groups[labels[i]] ??= []).push(r[key] as number))
      const gm = rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length
      let between = 0
      let within = 0
      for (const l in groups) {
        const g = groups[l]
        const m = g.reduce((a, c) => a + c, 0) / g.length
        between += g.length * (m - gm) ** 2
        for (const x of g) within += (x - m) ** 2
      }
      out[key] = Math.min(1, between / (between + within + 1e-9))
    } else {
      const n = rows.length
      const cx: Record<string, number> = {}
      const cy: Record<string, number> = {}
      const cxy: Record<string, number> = {}
      rows.forEach((r, i) => {
        const x = String(r[key])
        const y = labels[i]
        cx[x] = (cx[x] ?? 0) + 1
        cy[y] = (cy[y] ?? 0) + 1
        cxy[`${x}\u0000${y}`] = (cxy[`${x}\u0000${y}`] ?? 0) + 1
      })
      let mi = 0
      let hx = 0
      let hy = 0
      for (const x in cx) hx -= (cx[x] / n) * Math.log(cx[x] / n)
      for (const y in cy) hy -= (cy[y] / n) * Math.log(cy[y] / n)
      for (const k in cxy) {
        const [x, y] = k.split('\u0000')
        const pxy = cxy[k] / n
        mi += pxy * Math.log(pxy / ((cx[x] / n) * (cy[y] / n)))
      }
      out[key] = Math.min(1, mi / Math.max(1e-9, Math.sqrt(hx * hy)))
    }
  }
  return out
}

export const CATEGORY_KEY = '__category'

export interface RecommendOptions {
  max?: number
}

/** Rule-based candidates, scored by explanatory power, deduplicated by column pair. */
export function recommendCharts(rows: RowRecord[], prof: Profile, labels: string[] | null, opts: RecommendOptions = {}): ChartCandidate[] {
  const max = opts.max ?? 3
  const ex = explanatoryPower(rows, prof, labels)
  const enums = Object.values(prof).filter((p) => p.type === 'enum').map((p) => p.key)
  const nums = Object.values(prof).filter((p) => p.type === 'number').map((p) => p.key)
  const card = (k: string) => prof[k]?.cardinality ?? 4
  if (labels) {
    ex[CATEGORY_KEY] = 1
    enums.unshift(CATEGORY_KEY)
  }
  const cands: ChartCandidate[] = []
  for (const e of enums) cands.push({ kind: 'bar', x: e, agg: 'count', score: ex[e] - card(e) / 40, why: `${e} explains ${Math.round(ex[e] * 100)}% of structure` })
  for (const e of enums) for (const n of nums) cands.push({ kind: 'bar', x: e, y: n, agg: 'mean', score: 0.6 * ex[e] + 0.6 * ex[n] - card(e) / 40, why: `${e} × ${n}: ${Math.round(ex[e] * 100)}% + ${Math.round(ex[n] * 100)}%` })
  for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) cands.push({ kind: 'scatter', x: nums[i], y: nums[j], score: 0.5 * (ex[nums[i]] + ex[nums[j]]) - 0.05, why: `${nums[i]} × ${nums[j]} scatter` })
  cands.sort((a, b) => b.score - a.score)
  const picked: ChartCandidate[] = []
  const seen = new Set<string>()
  for (const c of cands) {
    const key = `${c.x}|${c.y ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(c)
    if (picked.length === max) break
  }
  if (labels) picked.unshift({ kind: 'map', score: 1, why: 'PCA of the embedding column, coloured by category' })
  return picked
}

const humanize = (s: string) => (s === CATEGORY_KEY ? 'category' : s)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()

export interface SpecContext {
  rows: RowRecord[]
  rowIds: string[]
  labels: string[] | null
  vectors?: Vector[]
}

/** Turn a candidate into a Vega-Lite v5 spec with aggregated data inlined. */
export function toVegaLite(c: ChartCandidate, ctx: SpecContext): ChartResult {
  const valueOf = (r: RowRecord, i: number, key: string) => (key === CATEGORY_KEY ? ctx.labels?.[i] : r[key])
  let spec: VegaLiteSpec
  if (c.kind === 'bar') {
    const x = c.x!
    const field = humanize(x)
    const groups: Record<string, number[]> = {}
    ctx.rows.forEach((r, i) => (groups[String(valueOf(r, i, x))] ??= []).push(c.y ? (r[c.y] as number) : 1))
    const values = Object.entries(groups)
      .map(([k, v]) => ({ [field]: k, value: c.y ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : v.length }))
      .sort((a, b) => (b.value as number) - (a.value as number))
    const title = c.y ? `${cap(c.y)} by ${field}` : `Rows by ${field}`
    spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title,
      data: { values },
      mark: 'bar',
      encoding: { x: { field, type: 'nominal', sort: '-y' }, y: { field: 'value', type: 'quantitative', title: c.y ? `mean ${c.y}` : 'rows' } },
    }
  } else if (c.kind === 'scatter') {
    const x = c.x!
    const y = c.y!
    const values = ctx.rows.map((r, i) => ({ [x]: r[x], [y]: r[y], id: ctx.rowIds[i], ...(ctx.labels ? { category: ctx.labels[i] } : {}) }))
    const title = `${cap(y)} vs ${x}`
    spec = { $schema: 'https://vega.github.io/schema/vega-lite/v5.json', title, data: { values }, mark: 'point', encoding: { x: { field: x, type: 'quantitative' }, y: { field: y, type: 'quantitative' } } }
    if (ctx.labels) spec.encoding.color = { field: 'category', type: 'nominal' }
  } else {
    const xy = ctx.vectors ? pca2(ctx.vectors) : ctx.rows.map(() => [0, 0] as [number, number])
    const values = ctx.rows.map((_, i) => ({ pc1: +xy[i][0].toFixed(3), pc2: +xy[i][1].toFixed(3), id: ctx.rowIds[i], category: ctx.labels?.[i] ?? 'unknown' }))
    spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: 'Embedding map',
      data: { values },
      mark: 'point',
      encoding: { x: { field: 'pc1', type: 'quantitative' }, y: { field: 'pc2', type: 'quantitative' }, color: { field: 'category', type: 'nominal' } },
    }
  }
  return { title: spec.title, candidate: c, spec }
}

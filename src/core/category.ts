import { dot, kmeans, normalize } from './math'
import type { Category, CategoryCell, CategorySpace, CategorySpaceJSON, Profile, RowRecord, Vector } from './types'

export interface DiscoverOptions {
  k: number
  encoderId: string
  /** Column used for exemplar ids and fallback labels. */
  nameKey: string
  minConfidence?: number
  id?: string
}

function autoLabel(members: number[], rows: RowRecord[], prof: Profile, nameKey: string): string {
  let best: { val: string; purity: number } | null = null
  for (const key in prof) {
    if (prof[key].type !== 'enum') continue
    const counts: Record<string, number> = {}
    for (const i of members) {
      const v = String(rows[i][key])
      counts[v] = (counts[v] ?? 0) + 1
    }
    const [val, c] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    const purity = c / members.length
    if (!best || purity > best.purity) best = { val, purity }
  }
  if (best && best.purity >= 0.6) return best.purity < 1 ? `${best.val} · mostly` : best.val
  return `Like ${String(rows[members[0]]?.[nameKey] ?? members[0])}`
}

/** Cluster the vectors and turn each cluster into a category with a prototype. */
export function discoverCategories(vecs: Vector[], rows: RowRecord[], prof: Profile, opts: DiscoverOptions): CategorySpace {
  const { labels, centroids } = kmeans(vecs, opts.k)
  const categories: Category[] = centroids.map((c, j) => {
    const members = [...labels.keys()].filter((i) => labels[i] === j).sort((a, b) => dot(vecs[b], c) - dot(vecs[a], c))
    const radius = members.length ? members.reduce((s, i) => s + (1 - dot(vecs[i], c)), 0) / members.length : 0.3
    return {
      value: `c${j + 1}`,
      label: autoLabel(members, rows, prof, opts.nameKey),
      prototype: c,
      radius: Math.max(0.08, radius),
      exemplars: members.slice(0, 3).map((i) => String(rows[i][opts.nameKey])),
    }
  })
  return { id: opts.id ?? 'discovered', encoder: opts.encoderId, mode: 'single', categories, fallback: 'unknown', minConfidence: opts.minConfidence ?? 0.55 }
}

/** Build a space from rows the user has already labelled: `{ value: [rowIndex, ...] }`. */
export function seedCategories(vecs: Vector[], seeds: Record<string, number[]>, encoderId: string, labels: Record<string, string> = {}): CategorySpace {
  const categories: Category[] = Object.entries(seeds).map(([value, idx]) => {
    const dim = vecs[0]?.length ?? 0
    const sum = new Float32Array(dim)
    for (const i of idx) for (let d = 0; d < dim; d++) sum[d] += vecs[i][d]
    const prototype = normalize(sum)
    const radius = idx.length ? idx.reduce((s, i) => s + (1 - dot(vecs[i], prototype)), 0) / idx.length : 0.3
    return { value, label: labels[value] ?? value, prototype, radius: Math.max(0.08, radius), exemplars: idx.map(String) }
  })
  return { id: 'seeded', encoder: encoderId, mode: 'single', categories, fallback: 'unknown', minConfidence: 0.55 }
}

/** Nearest-prototype assignment with a margin-based confidence. */
export function assignCategory(space: CategorySpace, v: Vector): CategoryCell {
  if (space.categories.length === 0) return { value: space.fallback, label: space.fallback, confidence: 0, flagged: true }
  const sims = space.categories.map((c) => dot(v, c.prototype))
  const order = [...sims.keys()].sort((a, b) => sims[b] - sims[a])
  const best = order[0]
  const margin = sims[best] - (sims[order[1]] ?? -1)
  const confidence = Math.max(0, Math.min(1, 0.5 + margin / (2 * space.categories[best].radius)))
  const flagged = confidence < space.minConfidence
  const cat = space.categories[best]
  return { value: cat.value, label: cat.label, confidence, flagged }
}

/**
 * Apply a user correction: pull the prototype toward the row and record the
 * exemplar. Returns a new space; the input is not mutated.
 */
export function correctCategory(space: CategorySpace, value: string, rowId: string, v: Vector, rate = 0.2): CategorySpace {
  return {
    ...space,
    categories: space.categories.map((c) => {
      if (c.value !== value) return c
      const p = new Float32Array(c.prototype.length)
      for (let d = 0; d < p.length; d++) p[d] = c.prototype[d] * (1 - rate) + v[d] * rate
      return { ...c, prototype: normalize(p), exemplars: c.exemplars.includes(rowId) ? c.exemplars : [...c.exemplars, rowId] }
    }),
  }
}

/** Mean distance of new vectors to their nearest prototype, relative to the radius. >1 suggests drift. */
export function drift(space: CategorySpace, vecs: Vector[]): number {
  if (!vecs.length || !space.categories.length) return 0
  let total = 0
  for (const v of vecs) {
    let best = -2
    let r = 1
    for (const c of space.categories) {
      const s = dot(v, c.prototype)
      if (s > best) {
        best = s
        r = c.radius
      }
    }
    total += (1 - best) / r
  }
  return total / vecs.length
}

export function spaceToJSON(space: CategorySpace): CategorySpaceJSON {
  return { ...space, categories: space.categories.map((c) => ({ ...c, prototype: Array.from(c.prototype) })) }
}

export function spaceFromJSON(json: CategorySpaceJSON): CategorySpace {
  return { ...json, categories: json.categories.map((c) => ({ ...c, prototype: Float32Array.from(c.prototype) })) }
}

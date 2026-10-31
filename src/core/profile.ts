import type { ColumnProfile, Profile, RowRecord } from './types'

export interface ProfileOptions {
  /** Columns to leave out of the profile (and so out of the encoding). */
  exclude?: string[]
  /** Distinct values at or below which a string column is treated as an enum. */
  enumMaxCardinality?: number
}

/** Unique values that are single tokens (no spaces) and short read as identifiers, not prose. */
function looksLikeId(vals: unknown[]): boolean {
  const strs = vals.map(String)
  const avg = strs.reduce((a, s) => a + s.length, 0) / strs.length
  return avg <= 24 && strs.every((s) => /^[\w.:/@-]+$/.test(s))
}

/** Infer a type and summary statistics for every column. */
export function profile(rows: RowRecord[], opts: ProfileOptions = {}): Profile {
  const out: Profile = {}
  if (rows.length === 0) return out
  const exclude = new Set(opts.exclude ?? [])
  const enumMax = opts.enumMaxCardinality ?? 8
  const keys = new Set<string>()
  for (const r of rows) for (const k of Object.keys(r)) keys.add(k)
  for (const key of keys) {
    if (exclude.has(key)) continue
    const vals = rows.map((r) => r[key]).filter((v) => v != null)
    if (vals.length === 0) continue
    const uniq = new Set(vals.map(String))
    const p: ColumnProfile = { key, type: 'text', cardinality: uniq.size }
    if (vals.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      const nums = vals as number[]
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length
      const sd = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / nums.length) || 1
      Object.assign(p, { type: 'number', mean, sd, min: Math.min(...nums), max: Math.max(...nums) })
    } else if (uniq.size === rows.length && rows.length > 1 && looksLikeId(vals)) {
      p.type = 'id'
    } else if (uniq.size <= enumMax) {
      p.type = 'enum'
    }
    out[key] = p
  }
  return out
}

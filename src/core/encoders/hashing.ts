import { hash, normalize } from '../math'
import type { Encoder, Profile, RowRecord, Vector } from '../types'

export interface HashingEncoderOptions {
  /** Total vector size. Text and enum features share the first `textDim` slots. */
  dim?: number
  textDim?: number
  enumWeight?: number
  numberWeight?: number
}

/**
 * Weight-free encoder: character trigrams for text, hashed enums, standardised
 * numbers. Good enough for similarity and first categories; the phase 2
 * tabular encoder replaces it behind the same interface.
 */
export function hashingEncoder(opts: HashingEncoderOptions = {}): Encoder {
  const dim = opts.dim ?? 96
  const textDim = opts.textDim ?? 64
  const enumWeight = opts.enumWeight ?? 1.6
  const numberWeight = opts.numberWeight ?? 0.9
  return {
    id: `hashing@1:${dim}/${textDim}`,
    dim,
    encode(row: RowRecord, prof: Profile): Vector {
      const v = new Float32Array(dim)
      const numKeys = Object.values(prof).filter((p) => p.type === 'number').map((p) => p.key)
      for (const key in prof) {
        const p = prof[key]
        const val = row[key]
        if (val == null) continue
        if (p.type === 'number' && typeof val === 'number') {
          const slot = textDim + numKeys.indexOf(key)
          if (slot < dim) v[slot] = Math.max(-2.5, Math.min(2.5, (val - (p.mean ?? 0)) / (p.sd ?? 1))) * numberWeight
        } else if (p.type === 'enum') {
          const h = hash(`${key}=${String(val)}`)
          v[h % textDim] += enumWeight
          v[(h >>> 8) % textDim] += enumWeight * (h & 1 ? 1 : -1)
        } else if (p.type === 'text') {
          const s = ` ${String(val).toLowerCase()} `
          const n = Math.max(1, s.length - 2)
          for (let i = 0; i < s.length - 2; i++) {
            const h = hash(s.slice(i, i + 3))
            v[h % textDim] += ((h & 2 ? 1 : -1) * 3) / Math.sqrt(n)
          }
        }
      }
      return normalize(v)
    },
  }
}

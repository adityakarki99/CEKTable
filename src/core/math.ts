import type { Vector } from './types'

export const dot = (a: Vector, b: Vector): number => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export const normalize = (v: Vector): Vector => {
  let n = 0
  for (let i = 0; i < v.length; i++) n += v[i] * v[i]
  n = Math.sqrt(n) || 1
  const out = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n
  return out
}

/** FNV-1a 32-bit hash. Deterministic across runtimes. */
export function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface KMeansResult {
  labels: Int32Array
  centroids: Vector[]
}

/**
 * Spherical k-means with deterministic farthest-point initialisation.
 * Vectors are expected to be unit length.
 */
export function kmeans(vecs: Vector[], k: number, maxIter = 25): KMeansResult {
  if (vecs.length === 0) return { labels: new Int32Array(0), centroids: [] }
  k = Math.max(1, Math.min(k, vecs.length))
  const dim = vecs[0].length
  const centroids: Vector[] = [vecs[0].slice()]
  while (centroids.length < k) {
    let best = -1
    let bi = 0
    vecs.forEach((v, i) => {
      let d = Infinity
      for (const c of centroids) d = Math.min(d, 1 - dot(v, c))
      if (d > best) {
        best = d
        bi = i
      }
    })
    centroids.push(vecs[bi].slice())
  }
  let labels = new Int32Array(vecs.length)
  for (let it = 0; it < maxIter; it++) {
    const next = vecs.map((v) => {
      let b = 0
      let bs = -2
      centroids.forEach((c, j) => {
        const s = dot(v, c)
        if (s > bs) {
          bs = s
          b = j
        }
      })
      return b
    })
    const sums = centroids.map(() => new Float32Array(dim))
    const counts = centroids.map(() => 0)
    next.forEach((l, i) => {
      counts[l]++
      for (let d = 0; d < dim; d++) sums[l][d] += vecs[i][d]
    })
    centroids.forEach((_, j) => {
      if (counts[j]) centroids[j] = normalize(sums[j])
    })
    const converged = next.every((l, i) => l === labels[i])
    labels = Int32Array.from(next)
    if (converged && it > 0) break
  }
  return { labels, centroids }
}

/** First two principal components by power iteration. Returns [pc1, pc2] per vector. */
export function pca2(vecs: Vector[]): [number, number][] {
  const n = vecs.length
  if (n === 0) return []
  const dim = vecs[0].length
  const mean = new Float32Array(dim)
  for (const v of vecs) for (let d = 0; d < dim; d++) mean[d] += v[d] / n
  const X = vecs.map((v) => {
    const x = new Float32Array(dim)
    for (let d = 0; d < dim; d++) x[d] = v[d] - mean[d]
    return x
  })
  const comps: Vector[] = []
  for (let c = 0; c < 2; c++) {
    let w: Vector = new Float32Array(dim)
    for (let d = 0; d < dim; d++) w[d] = Math.sin(d * 1.7 + c)
    w = normalize(w)
    for (let it = 0; it < 40; it++) {
      const s = new Float32Array(dim)
      for (const x of X) {
        const p = dot(x, w)
        for (let d = 0; d < dim; d++) s[d] += p * x[d]
      }
      if (comps[0]) {
        const q = dot(s, comps[0])
        for (let d = 0; d < dim; d++) s[d] -= q * comps[0][d]
      }
      w = normalize(s)
    }
    comps.push(w)
  }
  return X.map((x) => [dot(x, comps[0]), dot(x, comps[1])])
}

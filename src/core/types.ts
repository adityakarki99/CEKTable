/**
 * Shared types for the CEKTable engine.
 *
 * The engine is headless: it turns rows into vectors and derives categories,
 * scores, neighbours and chart specs from the geometry. Nothing in `src/core`
 * imports React or a model runtime.
 */

export type ColumnType = 'number' | 'enum' | 'text' | 'id'

export interface ColumnProfile {
  key: string
  type: ColumnType
  cardinality: number
  /** Present for number columns. */
  mean?: number
  sd?: number
  min?: number
  max?: number
}

export type Profile = Record<string, ColumnProfile>

export type RowRecord = Record<string, unknown>

export type Vector = Float32Array<ArrayBuffer>

/** Any encoder that maps a row to a fixed-size vector. */
export interface Encoder {
  /** Stable identifier; changes whenever the vector space would change. */
  id: string
  dim: number
  encode(row: RowRecord, profile: Profile): Vector
}

export interface Category {
  value: string
  label: string
  prototype: Vector
  /** Mean cosine distance of members to the prototype. */
  radius: number
  exemplars: string[]
}

/** A category set: regions of the vector space, serialisable as JSON. */
export interface CategorySpace {
  id: string
  encoder: string
  mode: 'single'
  categories: Category[]
  fallback: string
  minConfidence: number
}

export interface CategoryCell {
  value: string
  label: string
  confidence: number
  /** True when confidence is below the space's `minConfidence`. */
  flagged: boolean
}

export interface Neighbor {
  rowId: string
  similarity: number
}

export type ChartKind = 'bar' | 'scatter' | 'map'

export interface ChartCandidate {
  kind: ChartKind
  x?: string
  y?: string
  agg?: 'mean' | 'count'
  score: number
  why: string
}

/** A Vega-Lite v5 spec with its data inlined. */
export interface VegaLiteSpec {
  $schema: string
  title: string
  data: { values: Record<string, unknown>[] }
  mark: 'bar' | 'point'
  encoding: Record<string, { field: string; type: 'nominal' | 'quantitative'; title?: string; sort?: string }>
}

export interface ChartResult {
  title: string
  candidate: ChartCandidate
  spec: VegaLiteSpec
}

/** Serialisable form of a category space (prototypes as plain arrays). */
export interface CategorySpaceJSON extends Omit<CategorySpace, 'categories'> {
  categories: (Omit<Category, 'prototype'> & { prototype: number[] })[]
}

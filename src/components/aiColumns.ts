import type { ComponentType } from 'react'
import type { EngineTable } from '../core'
import { CategoryColumnCell, CategoryOptions, OutlierColumnCell, SimilarityColumnCell, SimilarityOptions } from './aiColumnParts'
import type { AIColumn, AIColumnKind } from './types'

/** Settings the add-column panel collects; each kind reads the ones it needs. */
export interface AIColumnOptions {
  /** Number of groups for `category`. */
  k: number
  /** Anchor row id for `similarity`. */
  anchor: string
}

export interface AIColumnCellProps {
  engine: EngineTable<unknown>
  column: AIColumn
  rowId: string
}

export interface AIColumnOptionsProps {
  engine: EngineTable<unknown>
  rowIds: string[]
  options: AIColumnOptions
  onChange: (patch: Partial<AIColumnOptions>) => void
}

/** Everything the UI needs to know about one kind of AI column. */
export interface AIColumnKindDef {
  /** Label on the kind picker. */
  label: string
  /** Glyph in the column header. */
  glyph: string
  /** One line under the kind picker. */
  help: string
  defaultName: (options: AIColumnOptions) => string
  /** Engine work to run before the column is added. */
  prepare?: (engine: EngineTable<unknown>, column: Omit<AIColumn, 'id'>) => void
  Cell: ComponentType<AIColumnCellProps>
  /** Extra controls in the add-column panel. */
  Options?: ComponentType<AIColumnOptionsProps>
}

/** Add a kind here and the panel, headers, table cells and cards pick it up. */
export const AI_COLUMN_KINDS: Record<AIColumnKind, AIColumnKindDef> = {
  category: {
    label: 'Categories',
    glyph: '◎',
    help: 'Groups rows by how alike they are. Click any chip later to correct it.',
    defaultName: () => 'Category',
    prepare: (engine, col) => {
      if (!engine.state.space) engine.discoverCategories(col.k ?? 4)
    },
    Cell: CategoryColumnCell,
    Options: CategoryOptions,
  },
  outlier: {
    label: 'Outlier score',
    glyph: '◇',
    help: 'Scores each row 0–100 by distance from its own group.',
    defaultName: () => 'Unusual',
    prepare: (engine) => { engine.scoreOutliers() },
    Cell: OutlierColumnCell,
  },
  similarity: {
    label: 'Similarity',
    glyph: '≈',
    help: 'Scores every row by closeness to one anchor row.',
    defaultName: ({ anchor }) => `Similar to ${anchor}`,
    Cell: SimilarityColumnCell,
    Options: SimilarityOptions,
  },
}

export const AI_COLUMN_KIND_ORDER = Object.keys(AI_COLUMN_KINDS) as AIColumnKind[]

// AI column definitions. Values come from the headless engine, never from a prompt.
export type AIColumnKind = 'category' | 'outlier' | 'similarity'

export interface AIColumn {
  id: string
  header: string
  kind: AIColumnKind
  /** Number of groups for `category`. */
  k?: number
  /** Anchor row id for `similarity`. */
  anchor?: string
}

export type ViewMode = 'table' | 'groups' | 'card'

export const CATEGORY_COLORS = ['#7c3aed', '#0891b2', '#d97706', '#db2777', '#059669', '#4f46e5']

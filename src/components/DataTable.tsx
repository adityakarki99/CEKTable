import { useState, useCallback, useMemo, useEffect, useSyncExternalStore } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  ColumnSizingState,
  Row,
} from '@tanstack/react-table'
import { Checkbox } from './Checkbox'
import { createTable } from '../core'
import type { EngineState, EngineTable, Encoder } from '../core'
import './table.css'

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

const CATEGORY_COLORS = ['#7c3aed', '#0891b2', '#d97706', '#db2777', '#059669', '#4f46e5']

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  enableSorting?: boolean
  enableFiltering?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableColumnResize?: boolean
  enableAIColumns?: boolean
  enableViewToggle?: boolean
  pageSize?: number
  maxCellHeight?: number
  cardRenderer?: (row: Row<T>, aiColumns: AIColumn[]) => React.ReactNode
  getRowId?: (row: T, index: number) => string
  /** Encoder for the engine. Defaults to the weight-free hashing encoder. */
  encoder?: Encoder
  /** Columns the engine should not encode (ids, timestamps). */
  excludeFromEncoding?: string[]
  /** Called once the headless engine exists, for callers that want to drive it directly. */
  onEngine?: (engine: EngineTable<T>) => void
}

const defaultGetRowId = <T,>(row: T, index: number): string => {
  const id = (row as Record<string, unknown>).id
  return id != null ? String(id) : String(index)
}

// AI Column Modal Component
function AIColumnModal({
  isOpen,
  onClose,
  onSubmit,
  rowIds,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (col: Omit<AIColumn, 'id'>) => void
  rowIds: string[]
}) {
  const [columnName, setColumnName] = useState('')
  const [kind, setKind] = useState<AIColumnKind>('category')
  const [k, setK] = useState(4)
  const [anchor, setAnchor] = useState('')

  const defaultName = kind === 'category' ? 'Category' : kind === 'outlier' ? 'Unusual' : `Similar to ${anchor || rowIds[0] || ''}`

  const handleSubmit = () => {
    onSubmit({ header: columnName.trim() || defaultName, kind, k, anchor: anchor || rowIds[0] })
    setColumnName('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add AI Column</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="ai-kind">Kind</label>
            <select id="ai-kind" className="form-input" value={kind} onChange={e => setKind(e.target.value as AIColumnKind)}>
              <option value="category">Categories — discover groups in the rows</option>
              <option value="outlier">Outlier score — how unusual each row is</option>
              <option value="similarity">Similarity — distance to one row</option>
            </select>
          </div>
          {kind === 'category' && (
            <div className="form-group">
              <label htmlFor="ai-k">Number of groups</label>
              <select id="ai-k" className="form-input" value={k} onChange={e => setK(Number(e.target.value))}>
                {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          {kind === 'similarity' && (
            <div className="form-group">
              <label htmlFor="ai-anchor">Anchor row</label>
              <select id="ai-anchor" className="form-input" value={anchor || rowIds[0] || ''} onChange={e => setAnchor(e.target.value)}>
                {rowIds.map(id => <option key={id} value={id}>{id}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="ai-name">Column Name</label>
            <input
              id="ai-name"
              type="text"
              value={columnName}
              onChange={e => setColumnName(e.target.value)}
              placeholder={defaultName}
              className="form-input"
            />
          </div>
          <p className="ai-help">Computed locally from row embeddings. No prompt, no model call.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <span className="ai-icon">✨</span> Add Column
          </button>
        </div>
      </div>
    </div>
  )
}

// Category cell with an inline correction menu
function CategoryCell({ engine, rowId }: { engine: EngineTable<unknown>; rowId: string }) {
  const [open, setOpen] = useState(false)
  const cell = engine.state.categories[rowId]
  const space = engine.state.space
  if (!cell || !space) return <span className="ai-cell">…</span>
  const idx = space.categories.findIndex(c => c.value === cell.value)
  return (
    <span className="ai-category-wrap">
      <button
        type="button"
        className={`ai-chip ${cell.flagged ? 'flagged' : ''}`}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Click to correct"
      >
        <i style={{ background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
        {cell.label}
        <small>{Math.round(cell.confidence * 100)}%{cell.flagged ? ' review' : ''}</small>
      </button>
      {open && (
        <span className="ai-menu" onClick={e => e.stopPropagation()}>
          {space.categories.map((c, i) => (
            <button type="button" key={c.value} onClick={() => { engine.correct(rowId, c.value); setOpen(false) }}>
              <i style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />{c.label}
            </button>
          ))}
        </span>
      )}
    </span>
  )
}

function aiCellValue(engine: EngineTable<unknown>, col: AIColumn, rowId: string): string {
  if (col.kind === 'outlier') return String(engine.state.outliers[rowId] ?? '…')
  if (col.kind === 'similarity') {
    if (rowId === col.anchor) return 'this row'
    const a = engine.vector(col.anchor ?? '')
    const b = engine.vector(rowId)
    if (!a || !b) return '…'
    let s = 0
    for (let i = 0; i < a.length; i++) s += a[i] * b[i]
    return s.toFixed(2)
  }
  return engine.state.categories[rowId]?.label ?? '…'
}

// Card View Component
function DataCard<T>({
  row,
  aiColumns,
  engine,
  isSelected,
  onToggleSelect,
  enableSelection
}: {
  row: Row<T>
  aiColumns: AIColumn[]
  engine: EngineTable<unknown>
  isSelected: boolean
  onToggleSelect: () => void
  enableSelection: boolean
}) {
  return (
    <div className={`data-card ${isSelected ? 'selected' : ''}`}>
      {enableSelection && (
        <div className="card-select">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label="Select row"
          />
        </div>
      )}
      <div className="card-content">
        {row.getVisibleCells().map((cell) => {
          const columnDef = cell.column.columnDef
          if (cell.column.id === 'select') return null
          if (aiColumns.some(aiCol => aiCol.id === cell.column.id)) return null

          return (
            <div key={cell.id} className="card-field">
              <span className="card-label">
                {typeof columnDef.header === 'string' ? columnDef.header : cell.column.id}
              </span>
              <span className="card-value">
                {flexRender(columnDef.cell, cell.getContext())}
              </span>
            </div>
          )
        })}
        {aiColumns.map(aiCol => (
          <div key={aiCol.id} className="card-field ai-field">
            <span className="card-label">
              <span className="ai-badge">AI</span>
              {aiCol.header}
            </span>
            <span className="card-value">
              {aiCol.kind === 'category' ? <CategoryCell engine={engine} rowId={row.id} /> : aiCellValue(engine, aiCol, row.id)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DataTable<T>({
  data,
  columns: initialColumns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  enableColumnResize = true,
  enableAIColumns = true,
  enableViewToggle = true,
  pageSize = 10,
  maxCellHeight = 100,
  getRowId = defaultGetRowId,
  encoder,
  excludeFromEncoding,
  onEngine,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [aiColumns, setAIColumns] = useState<AIColumn[]>([])
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  // Headless engine: one instance per table, re-encoded when data changes.
  const engine = useMemo(
    () => createTable<T & object>({ data: data as (T & object)[], getRowId: getRowId as (row: T & object, i: number) => string, encoder, exclude: excludeFromEncoding }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encoder, getRowId, excludeFromEncoding]
  )
  useEffect(() => { if (engine.rows !== data) engine.setData(data as (T & object)[]) }, [engine, data])
  useEffect(() => { onEngine?.(engine as unknown as EngineTable<T>) }, [engine, onEngine])
  const engineState: EngineState = useSyncExternalStore(
    useCallback((cb: () => void) => engine.subscribe(cb), [engine]),
    () => engine.state,
    () => engine.state
  )
  const untypedEngine = engine as unknown as EngineTable<unknown>

  // Add an engine-backed column
  const generateAIColumn = useCallback((col: Omit<AIColumn, 'id'>) => {
    if (col.kind === 'category' && !engine.state.space) engine.discoverCategories(col.k ?? 4)
    if (col.kind === 'outlier') engine.scoreOutliers()
    setAIColumns(prev => [...prev, { ...col, id: `ai-${Date.now()}` }])
  }, [engine])

  // Remove AI column
  const removeAIColumn = useCallback((columnId: string) => {
    setAIColumns(prev => prev.filter(col => col.id !== columnId))
  }, [])

  // Combine initial columns with AI columns
  const allColumns: ColumnDef<T, unknown>[] = useMemo(() => [
    ...initialColumns,
    ...aiColumns.map(aiCol => ({
      id: aiCol.id,
      header: () => (
        <div className="ai-column-header">
          <span className="ai-badge">AI</span>
          {aiCol.header}
          <button
            className="remove-ai-column"
            onClick={(e) => {
              e.stopPropagation()
              removeAIColumn(aiCol.id)
            }}
          >
            &times;
          </button>
        </div>
      ),
      cell: ({ row }: { row: Row<T> }) =>
        aiCol.kind === 'category'
          ? <CategoryCell engine={untypedEngine} rowId={row.id} />
          : <div className="ai-cell">{aiCellValue(untypedEngine, aiCol, row.id)}</div>,
      size: 180,
      enableSorting: false,
    }))
    // engineState.version forces fresh cell renderers after any engine change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [initialColumns, aiColumns, removeAIColumn, untypedEngine, engineState.version])

  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    enableRowSelection,
    enableColumnResizing: enableColumnResize,
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <div className="data-table-container">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {enableFiltering && (
            <input
              type="text"
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="global-filter"
            />
          )}
          {enableRowSelection && selectedCount > 0 && (
            <span className="selection-info">
              {selectedCount} row{selectedCount > 1 ? 's' : ''} selected
            </span>
          )}
        </div>
        <div className="toolbar-right">
          {enableAIColumns && (
            <button
              className="btn-ai"
              onClick={() => setIsAIModalOpen(true)}
            >
              <span className="ai-icon">✨</span>
              Add AI Column
            </button>
          )}
          {enableViewToggle && (
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M3 15h18M9 3v18"/>
                </svg>
              </button>
              <button
                className={`view-btn ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="table-wrapper">
          <table className="data-table" style={{ width: table.getCenterTotalSize() }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      data-column-id={header.column.id}
                      className={header.column.getCanSort() ? 'sortable' : ''}
                      style={{
                        width: header.getSize(),
                        position: 'relative',
                      }}
                    >
                      <div
                        className="th-content"
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className="sort-indicator">
                            {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </div>
                      {enableColumnResize && header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={`resize-handle ${header.column.getIsResizing() ? 'resizing' : ''}`}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={row.getIsSelected() ? 'selected' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-column-id={cell.column.id}
                      style={{
                        width: cell.column.getSize(),
                        maxHeight: maxCellHeight,
                      }}
                    >
                      <div
                        className="cell-content"
                        style={{ maxHeight: maxCellHeight }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="cards-grid">
          {table.getRowModel().rows.map((row) => (
            <DataCard
              key={row.id}
              row={row}
              aiColumns={aiColumns}
              engine={untypedEngine}
              isSelected={row.getIsSelected()}
              onToggleSelect={() => row.toggleSelected()}
              enableSelection={enableRowSelection}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} entries
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="secondary"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="secondary"
            >
              {'<'}
            </button>
            <span className="page-info">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="secondary"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="secondary"
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}

      {/* AI Column Modal */}
      <AIColumnModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSubmit={generateAIColumn}
        rowIds={engineState.rowIds}
      />
    </div>
  )
}

export default DataTable

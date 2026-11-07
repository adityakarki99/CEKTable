import { useState, useCallback, useMemo } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { flushSync } from 'react-dom'
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
import { AIColumnCell } from './AIColumnCell'
import { AI_COLUMN_KINDS } from './aiColumns'
import { AddColumnPanel, RowDetailPanel } from './SidePanel'
import type { PanelState } from './SidePanel'
import { useEngine, useEngineState } from './useEngine'
import type { EngineTable, Encoder } from '../core'
import { CATEGORY_COLORS } from './types'
import type { AIColumn, ViewMode } from './types'
import './table.css'

export type { AIColumn, AIColumnKind, ViewMode } from './types'

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
  /** Open a row detail panel when a row is clicked. */
  enableRowDetail?: boolean
  pageSize?: number
  maxCellHeight?: number
  /** Row padding preset. Also settable from CSS via `--cek-density` on any ancestor. */
  density?: 'compact' | 'comfortable' | 'spacious'
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

/** Run a state change inside a view transition where the browser supports it. */
function morph(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
  if (typeof doc.startViewTransition === 'function') doc.startViewTransition(() => flushSync(update))
  else update()
}

// Card View Component
function DataCard<T>({
  row,
  aiColumns,
  engine,
  isSelected,
  onToggleSelect,
  onOpen,
  enableSelection
}: {
  row: Row<T>
  aiColumns: AIColumn[]
  engine: EngineTable<unknown>
  isSelected: boolean
  onToggleSelect: () => void
  onOpen?: () => void
  enableSelection: boolean
}) {
  return (
    <div className={`data-card ${isSelected ? 'selected' : ''} ${onOpen ? 'clickable' : ''}`} onClick={onOpen ? (e) => { if (!isInteractive(e)) onOpen() } : undefined}>
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
              <AIColumnCell engine={engine} column={aiCol} rowId={row.id} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** True when a click landed on a control, so row-level handlers should stay out of the way. */
function isInteractive(e: ReactMouseEvent) {
  return !!(e.target as HTMLElement).closest('button, a, input, select, label, [role="checkbox"], .ai-menu')
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
  enableRowDetail = true,
  pageSize = 10,
  maxCellHeight = 100,
  density = 'comfortable',
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
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [aiColumns, setAIColumns] = useState<AIColumn[]>([])
  const [panel, setPanel] = useState<PanelState>(null)

  // Headless engine: one instance per table, re-encoded when data changes.
  const engine = useEngine({ data, getRowId, encoder, exclude: excludeFromEncoding, onEngine })
  const untypedEngine = engine as unknown as EngineTable<unknown>
  const engineState = useEngineState(untypedEngine)

  const switchView = useCallback((mode: ViewMode) => {
    // Bands need a category space; discovery is instant, so make one on the way in.
    if (mode === 'groups' && !engine.state.space) engine.discoverCategories(4)
    morph(() => setViewMode(mode))
  }, [engine])

  const openPanel = useCallback((next: PanelState) => morph(() => setPanel(next)), [])

  // Add an engine-backed column
  const generateAIColumn = useCallback((col: Omit<AIColumn, 'id'>) => {
    AI_COLUMN_KINDS[col.kind].prepare?.(untypedEngine, col)
    setAIColumns(prev => [...prev, { ...col, id: `ai-${Date.now()}` }])
    openPanel(null)
  }, [untypedEngine, openPanel])

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
          <span className="ai-kind" aria-hidden="true">{AI_COLUMN_KINDS[aiCol.kind].glyph}</span>
          {aiCol.header}
          <button
            className="remove-ai-column"
            aria-label={`Remove ${aiCol.header}`}
            onClick={(e) => {
              e.stopPropagation()
              removeAIColumn(aiCol.id)
            }}
          >
            &times;
          </button>
        </div>
      ),
      // The cell subscribes to the engine itself, so these renderers stay stable.
      cell: ({ row }: { row: Row<T> }) => <AIColumnCell engine={untypedEngine} column={aiCol} rowId={row.id} />,
      size: 180,
      enableSorting: false,
    }))
  ], [initialColumns, aiColumns, removeAIColumn, untypedEngine])

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
  const rows = table.getRowModel().rows
  const columnCount = table.getVisibleLeafColumns().length

  // Bands: rows of the current page grouped by category, in the space's order.
  const aggKey = useMemo(() => {
    const sorted = sorting[0]?.id
    if (sorted && engineState.profile[sorted]?.type === 'number') return sorted
    return Object.values(engineState.profile).find(p => p.type === 'number')?.key
  }, [sorting, engineState.profile])
  const bands = useMemo(() => {
    const space = engineState.space
    if (!space) return []
    const byValue: Record<string, Row<T>[]> = {}
    for (const r of rows) (byValue[engineState.categories[r.id]?.value ?? space.fallback] ??= []).push(r)
    return space.categories
      .map((c, i) => {
        const members = byValue[c.value] ?? []
        const mean = aggKey && members.length
          ? members.reduce((s, r) => s + Number((r.original as Record<string, unknown>)[aggKey] ?? 0), 0) / members.length
          : null
        return { ...c, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length], members, mean }
      })
      .filter(b => b.members.length > 0)
  }, [rows, engineState.space, engineState.categories, aggKey])

  const toggleBand = (value: string) => setCollapsed(prev => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })

  const onRowClick = enableRowDetail
    ? (rowId: string) => (e: ReactMouseEvent) => { if (!isInteractive(e)) openPanel({ kind: 'row', rowId }) }
    : () => undefined

  const renderRow = (row: Row<T>) => (
    <tr
      key={row.id}
      className={`${row.getIsSelected() ? 'selected' : ''} ${panel?.kind === 'row' && panel.rowId === row.id ? 'open' : ''} ${enableRowDetail ? 'clickable' : ''}`}
      onClick={onRowClick(row.id)}
    >
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          data-column-id={cell.column.id}
          data-type={engineState.profile[cell.column.id]?.type}
          style={{ width: cell.column.getSize(), maxHeight: maxCellHeight }}
        >
          <div className="cell-content" style={{ maxHeight: maxCellHeight }}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        </td>
      ))}
    </tr>
  )

  const header = (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              data-column-id={header.column.id}
              data-type={engineState.profile[header.column.id]?.type}
              className={header.column.getCanSort() ? 'sortable' : ''}
              style={{ width: header.getSize(), position: 'relative' }}
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
  )

  return (
    <div className={`data-table-container ${panel ? 'has-panel' : ''}`} data-density={density}>
      <div className="table-main">
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
          </div>
          <div className="toolbar-right">
            {enableAIColumns && (
              <button
                className={`btn-ai ${panel?.kind === 'add' ? 'active' : ''}`}
                onClick={() => openPanel(panel?.kind === 'add' ? null : { kind: 'add' })}
                aria-pressed={panel?.kind === 'add'}
              >
                <span className="ai-icon">✨</span>
                Add AI Column
              </button>
            )}
            {enableViewToggle && (
              <div className="view-toggle" role="radiogroup" aria-label="View">
                <button className={`view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => switchView('table')} title="Table" role="radio" aria-checked={viewMode === 'table'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className={`view-btn ${viewMode === 'groups' ? 'active' : ''}`} onClick={() => switchView('groups')} title="Grouped by category" role="radio" aria-checked={viewMode === 'groups'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="4" rx="2"/>
                    <path d="M7 12h12M7 16h12" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className={`view-btn ${viewMode === 'card' ? 'active' : ''}`} onClick={() => switchView('card')} title="Cards" role="radio" aria-checked={viewMode === 'card'}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
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
              {header}
              <tbody>{rows.map(renderRow)}</tbody>
            </table>
          </div>
        )}

        {/* Bands View: one tinted header per discovered category */}
        {viewMode === 'groups' && (
          <div className="table-wrapper">
            <table className="data-table banded" style={{ width: table.getCenterTotalSize() }}>
              {header}
              {bands.map(band => (
                <tbody key={band.value} className={collapsed.has(band.value) ? 'collapsed' : ''}>
                  <tr className="band" style={{ ['--band' as string]: band.color }}>
                    <td colSpan={columnCount}>
                      <button type="button" className="band-toggle" onClick={() => toggleBand(band.value)} aria-expanded={!collapsed.has(band.value)}>
                        <span className="caret" aria-hidden="true">▾</span>
                        <i className="band-dot" />
                        <span className="band-label">{band.label}</span>
                        <span className="band-count num">{band.members.length}</span>
                        {band.mean != null && aggKey && (
                          <span className="band-agg num">mean {aggKey} {Number.isInteger(band.mean) ? band.mean : band.mean.toFixed(1)}</span>
                        )}
                      </button>
                    </td>
                  </tr>
                  {!collapsed.has(band.value) && band.members.map(renderRow)}
                </tbody>
              ))}
            </table>
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="cards-grid">
            {rows.map((row) => (
              <DataCard
                key={row.id}
                row={row}
                aiColumns={aiColumns}
                engine={untypedEngine}
                isSelected={row.getIsSelected()}
                onToggleSelect={() => row.toggleSelected()}
                onOpen={enableRowDetail ? () => openPanel({ kind: 'row', rowId: row.id }) : undefined}
                enableSelection={enableRowSelection}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {enablePagination && (
          <div className="pagination">
            <div className="pagination-info num">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} entries
            </div>
            <div className="pagination-controls">
              <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} aria-label="First page">{'<<'}</button>
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">{'<'}</button>
              <span className="page-info num">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">{'>'}</button>
              <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} aria-label="Last page">{'>>'}</button>
            </div>
          </div>
        )}
      </div>

      {/* One slot on the right: add-column setup or row detail, never both */}
      {panel?.kind === 'add' && (
        <AddColumnPanel engine={untypedEngine} rowIds={engineState.rowIds} onAdd={generateAIColumn} onClose={() => openPanel(null)} />
      )}
      {panel?.kind === 'row' && (
        <RowDetailPanel engine={untypedEngine} rowId={panel.rowId} onSelectRow={(id) => setPanel({ kind: 'row', rowId: id })} onClose={() => openPanel(null)} />
      )}

      {/* Floating selection bar */}
      {enableRowSelection && selectedCount > 0 && (
        <div className="selection-bar" role="status">
          <span className="num">{selectedCount} selected</span>
          <button type="button" onClick={() => table.resetRowSelection()}>Clear</button>
        </div>
      )}
    </div>
  )
}

export default DataTable

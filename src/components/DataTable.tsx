import { useState, useCallback, useMemo } from 'react'
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
import './table.css'

// AI Column Types
interface AIColumn {
  id: string
  header: string
  prompt: string
  values: Record<string, string>
}

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
}

const defaultGetRowId = <T,>(row: T, index: number): string => {
  const id = (row as Record<string, unknown>).id
  return id != null ? String(id) : String(index)
}

// AI Analysis Functions (simulated)
const analyzeWithAI = (prompt: string, rowData: Record<string, unknown>): string => {
  const promptLower = prompt.toLowerCase()

  // Priority/Urgency analysis
  if (promptLower.includes('priority') || promptLower.includes('urgent')) {
    const qty = rowData.quantity as number
    const reorder = rowData.reorderPoint as number
    const status = rowData.status as string
    if (status === 'Out of Stock') return 'Critical - Reorder Now'
    if (qty <= reorder) return 'High - Below Reorder Point'
    if (qty <= reorder * 1.5) return 'Medium - Monitor Closely'
    return 'Low - Adequate Stock'
  }

  // Restock recommendation
  if (promptLower.includes('restock') || promptLower.includes('order')) {
    const qty = rowData.quantity as number
    const reorder = rowData.reorderPoint as number
    if (qty === 0) return `Order ${reorder * 2} units immediately`
    if (qty < reorder) return `Order ${reorder - qty + 20} units soon`
    return 'No restock needed'
  }

  // Risk assessment
  if (promptLower.includes('risk')) {
    const qty = rowData.quantity as number
    const price = rowData.price as number
    const status = rowData.status as string
    if (status === 'Out of Stock') return 'High Risk - Lost Sales'
    if (qty < 20 && price > 100) return 'Medium Risk - High Value Item'
    if (qty < 10) return 'Medium Risk - Low Inventory'
    return 'Low Risk'
  }

  // Value/Revenue analysis
  if (promptLower.includes('value') || promptLower.includes('revenue')) {
    const qty = rowData.quantity as number
    const price = rowData.price as number
    const value = qty * price
    if (value > 10000) return `High Value ($${value.toLocaleString()})`
    if (value > 1000) return `Medium Value ($${value.toLocaleString()})`
    return `Low Value ($${value.toLocaleString()})`
  }

  // Category insights
  if (promptLower.includes('insight') || promptLower.includes('summary')) {
    const category = rowData.category as string
    const status = rowData.status as string
    return `${category} item - ${status}`
  }

  // Default analysis
  return 'Analysis pending...'
}

// AI Column Modal Component
function AIColumnModal({
  isOpen,
  onClose,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (name: string, prompt: string) => void
}) {
  const [columnName, setColumnName] = useState('')
  const [prompt, setPrompt] = useState('')

  const handleSubmit = () => {
    if (columnName.trim() && prompt.trim()) {
      onSubmit(columnName, prompt)
      setColumnName('')
      setPrompt('')
      onClose()
    }
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
            <label>Column Name</label>
            <input
              type="text"
              value={columnName}
              onChange={e => setColumnName(e.target.value)}
              placeholder="e.g., Priority Level"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>AI Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Analyze the inventory status and determine priority level for reordering"
              className="form-textarea"
              rows={3}
            />
          </div>
          <div className="prompt-suggestions">
            <span className="suggestion-label">Try:</span>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => setPrompt('Determine the priority level for restocking this item')}
            >
              Priority Level
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => setPrompt('Calculate risk assessment for this inventory item')}
            >
              Risk Assessment
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => setPrompt('Provide restock recommendation based on current quantity')}
            >
              Restock Advice
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => setPrompt('Calculate total inventory value and categorize')}
            >
              Value Analysis
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <span className="ai-icon">✨</span> Generate Column
          </button>
        </div>
      </div>
    </div>
  )
}

// Card View Component
function DataCard<T>({
  row,
  aiColumns,
  isSelected,
  onToggleSelect,
  enableSelection
}: {
  row: Row<T>
  aiColumns: AIColumn[]
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
              {aiCol.values[row.id] || 'Analyzing...'}
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
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [aiColumns, setAIColumns] = useState<AIColumn[]>([])
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  // Generate AI column values
  const generateAIColumn = useCallback((name: string, prompt: string) => {
    const newColumn: AIColumn = {
      id: `ai-${Date.now()}`,
      header: name,
      prompt: prompt,
      values: {}
    }

    // Generate values for each row
    data.forEach((row, index) => {
      const id = getRowId(row, index)
      newColumn.values[id] = analyzeWithAI(prompt, row as Record<string, unknown>)
    })

    setAIColumns(prev => [...prev, newColumn])
  }, [data, getRowId])

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
      cell: ({ row }: { row: Row<T> }) => (
        <div className="ai-cell">
          {aiCol.values[row.id] || 'Analyzing...'}
        </div>
      ),
      size: 180,
      enableSorting: false,
    }))
  ], [initialColumns, aiColumns, removeAIColumn])

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
      />
    </div>
  )
}

export default DataTable

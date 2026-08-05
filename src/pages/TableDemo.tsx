import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../components/DataTable'
import { Checkbox } from '../components/Checkbox'
import { inventoryData } from '../data/inventory'
import type { InventoryItem } from '../data/inventory'

function TableDemo() {
  const columns = useMemo<ColumnDef<InventoryItem, unknown>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false}
            onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 100,
      },
      {
        accessorKey: 'name',
        header: 'Product Name',
        size: 200,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 120,
      },
      {
        accessorKey: 'quantity',
        header: 'Qty',
        size: 80,
        cell: ({ getValue }) => {
          const value = getValue() as number
          return <span style={{ fontWeight: value === 0 ? 'bold' : 'normal' }}>{value}</span>
        },
      },
      {
        accessorKey: 'reorderPoint',
        header: 'Reorder At',
        size: 100,
      },
      {
        accessorKey: 'price',
        header: 'Price',
        size: 100,
        cell: ({ getValue }) => `$${(getValue() as number).toFixed(2)}`,
      },
      {
        accessorKey: 'supplier',
        header: 'Supplier',
        size: 140,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        size: 120,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue() as string
          const className = status
            .toLowerCase()
            .replace(' ', '-')
          return <span className={`status-badge ${className}`}>{status}</span>
        },
      },
    ],
    []
  )

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="back-link">&larr; Back</Link>
        <h1>Table Demo</h1>
        <p>Test the inventory table with sorting, filtering, pagination, and row selection.</p>
      </div>

      <div className="demo-container">
        <DataTable
          data={inventoryData}
          columns={columns}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
          enableRowSelection={true}
          pageSize={5}
        />
      </div>

      <div className="demo-info">
        <h3>Features to Try:</h3>
        <ul>
          <li><strong>Sort:</strong> Click any column header to sort</li>
          <li><strong>Search:</strong> Use the search box to filter across all columns</li>
          <li><strong>Select:</strong> Use checkboxes to select rows for bulk actions</li>
          <li><strong>Paginate:</strong> Navigate through pages with the controls below</li>
        </ul>
      </div>

      <style>{`
        .page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          font-size: 0.9em;
        }

        .page-header p {
          color: #888;
          margin: 0;
        }

        .demo-container {
          margin-bottom: 2rem;
        }

        .demo-info {
          background: rgba(100, 108, 255, 0.1);
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid rgba(100, 108, 255, 0.2);
        }

        .demo-info h3 {
          margin-top: 0;
          color: #646cff;
        }

        .demo-info ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .demo-info li {
          margin-bottom: 0.5rem;
        }

        @media (prefers-color-scheme: light) {
          .demo-info {
            background: rgba(100, 108, 255, 0.05);
          }
        }
      `}</style>
    </div>
  )
}

export default TableDemo

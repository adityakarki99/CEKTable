# CEKTable

Table engine to power CEKO, built on [TanStack Table](https://tanstack.com/table) v8. This repo is both a demo app (`src/pages`) and a publishable library (`src/index.ts`).

## Using CEKTable as a library

Install directly from GitHub, pinned to a tag or commit:

```sh
npm install github:adityakarki99/CEKTable#v0.1.0
```

`npm install` runs this package's `prepare` script automatically, which builds `dist/lib` — no separate build step needed on the consumer side.

```tsx
import { DataTable } from 'cektable'
import 'cektable/style.css'
import type { ColumnDef } from '@tanstack/react-table'

interface Product {
  sku: string
  name: string
  quantity: number
}

const columns: ColumnDef<Product, unknown>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'quantity', header: 'Qty' },
]

<DataTable data={products} columns={columns} getRowId={(row) => row.sku} />
```

`react`, `react-dom`, and `@tanstack/react-table` are peer dependencies — install matching versions in the consuming app. `getRowId` is optional; it defaults to using each row's `.id` field (falling back to its index) but should be set explicitly for row shapes without an `id`, mirroring TanStack Table's own `getRowId` option.

## Local development

- `npm run dev` — run the demo app (`/`, `/demo`, `/components`)
- `npm run build` — build the demo app
- `npm run build:lib` — build the library output (`dist/lib`)
- `npm run lint` — lint

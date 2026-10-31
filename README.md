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

## The engine (headless)

CEKTable ships a headless engine under `cektable` alongside the React component. It turns rows into vectors with a weight-free encoder and derives everything else from the geometry: discovered categories, nearest-prototype assignment with confidence, outlier scores, nearest neighbours and chart recommendations emitted as Vega-Lite specs. No prompt, no model call, no DOM.

```ts
import { createTable, spaceToJSON } from 'cektable'

const table = createTable({ data: products, getRowId: (r) => r.sku, exclude: ['id', 'lastUpdated'] })

table.discoverCategories(4)              // k-means over row vectors → category space
table.state.categories['SKU-003']        // { value: 'c2', label: 'Out of Stock', confidence: 0.91, flagged: false }
table.correct('SKU-003', 'c1')           // moves the prototype, re-assigns every row
table.scoreOutliers()                    // 0–100 distance from each row's own prototype
table.neighbors('SKU-001', 5)            // [{ rowId, similarity }]
table.recommendCharts({ max: 3 })        // [{ title, spec }] — Vega-Lite v5 with data inlined
JSON.stringify(spaceToJSON(table.state.space))   // category JSON, versioned with your project
```

`DataTable` uses the same engine for its AI columns (category, outlier score, similarity). Pass `encoder` to swap the hashing encoder for a learned one, `excludeFromEncoding` to keep ids and timestamps out of the vectors, and `onEngine` to get the engine instance for your own calls. Category chips can be clicked to correct them.

## Local development

- `npm run dev` — run the demo app (`/`, `/demo`, `/components`)
- `npm run build` — build the demo app
- `npm run build:lib` — build the library output (`dist/lib`)
- `npm run lint` — lint
- `npm run test` — run the engine tests (Vitest)

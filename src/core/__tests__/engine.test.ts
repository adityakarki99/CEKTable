import { describe, expect, it } from 'vitest'
import { createTable, spaceFromJSON, spaceToJSON, profile, hashingEncoder, kmeans, assignCategory } from '..'

const rows = [
  { sku: 'A1', name: 'Wireless Mouse', group: 'Electronics', qty: 150, price: 29.99 },
  { sku: 'A2', name: 'Mechanical Keyboard', group: 'Electronics', qty: 30, price: 89.99 },
  { sku: 'A3', name: 'USB-C Hub', group: 'Electronics', qty: 0, price: 49.99 },
  { sku: 'B1', name: 'Office Chair', group: 'Furniture', qty: 45, price: 199.99 },
  { sku: 'B2', name: 'Standing Desk', group: 'Furniture', qty: 12, price: 399.99 },
  { sku: 'B3', name: 'Ergonomic Chair', group: 'Furniture', qty: 6, price: 349 },
  { sku: 'C1', name: 'Desk Lamp LED', group: 'Lighting', qty: 200, price: 24.99 },
  { sku: 'C2', name: 'Floor Lamp', group: 'Lighting', qty: 80, price: 59.99 },
  { sku: 'A4', name: 'Wireless Mouse (refurb)', group: 'Electronics', qty: 14, price: 19.99 },
]

describe('profile', () => {
  it('infers column types', () => {
    const p = profile(rows)
    expect(p.sku.type).toBe('id')
    expect(p.name.type).toBe('text')
    expect(p.group.type).toBe('enum')
    expect(p.qty.type).toBe('number')
    expect(p.price.mean).toBeGreaterThan(0)
  })
})

describe('hashing encoder', () => {
  it('is deterministic and unit length', () => {
    const enc = hashingEncoder()
    const p = profile(rows)
    const a = enc.encode(rows[0], p)
    const b = enc.encode(rows[0], p)
    expect(Array.from(a)).toEqual(Array.from(b))
    let n = 0
    for (const x of a) n += x * x
    expect(n).toBeCloseTo(1, 5)
  })
})

describe('kmeans', () => {
  it('assigns every vector and returns k centroids', () => {
    const enc = hashingEncoder()
    const p = profile(rows)
    const vecs = rows.map((r) => enc.encode(r, p))
    const { labels, centroids } = kmeans(vecs, 3)
    expect(centroids).toHaveLength(3)
    expect(new Set(Array.from(labels)).size).toBeGreaterThan(1)
  })
})

describe('createTable', () => {
  const make = () => createTable({ data: rows, getRowId: (r) => r.sku })

  it('encodes on creation and finds near-duplicates as neighbours', () => {
    const t = make()
    expect(t.state.rowIds).toHaveLength(rows.length)
    expect(t.vector('A1')).toBeDefined()
    const nb = t.neighbors('A1', 1)
    expect(nb[0].rowId).toBe('A4')
    expect(nb[0].similarity).toBeGreaterThan(0.5)
  })

  it('discovers categories and assigns every row with a confidence', () => {
    const t = make()
    const space = t.discoverCategories(3)
    expect(space.categories).toHaveLength(3)
    for (const id of t.state.rowIds) {
      const c = t.state.categories[id]
      expect(space.categories.map((x) => x.value)).toContain(c.value)
      expect(c.confidence).toBeGreaterThanOrEqual(0)
      expect(c.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('round-trips a category space through JSON', () => {
    const t = make()
    const space = t.discoverCategories(3)
    const json = JSON.parse(JSON.stringify(spaceToJSON(space)))
    const back = spaceFromJSON(json)
    const v = t.vector('B1')!
    expect(assignCategory(back, v).value).toBe(assignCategory(space, v).value)
    const t2 = make()
    t2.loadCategories(back)
    expect(t2.state.categories.B1.value).toBe(t.state.categories.B1.value)
  })

  it('moves the prototype on correction', () => {
    const t = make()
    const space = t.discoverCategories(3)
    const target = space.categories.find((c) => c.value !== t.state.categories.A1.value)!
    const before = t.state.categories.A1.value
    for (let i = 0; i < 12; i++) t.correct('A1', target.value)
    expect(before).not.toBe(target.value)
    expect(t.state.categories.A1.value).toBe(target.value)
    expect(t.state.space!.categories.find((c) => c.value === target.value)!.exemplars).toContain('A1')
  })

  it('scores outliers in 0..100', () => {
    const t = make()
    const s = t.scoreOutliers()
    const vals = Object.values(s)
    expect(vals).toHaveLength(rows.length)
    expect(Math.max(...vals)).toBe(100)
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(0)
  })

  it('recommends charts as Vega-Lite specs with inlined data', () => {
    const t = make()
    t.discoverCategories(3)
    const charts = t.recommendCharts({ max: 3 })
    expect(charts.length).toBeGreaterThanOrEqual(2)
    expect(charts[0].candidate.kind).toBe('map')
    for (const c of charts) {
      expect(c.spec.$schema).toContain('vega-lite')
      expect(c.spec.data.values.length).toBeGreaterThan(0)
    }
    const explicit = t.chart({ x: 'group', y: 'price' })
    expect(explicit.spec.mark).toBe('bar')
    expect(explicit.spec.data.values.map((v) => v.group)).toContain('Furniture')
  })

  it('notifies subscribers and re-encodes on setData', () => {
    const t = make()
    let calls = 0
    const off = t.subscribe(() => calls++)
    t.setData(rows.slice(0, 4))
    expect(calls).toBe(1)
    expect(t.state.rowIds).toHaveLength(4)
    off()
    t.setData(rows)
    expect(calls).toBe(1)
  })
})

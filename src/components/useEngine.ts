import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { createTable } from '../core'
import type { Encoder, EngineState, EngineTable } from '../core'

export interface UseEngineOptions<T> {
  data: T[]
  getRowId: (row: T, index: number) => string
  encoder?: Encoder
  exclude?: string[]
  onEngine?: (engine: EngineTable<T>) => void
}

/** One headless engine per component, kept in sync with `data`. */
export function useEngine<T>({ data, getRowId, encoder, exclude, onEngine }: UseEngineOptions<T>): EngineTable<T> {
  const engine = useMemo(
    () => createTable<T & object>({ data: data as (T & object)[], getRowId, encoder, exclude }),
    // Data changes go through setData below instead of rebuilding the engine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encoder, getRowId, exclude]
  ) as unknown as EngineTable<T>
  useEffect(() => { if (engine.rows !== data) engine.setData(data) }, [engine, data])
  useEffect(() => { onEngine?.(engine) }, [engine, onEngine])
  return engine
}

/**
 * Subscribe to an engine and return a snapshot that changes identity on every
 * engine update. Any component that reads `engine.state` should go through this,
 * so it re-renders on its own instead of waiting for a parent.
 */
export function useEngineState(engine: EngineTable<unknown>): EngineState {
  const subscribe = useCallback((cb: () => void) => engine.subscribe(cb), [engine])
  // The engine mutates one state object, so snapshot on the version number.
  const version = useSyncExternalStore(subscribe, () => engine.state.version, () => engine.state.version)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ ...engine.state }), [engine, version])
}

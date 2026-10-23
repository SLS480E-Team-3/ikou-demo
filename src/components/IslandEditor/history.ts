// DEV
import { useCallback, useRef, useState } from "react"

type History<T> = { past: T[], present: T, future: T[] }

const LIMIT = 200
const MERGE_MS = 800
// at most LIMIT undo steps are kept; commits with the same merge key within
// MERGE_MS of each other (typing into one field) become one step

export function useHistory<T>(initial: T) {
    const [h, setH] = useState<History<T>>({ past: [], present: initial, future: [] })
    const last = useRef<{ key?: string, at: number }>({ at: 0 })

    const begin = useCallback(() => {
        last.current = { at: 0 }
        setH(s => ({ past: [...s.past, s.present].slice(-LIMIT), present: s.present, future: [] }))
    }, [])
    // opens a new undo step at the current state (a drag calls this once on
    // pointerdown, then live() on every move)

    const live = useCallback((next: T | ((p: T) => T)) => {
        setH(s => ({ ...s, present: typeof next === 'function' ? (next as (p: T) => T)(s.present) : next }))
    }, [])
    // replaces the current state without a new undo step

    const commit = useCallback((next: T | ((p: T) => T), key?: string) => {
        const now = Date.now()
        const merge = key !== undefined && last.current.key === key && now - last.current.at < MERGE_MS
        last.current = { key, at: now }
        setH(s => {
            const value = typeof next === 'function' ? (next as (p: T) => T)(s.present) : next
            return merge ? { ...s, present: value } : { past: [...s.past, s.present].slice(-LIMIT), present: value, future: [] }
        })
    }, [])
    // one edit = one undo step, except a run of commits with the same key

    const undo = useCallback(() => setH(s => s.past.length
        ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] }
        : s), [])
    const redo = useCallback(() => setH(s => s.future.length
        ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) }
        : s), [])
    const reset = useCallback((value: T) => setH({ past: [], present: value, future: [] }), [])
    // reset = a freshly opened version: no history to undo into

    return { state: h.present, canUndo: h.past.length > 0, canRedo: h.future.length > 0, begin, live, commit, undo, redo, reset }
}
// undo / redo for the island being edited (spec F-12): whole-state
// snapshots, which is cheap for an island (a few dozen objects) and covers
// every kind of edit the same way

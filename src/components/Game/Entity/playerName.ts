'use client'

import { useEffect, useState } from "react"

let cached: Promise<string | undefined> | undefined

const loadName = () => cached ??= fetch('/api/EditInfo')
    .then(r => r.ok ? r.json() : undefined)
    .then(d => (typeof d?.username === 'string' && d.username) || undefined)
    .catch(() => undefined)
// the signed-in player's username from GET /api/EditInfo (profiles.username),
// fetched once per page load and shared by every GameScene mount (island ->
// quest -> island doesn't refetch). Logged out (401, the /MobDev pages) or
// offline resolves to undefined

export function usePlayerName() {
    const [name, setName] = useState<string>()
    useEffect(() => {
        let live = true
        loadName().then(n => { if (live) setName(n) })
        return () => { live = false }
    }, [])
    return name
}
// the username for the player's name tag, undefined until it loads or when
// no one is logged in (GameScene then keeps its 'Player' fallback). live
// stops a late answer from setting state after the scene unmounted

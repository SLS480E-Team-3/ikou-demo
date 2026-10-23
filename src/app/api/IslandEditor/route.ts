// DEV
import { NextResponse } from 'next/server'
import { adminClient } from '@/utils/supabase'
import { listVersions, readIslandFile, saveIslandFile } from '@/utils/islandFiles'
import type { IslandFile } from '@/components/Game/islands/islandFile'

export async function GET(req: Request) {
    const q = new URL(req.url).searchParams
    const island = Number(q.get('island'))
    if (!q.get('island')) {
        const { data } = await adminClient().from('islands').select('id, name').order('sort_order')
        return NextResponse.json({ islands: data ?? [] })
    }
    if (!Number.isInteger(island)) return NextResponse.json({ error: 'bad island' }, { status: 400 })
    if (!q.get('ver')) return NextResponse.json({ versions: await listVersions(island) })
    const file = await readIslandFile(island, Number(q.get('ver')))
    return file ? NextResponse.json({ file }) : NextResponse.json({ error: 'no such version' }, { status: 404 })
}
// GET                     -> { islands: [{ id, name }] } (the island picker)
// GET ?island=N           -> { versions: [1, 2, ...] }
// GET ?island=N&ver=V     -> { file: IslandFile }

export async function POST(req: Request) {
    const { file } = await req.json() as { file: IslandFile }
    if (!file || !Number.isInteger(file.islandId)) return NextResponse.json({ error: 'bad file' }, { status: 400 })
    try {
        const saved = await saveIslandFile(file)
        return NextResponse.json({ ver: saved.ver, savedAt: saved.savedAt })
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
}
// POST { file } -> writes <island>_ver<N+1>.json and returns { ver }. No
// login check: the editor is open to anyone (spec D-15), so the admin
// client does the write

import { adminClient } from '@/utils/supabase'
import { FILE_RE, ISLAND_FILE_BUCKET, fileName, type IslandFile } from '@/components/Game/islands/islandFile'

export async function listVersions(islandId: number): Promise<number[]> {
    const { data, error } = await adminClient().storage.from(ISLAND_FILE_BUCKET).list('', { limit: 1000 })
    if (error || !data) return []
    return data.flatMap(f => {
        const m = FILE_RE.exec(f.name)
        return m && Number(m[1]) === islandId ? [Number(m[2])] : []
    }).sort((a, b) => a - b)
}
// the saved vers of one island, oldest first, read from the island-editor
// bucket's file names. A missing bucket (SQL not run yet) gives none, so
// the editor and the game fall back to the code's island

export async function readIslandFile(islandId: number, ver: number): Promise<IslandFile | null> {
    const { data, error } = await adminClient().storage.from(ISLAND_FILE_BUCKET).download(fileName(islandId, ver))
    if (error || !data) return null
    return JSON.parse(await data.text()) as IslandFile
}
// one saved ver, parsed. null when it does not exist

export async function latestIslandFile(islandId: number): Promise<IslandFile | null> {
    const vers = await listVersions(islandId)
    return vers.length ? readIslandFile(islandId, vers[vers.length - 1]) : null
}
// the newest saved ver of an island, which the game plays (spec F-6); null
// = never saved, the game keeps the islands.ts map

export async function saveIslandFile(file: Omit<IslandFile, 'ver' | 'savedAt'>): Promise<IslandFile> {
    const vers = await listVersions(file.islandId)
    const saved: IslandFile = { ...file, ver: (vers[vers.length - 1] ?? 0) + 1, savedAt: new Date().toISOString() }
    const { error } = await adminClient().storage.from(ISLAND_FILE_BUCKET)
        .upload(fileName(saved.islandId, saved.ver), JSON.stringify(saved, null, 2), { contentType: 'application/json', upsert: false })
    if (error) throw new Error(error.message)
    return saved
}
// writes a new ver, one higher than the highest (spec F-7: the opened ver
// is never overwritten). upsert false makes two saves racing for the same
// ver fail instead of one silently replacing the other

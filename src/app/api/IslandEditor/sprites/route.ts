// DEV
import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { adminClient } from '@/utils/supabase'
import { SPRITE_BUCKET, type FileSprite } from '@/components/Game/islands/islandFile'

const INDEX = 'index.json'
const KEY_RE = /^[a-z0-9][a-z0-9-]*$/

async function readIndex(): Promise<FileSprite[]> {
    const { data, error } = await adminClient().storage.from(SPRITE_BUCKET).download(INDEX)
    if (error || !data) return []
    return JSON.parse(await data.text()) as FileSprite[]
}
// every uploaded sprite, kept as one index.json in the sprites bucket so
// the asset box lists them without reading each image. Missing = none yet

export async function GET() {
    return NextResponse.json({ sprites: await readIndex() })
}

export async function POST(req: Request) {
    const form = await req.formData()
    const file = form.get('file')
    const key = String(form.get('key') ?? '')
    const w = Number(form.get('w')), h = Number(form.get('h'))
    if (!(file instanceof File) || !KEY_RE.test(key) || !(w > 0) || !(h > 0)) return NextResponse.json({ error: 'need an image, a key (a-z, 0-9, -) and w / h > 0' }, { status: 400 })
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase()
    const name = `${key}.${ext}`
    const bytes = Buffer.from(await file.arrayBuffer())

    const storage = adminClient().storage.from(SPRITE_BUCKET)
    const up = await storage.upload(name, bytes, { contentType: file.type || 'image/png', upsert: true })
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 })
    const sprite: FileSprite = { key, sprite: { src: storage.getPublicUrl(name).data.publicUrl, w, h, alt: key } }
    const index = [...(await readIndex()).filter(s => s.key !== key), sprite]
    const ix = await storage.upload(INDEX, JSON.stringify(index, null, 2), { contentType: 'application/json', upsert: true })
    if (ix.error) return NextResponse.json({ error: ix.error.message }, { status: 500 })

    let repoPath: string | undefined
    if (process.env.NODE_ENV === 'development') {
        const dir = path.join(process.cwd(), 'public', 'img', 'uploads')
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, name), bytes)
        repoPath = `public/img/uploads/${name}`
    }
    return NextResponse.json({ sprite, repoPath })
}
// POST form { file, key, w, h } -> the sprite goes to the sprites bucket
// (its public url is the src every island file stores, so it loads on
// Vercel too) and into index.json. The repo copy (spec D-19) is written
// only under `npm run dev`, to public/img/uploads/, for the dev to commit;
// Vercel's file system is read-only, so a deployed upload is Supabase-only.
// Re-uploading a key replaces it

// DEV
import { NextResponse } from 'next/server'
import { adminClient } from '@/utils/supabase'
import type { EditorQuest } from '@/components/IslandEditor/types'

export async function GET(req: Request) {
    const island = Number(new URL(req.url).searchParams.get('island'))
    if (!Number.isInteger(island)) return NextResponse.json({ error: 'bad island' }, { status: 400 })
    const { data, error } = await adminClient().from('quests').select('*').eq('island_id', island).order('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quests: data })
}
// GET ?island=N -> { quests: rows }. select('*') so it works before and
// after the level / quest_type / target columns are added (docs/SQL-query.md)

export async function POST(req: Request) {
    const { quest } = await req.json() as { quest: EditorQuest }
    if (!quest || !Number.isInteger(quest.island_id) || !quest.title) return NextResponse.json({ error: 'island_id and title are required' }, { status: 400 })
    const row = {
        island_id: quest.island_id,
        title: quest.title,
        reward_points: quest.reward_points ?? 0,
        kana: typeof quest.target === 'string' ? quest.target : null,
        level: quest.level ?? null,
        quest_type: quest.quest_type ?? null,
        target: quest.target ?? null,
    }
    const db = adminClient().from('quests')
    const { data, error } = quest.id
        ? await db.update(row).eq('id', quest.id).select('*').single()
        : await db.insert(row).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ quest: data })
}
// POST { quest } -> creates (no id) or updates (id) one quests row and
// returns it. kana mirrors a string target, so the kana-matched code paths
// (quest page training target, the code islands' rows) keep working

// DEV
'use client'

import { CSSProperties, useMemo, useState } from "react"
import MobileView from "@/components/MobileView"
import { GALAXY_S26_SCREEN, IPHONE13_MINI_SCREEN, IPHONE17_MAX_SCREEN, IPHONE17_SCREEN, IPHONE_SE_3RD_GEN_SCREEN, PIXEL_10_SCREEN } from "@/utils/mobileScreenSIze"
import GameScene from "@/components/Game/Scene/gameScene"
import { fileBg, registerSprites, type IslandFile } from "@/components/Game/islands/islandFile"
import { layoutNpcs } from "@/components/Game/islands/layoutNpcs"
import { useTileWalk } from "@/components/Game/islands/tiles"
import type { EditorQuest } from "./types"

const PHONES: { label: string, size: CSSProperties }[] = [
    { label: 'iPhone 17', size: IPHONE17_SCREEN },
    { label: 'iPhone 17 Pro Max', size: IPHONE17_MAX_SCREEN },
    { label: 'iPhone 13 mini', size: IPHONE13_MINI_SCREEN },
    { label: 'iPhone SE (3rd)', size: IPHONE_SE_3RD_GEN_SCREEN },
    { label: 'Galaxy S26', size: GALAXY_S26_SCREEN },
    { label: 'Pixel 10', size: PIXEL_10_SCREEN },
]

export default function PhoneView({ file, quests }: { file: IslandFile, quests: EditorQuest[] }) {
    const [phone, setPhone] = useState(PHONES[0])
    const [note, setNote] = useState('')
    const scene = useMemo(() => {
        registerSprites(file.sprites)
        const npcs = layoutNpcs(file.npcs, quests.flatMap(q => q.id ? [{ id: q.id, title: q.title, kana: q.kana ?? null, target: q.target }] : []))
        return { bg: fileBg(file), npcs }
    }, [file, quests])
    // the island being edited, built the way the game builds a saved island
    // (same sections, uploaded sprites, NPCs and quest offers), so this is
    // what a player will see
    const tiles = file.tiles ?? []
    const [done, setDone] = useState<string[]>([])
    const cleared = tiles.map(t => done.includes(t.id))
    const tileWalk = useTileWalk(tiles, cleared, t => {
        const q = quests.find(x => x.id === t.questId)
        setNote(`はい → the game would open ${q ? `quest #${q.id} "${q.title}"` : 'nothing (no quest on this tile)'}; marked cleared here so the next tile opens`)
        setDone(d => d.includes(t.id) ? d : [...d, t.id])
    }, `editor-${file.islandId}`) // args: **+ seenKey**, mechanism: はい here plays the clear animation
    const tileMode = tiles.length > 0
    // tile mode, like IslandScene: no player is logged in here, so a tile's
    // はい marks it cleared for this phone view only, which opens the path to
    // the next tile

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={phone.label} onChange={e => setPhone(PHONES.find(p => p.label === e.target.value) ?? PHONES[0])}>
                    {PHONES.map(p => <option key={p.label}>{p.label}</option>)}
                </select>
                <span style={{ opacity: 0.7, fontSize: 13 }}>{tileMode ? 'Tap a tile to walk there. はい marks it cleared, so the next tile opens.' : 'Drag to walk (touch or mouse), WASD on a keyboard. Talk to an NPC to see its quest offer.'}</span>
                {tileMode && done.length > 0 && <button onClick={() => setDone([])}>reset cleared</button>}
            </div>
            {note && <div style={{ fontSize: 13, background: '#fff3c4', padding: '4px 8px' }}>{note}</div>}
            <MobileView size={phone.size} page={
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <GameScene key={JSON.stringify(file) + phone.label} {...(tileMode && tileWalk.sceneProps)} bgProps={tileMode && tileWalk.spawn ? { ...scene.bg, ...tileWalk.spawn } : scene.bg} objects={file.objects} npcs={scene.npcs}
                        onQuest={i => { const q = scene.npcs[i]?.quest; setNote(q ? `はい → the game would open quest #${q.id} "${q.title}"` : '') }} />
                </div>
            } />
        </div>
    )
}
// the phone-view button's view (spec F-5, D-14): the real GameScene in a
// phone-sized frame at game zoom, where touch drives the player, not the
// editor. A quest offer's はい only shows which quest would open, since
// quests need a logged-in player. key remounts the scene when the island
// or phone changes (GameScene reads its props once at mount)

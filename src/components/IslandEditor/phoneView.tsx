// DEV
'use client'

import { CSSProperties, useMemo, useState } from "react"
import MobileView from "@/components/MobileView"
import { GALAXY_S26_SCREEN, IPHONE13_MINI_SCREEN, IPHONE17_MAX_SCREEN, IPHONE17_SCREEN, IPHONE_SE_3RD_GEN_SCREEN, PIXEL_10_SCREEN } from "@/utils/mobileScreenSIze"
import GameScene from "@/components/Game/Scene/gameScene"
import { fileBg, registerSprites, type IslandFile } from "@/components/Game/islands/islandFile"
import { layoutNpcs } from "@/components/Game/islands/layoutNpcs"
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select value={phone.label} onChange={e => setPhone(PHONES.find(p => p.label === e.target.value) ?? PHONES[0])}>
                    {PHONES.map(p => <option key={p.label}>{p.label}</option>)}
                </select>
                <span style={{ opacity: 0.7, fontSize: 13 }}>Drag to walk (touch or mouse), WASD on a keyboard. Talk to an NPC to see its quest offer.</span>
            </div>
            {note && <div style={{ fontSize: 13, background: '#fff3c4', padding: '4px 8px' }}>{note}</div>}
            <MobileView size={phone.size} page={
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <GameScene key={JSON.stringify(file) + phone.label} bgProps={scene.bg} objects={file.objects} npcs={scene.npcs}
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

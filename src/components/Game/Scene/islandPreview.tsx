// DEV
'use client'

import { CSSProperties, useEffect, useState } from "react" // imports: **useEffect commented out** -> **useEffect**, mechanism: loads the island's saved version (the BGM effect stays commented out) // imports: **useEffect** -> **commented out**, mechanism: its only use, the island BGM, is commented out
// import { ISLAND_BGM, playBgm } from "@/components/Game/Entity/voice" // music: **on** -> **commented out**, reason: BGM and quest clear / fail music turned off for now, mechanism: uncomment to bring it back
import GameScene, { ISLAND_COUNT, islandBg } from "@/components/Game/Scene/gameScene"
import { ISLAND_MAPS } from "@/components/Game/islands"
import { BUBBLE_BG } from "@/components/Game/Entity/dialogBubble"
import { npcsForRow } from "@/components/Game/npcs/npcs"
import { DodgeQuestIsland } from "@/components/Game/Scene/dodgeQuestIsland"
import { MatchingQuestIsland } from "@/components/Game/Scene/matchingQuestIsland" // imports: **+ MatchingQuestIsland, groupOf**, mechanism: a saved quest with a { group } target opens the matching quest
import { groupOf, type KosoadoGroup } from "@/components/Game/kosoado" // imports: **none** -> **DodgeQuestIsland**, mechanism: island 2's NPCs open the dodge quest, like QuestScene
import { ISLAND_NPCS } from "@/components/Game/npcs"
import { KANA_ROWS } from "@/components/Game/kana"
import { fileBg, registerSprites, type IslandFile } from "@/components/Game/islands/islandFile"
import { layoutNpcs, type LayoutQuest } from "@/components/Game/islands/layoutNpcs"
import { useTileWalk } from "@/components/Game/islands/tiles"
// imports: **none** -> **islandFile, layoutNpcs, useTileWalk**, mechanism: /MobDev plays the island's saved <island>_ver<N>.json like /Game does
// MobileTester's 'game scene' page, moved here so /MobDev/GameScene?island=N can show it
// full-screen on a phone too

type QuestPick = { kana: string, group?: KosoadoGroup, timerMs?: number } // pick: **+ timerMs**, mechanism: the quest's timer_ms from the editor
// the quest a はい opens without login: the dodge quest with kana, or the
// matching quest when group is set

type Saved = { island: number, ver: number, file: IslandFile | null, quests: LayoutQuest[], error?: string } // type: **+ error**, mechanism: the first failed editor API request, shown under the island number
// what loadSaved found for one island: file null = no saved version (or
// ?ver=0, or a failed load), so the code's map plays

const loadSaved = async (island: number, ver?: number): Promise<Saved> => {
    let error: string | undefined
    const get = (url: string, what: string): Promise<{ versions?: number[], quests?: LayoutQuest[], file?: IslandFile }> => fetch(url)
        .then(r => { if (r.ok) return r.json(); error ??= `${what}: HTTP ${r.status}`; return {} })
        .catch(() => { error ??= `${what}: network error`; return {} }) // get: **any failure = {}** -> **{} and the first failure kept in error**, reason: on Vercel the API 500'd and the code map showed as if nothing was saved, mechanism: the label shows error instead
    const [{ versions = [] }, { quests = [] }] = await Promise.all([get(`/api/IslandEditor?island=${island}`, 'versions'), get(`/api/IslandEditor/quests?island=${island}`, 'quests')])
    const v = ver ?? versions[versions.length - 1] ?? 0
    const { file = null } = v ? await get(`/api/IslandEditor?island=${island}&ver=${v}`, `${island}_ver${v}.json`) : {}
    return { island, ver: file ? v : 0, file, quests, error }
}
// the island's saved version through the editor's API (both DEV): the
// asked ver, else the newest. Quests come along for the NPCs' and tiles'
// quest ids. A failed request still falls back (no file = the code's map,
// no quests = NPCs just talk), but its error is kept for the label

export default function IslandPreview({ sensitivity, start = 1, tint = false, ver }: { sensitivity?: number, start?: number, tint?: boolean, ver?: number }) { // props: **+ ver**, mechanism: ?ver=N opens that saved version of the start island (0 = the code's map); left out = the newest // props: **sensitivity, start** -> **+ tint**, reason: the page color around the scene stayed on the first island after next ▶, mechanism: tint is drawn here, where the current island is known // props: **sensitivity** -> **+ start, sensitivity optional**, mechanism: /MobDev/GameScene?island=N opens on island N; GameScene falls back to SENSITIVITY_DEF // props: **sensitivity** -> **+ start, sensitivity optional**, mechanism: /MobDev/GameScene?island=N opens on island N; GameScene falls back to SENSITIVITY_DEF
    const [island, setIsland] = useState(Math.min(ISLAND_COUNT, Math.max(1, start))) // initial: **1** -> **start, clamped to 1..ISLAND_COUNT**, mechanism: a bad ?island= still opens a real island
    const [row, setRow] = useState(0)
    // the kana row the NPCs offer (0 = あ–お): with no login there's no quest
    // progress, so the row buttons stand in for clearing a row
    const npcs = npcsForRow(ISLAND_NPCS[island] ?? [], row)
    const [inQuest, setInQuest] = useState<QuestPick | false>(false) // inQuest: **kana | false** -> **QuestPick | false**, mechanism: + the matching group // // inQuest: **boolean** -> **kana | false**, mechanism: holds the kana of the NPC whose quest was accepted
    const btn: CSSProperties = { padding: '8px 12px' }
    const [saved, setSaved] = useState<Saved | null>(null)
    const [done, setDone] = useState<Record<string, string[]>>({})
    // cleared tile ids per island + ver, kept here because SavedIsland
    // unmounts while the quest island shows
    useEffect(() => {
        let off = false
        loadSaved(island, island === start ? ver : undefined).then(s => { if (!off) setSaved(s) })
        return () => { off = true }
    }, [island, start, ver])
    const loaded = saved?.island === island ? saved : null
    // the saved version of the island on screen, loaded again on prev /
    // next (?ver only applies to the start island). loaded stays null until
    // this island's answer is in, since GameScene reads its bg once at mount
    // useEffect(() => {
    //     const url = inQuest ? undefined : ISLAND_BGM[island]
    //     return url ? playBgm(url) : undefined
    // }, [island, inQuest]) // music: **on** -> **commented out**, reason: BGM and quest clear / fail music turned off for now, mechanism: uncomment to bring it back
    // same island BGM as IslandScene: it loops while the island is shown and
    // stops for the quest island, like the real game leaving for a quest page.
    // Placed above the early return so the hook order never changes
    const pageTint = tint && <style>{`html, body { background-color: ${inQuest ? BUBBLE_BG : islandBg(island).color}; }`}</style>
    // with tint (full-screen /MobDev), paints the page behind the scene in the
    // current island's ground color, or the quest's cream while in a quest,
    // so Safari's strips above and below follow prev / next. Off in
    // MobileTester, where the page around the phone frame should stay as is
    if (inQuest) return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: BUBBLE_BG }}>
            {pageTint}
            {inQuest.group ? <MatchingQuestIsland key={`quest-${island}`} group={inQuest.group} timerMs={inQuest.timerMs} sensitivity={sensitivity} onLeave={() => setInQuest(false)} /> : <DodgeQuestIsland key={`quest-${island}`} kana={inQuest.kana} sensitivity={sensitivity} onLeave={() => setInQuest(false)} />} {/* scene: **dodge** -> **matching when the quest has a group**, mechanism: QuestPick.group */} {/* scene: **by islandQuestType** -> **DodgeQuestIsland**, mechanism: the demo ships island 1 only */}
            {/* <span style={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>quest island (from island {island})</span> */} {/* label: **shown** -> **commented out**, mechanism: hidden for now; uncomment to show which island the quest came from */}
        </div>
    )
    // Shuto's はい swaps in the Quest Island, Kaeru's はい swaps back to the
    // same island: the no-login stand-in for QuestScene's router.push
    const islandButtons = (
        <div style={{ position: 'absolute', bottom: 'calc(var(--safe-bottom) + 80px)', left: 16, right: 16, zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
            <button style={{ ...btn, pointerEvents: 'auto' }} disabled={island <= 1} onClick={() => setIsland(i => Math.max(1, i - 1))}>◀ prev</button>
            <span style={{ textAlign: 'center' }}>island {island}<br /><small>{!loaded ? 'loading…' : loaded.file ? `${island}_ver${loaded.ver}.json` : 'code (islands.ts)'}</small>{loaded?.error && <><br /><small style={{ color: '#c8302a' }}>load failed ({loaded.error})</small></>}</span> {/* label: **file or code** -> **+ load failed (...) in red**, mechanism: shown when loadSaved kept an error, under whichever version is playing */}
            <button style={{ ...btn, pointerEvents: 'auto' }} disabled={island >= ISLAND_COUNT} onClick={() => setIsland(i => Math.min(ISLAND_COUNT, i + 1))}>next ▶</button>
        </div>
    )
    // the island switcher, shared by the saved and code views, with which
    // version is showing under the island number
    if (!loaded) return <div style={{ position: 'relative', width: '100%', height: '100%' }}>{pageTint}{islandButtons}</div>
    if (loaded.file) return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {pageTint}
            <SavedIsland key={`${island}-${loaded.ver}`} file={loaded.file} quests={loaded.quests} tint={tint} sensitivity={sensitivity} onQuest={setInQuest}
                done={done[`${island}-${loaded.ver}`] ?? []} onClear={id => setDone(d => { const k = `${island}-${loaded.ver}`; const l = d[k] ?? []; return l.includes(id) ? d : { ...d, [k]: [...l, id] } })} /> {/* props: **+ done, onClear**, reason: cleared tiles were lost when the quest island replaced SavedIsland, mechanism: the list lives in IslandPreview, so coming back from the quest the tile is cleared and its clear animation plays */}
            {islandButtons}
        </div>
    )
    // a saved version plays like /Game's IslandScene with a layout. The kana
    // row buttons are left out: its NPCs offer the quests picked in the editor
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {pageTint}
            <GameScene key={`${island}-${row}`} tintEdges={tint} sensitivity={sensitivity} bgProps={islandBg(island)} objects={ISLAND_MAPS[island] ?? []} npcs={npcs} onQuest={i => setInQuest({ kana: npcs[i]?.kana ?? 'あ' })} /> {/* npcs: **ISLAND_NPCS[island]** -> **npcsForRow(..., row)**, mechanism: kana and quest line follow the row; key: **island** -> **island-row**, mechanism: remounts GameScene so the new NPC lines show */} {/* onQuest: **setInQuest(true)** -> **setInQuest(npc kana)**, mechanism: the training targets the kana of the NPC that asked */} {/* onQuest: **alert** -> **setInQuest(true)**, mechanism: はい renders the Quest Island in place instead of only alerting */} {/* tintEdges: **none** -> **on**, reason: Safari's status-bar strip kept its load-time color while the camera moved, mechanism: GameScene sets the page background to the ground at the screen's top edge */}
            <div style={{ position: 'absolute', bottom: 'calc(var(--safe-bottom) + 128px)', left: 16, right: 16, zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                <button style={{ ...btn, pointerEvents: 'auto' }} disabled={row <= 0} onClick={() => setRow(r => Math.max(0, r - 1))}>◀ row</button>
                <span>{`row ${KANA_ROWS[row].join('')}`}</span> {/* label: **row only** -> **quest に / で / mix on island 3**, mechanism: same buttons, they step the particle quests there */}
                <button style={{ ...btn, pointerEvents: 'auto' }} disabled={row >= KANA_ROWS.length - 1} onClick={() => setRow(r => Math.min(KANA_ROWS.length - 1, r + 1))}>row ▶</button>
            </div>
            {/* bottom: **64** -> **safe-bottom + 128px**, reason: stays one line above the island buttons, which moved up, mechanism: same 48px gap as before */}
            {/* kana row switcher, one line above the island buttons: same
                layout, steps row through KANA_ROWS */}
            {islandButtons} {/* buttons: **inline div** -> **islandButtons**, mechanism: shared with the saved view, now with the version label */}
            {/* bottom: **16** -> **safe-bottom + 80px**, reason: on iPhone Safari next ▶ sat under the floating URL bar and couldn't be tapped, mechanism: lifted clear of the bar (about 64px tall) plus the home-indicator inset (--safe-bottom, globals.css) */}
        </div>
    )
}
// island traversal without login: the same buttons /Game shows as links,
// but switching in place. key={island} remounts GameScene so the new
// bg color and spawn take effect (it reads them once at mount); islands
// without a map file get an empty field

function SavedIsland({ file, quests, tint, sensitivity, onQuest, done, onClear }: { file: IslandFile, quests: LayoutQuest[], tint: boolean, sensitivity?: number, onQuest: (q: QuestPick) => void, done: string[], onClear: (id: string) => void }) { // props: **+ done, onClear**, mechanism: see IslandPreview
    registerSprites(file.sprites)
    const npcs = layoutNpcs(file.npcs, quests)
    const tiles = file.tiles ?? []
    const pickOf = (id?: number): QuestPick => {
        const q = quests.find(x => x.id === id)
        return { kana: (typeof q?.target === 'string' && q.target) || q?.kana || 'あ', group: groupOf(q?.target), timerMs: q?.timer_ms ?? undefined }
    } // kanaOf: **kana** -> **pickOf: kana + group**, mechanism: a { group } target opens the matching quest
    const tileWalk = useTileWalk(tiles, tiles.map(t => done.includes(t.id)), t => {
        onClear(t.id)
        onQuest(pickOf(t.questId))
    }, `mobdev-${file.islandId}-${file.ver}`) // done: **own state** -> **from IslandPreview**, mechanism: survives the quest island; seenKey: **+ mobdev-<island>-<ver>**, mechanism: the clear animation plays on the way back
    const tileMode = tiles.length > 0
    const bg = fileBg(file)
    return <GameScene tintEdges={tint} sensitivity={sensitivity} {...(tileMode && tileWalk.sceneProps)} bgProps={tileMode && tileWalk.spawn ? { ...bg, ...tileWalk.spawn } : bg}
        objects={file.objects} npcs={npcs} onQuest={i => onQuest(pickOf(npcs[i]?.quest?.id))} />
}
// a saved island, built the way IslandScene builds one (fileBg, uploaded
// sprites, layoutNpcs, tile mode). With no login, はい on a tile or NPC
// opens the dodge quest island with that quest's kana (its string target,
// else kana, else あ), and a tile's はい marks it cleared (onClear, kept in
// IslandPreview) so the path to the next tile opens, with its clear
// animation, when the quest island hands back

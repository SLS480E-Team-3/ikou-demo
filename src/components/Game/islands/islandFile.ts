import type { ObjectDef, PlacedObject } from "../Object/gameObject"
import { OBJECTS } from "../Object/objects"
import { BG_COLOR, BG_H, BG_W, ISLAND_BG, ISLAND_SECTIONS, islandBg, type BGProps, type BgSection } from "../Scene/gameScene"
import { ISLAND_MAPS } from "."
import { ISLAND_NPCS } from "../npcs"

export type FileSection = {
    id: string,
    start?: number,
    end: number,
    color: string,
    separator?: number,
    solid?: boolean,
    wave?: boolean,
}
// one ground band of a saved island (docs/island-editor.spec.json F-4), top
// to bottom. start left out = 0 for the first band, else the end of the band
// above. separator = the y of the dithered border line to the band above;
// left out = start. solid / wave are the same flags as BgSection (the ocean
// blocks the player and moves), kept so a saved island 1 plays like the
// hand-written one

export type FileNpc = { id: string, npc: string, x: number, y: number, questId?: number }
// a placed NPC: npc is the dialogs/<npc>.json key (shuto, jordi, ...), x / y
// the body's center in world px, questId the quests row it offers (none =
// it only talks)

export type FileSprite = ObjectDef & { key: string }
// an uploaded sprite (F-11): a catalog entry whose src is a Supabase Storage
// url, with no hitBox (walk-through)

export type IslandFile = {
    islandId: number,
    ver: number,
    savedAt: string,
    bgColor: string,
    sections: FileSection[],
    objects: PlacedObject[],
    npcs: FileNpc[],
    sprites: FileSprite[],
}
// what /IslandEditor saves as <islandId>_ver<ver>.json in the island-editor
// bucket, and what the game loads (newest ver) in place of the islands.ts
// map. ver 0 = not saved yet (built from the code by fileFromCode)

export const ISLAND_FILE_BUCKET = 'island-editor'
export const SPRITE_BUCKET = 'sprites'
export const fileName = (islandId: number, ver: number) => `${islandId}_ver${ver}.json`
export const FILE_RE = /^(\d+)_ver(\d+)\.json$/
// bucket names and the file name rule (F-6): 1_ver1.json, 1_ver2.json, ...

export const sectionStart = (sections: FileSection[], i: number) =>
    sections[i].start ?? (i === 0 ? 0 : sections[i - 1].end)
// a band's real start: its own start, else 0 / the end of the band above

export const toBgSections = (sections: FileSection[]): BgSection[] => sections.map((s, i) => {
    const y = s.separator ?? sectionStart(sections, i)
    return { id: s.id, x: 0, y, w: BG_W, h: Math.max(0, s.end - y), color: s.color, merge: i > 0, solid: s.solid, wave: s.wave }
})
// a saved island's bands as the BgSections GameScene draws. A BgSection's y
// is where its dithered merge strip starts, so the band is drawn from its
// separator down to its end; every band but the first gets the merge
// border, the first one starts at the top of the world

export const fileBg = (file: IslandFile): BGProps => ({ ...islandBg(file.islandId), color: file.bgColor, sections: toBgSections(file.sections) })
// the BGProps GameScene takes for a saved island: the shared world size and
// spawn (islandBg), with the file's color and bands in place of the code's

export const fromBgSections = (sections: BgSection[] = []): FileSection[] => sections.map((s, i) => ({
    id: s.id,
    ...(i > 0 && sections[i - 1].y + sections[i - 1].h !== s.y ? { start: s.y } : {}),
    end: s.y + s.h,
    color: s.color,
    ...(s.solid ? { solid: true } : {}),
    ...(s.wave ? { wave: true } : {}),
}))
// the hand-written ISLAND_SECTIONS as FileSections: start is only kept where
// it is not the band above's end, and separator is left out (= start)

export const fileFromCode = (islandId: number): IslandFile => ({
    islandId,
    ver: 0,
    savedAt: '',
    bgColor: ISLAND_BG[islandId] ?? BG_COLOR,
    sections: fromBgSections(ISLAND_SECTIONS[islandId]),
    objects: ISLAND_MAPS[islandId] ?? [],
    npcs: (ISLAND_NPCS[islandId] ?? []).map((n, i) => ({ id: `${n.voice}-${i + 1}`, npc: n.voice ?? '', x: n.ent.x ?? BG_W / 2, y: n.ent.y ?? BG_H / 2 })),
    sprites: [],
})
// the island as the code has it today (islands.ts map, ISLAND_SECTIONS,
// placeNpcs spots), the starting point before the first save. NPCs get no
// questId: the code hands quests out by kana row instead

export const registerSprites = (sprites: FileSprite[] = []) => {
    for (const { key, ...def } of sprites) OBJECTS[key] = def
}
// adds uploaded sprites to the shared object catalog, so GameScene and
// objectHitBoxes resolve their def keys like any built-in object. Called
// before an island file is rendered; re-adding a key just replaces it

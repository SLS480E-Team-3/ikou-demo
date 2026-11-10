'use client'

import { createContext, useContext, useEffect, useState } from "react" // imports: **useEffect, useState** -> **+ createContext, useContext**, mechanism: DialogPanelHost hands the bubble the screen-space box its mobile panel portals into
import { createPortal } from "react-dom" // imports: **+ createPortal**, mechanism: the mobile panel renders into GameScene's screen-space host, outside the zoomed world
import { playLine, stopLine } from "./voice" // import: **speech (speakJa / stopSpeech)** -> **voice (playLine / stopLine)**, reason: lines play recorded mp3s now

export type Condition =
    | 'greeting' | 'default' | 'spoken' | 'quest' | 'questCleared' | 'retry'
    | `level${number}-${'start' | 'clear' | 'fail'}`
    | `lr-${'intro' | 'word' | 'correct' | 'wrong' | 'clear' | 'fail'}`
    | `mt-${'intro' | 'correct' | 'wrong'}` // labels: **+ mt-...**, reason: the matching quest (issue #8) has its own lines, mechanism: mt-intro is Ryuuko's talk before the run, mt-correct / mt-wrong are read by matchingTraining.ts and shown in her bubble
    | 'br-intro' // labels: **+ br-intro**, reason: the bridge quest explains its own rule, mechanism: Ryuuko's talk before the run; its verdicts reuse mt-correct / mt-wrong
    | 'ib-intro' // labels: **+ ib-intro**, reason: the in-between quest (issue #12) explains its own rule, mechanism: Ryuuko's talk before the run; its verdicts reuse mt-correct / mt-wrong
    | `tut-${'ask' | 'bye'}` | // tut types: **+ 'particle'**, mechanism: Hiroko's tutorial for island 3's particle quest
    `tut-${'original' | 'dodge' | 'shoot' | 'door' | 'particle' | 'matching' | 'inbetween' | 'bridge'}-${'touch' | 'keys'}` // tut types: **+ 'bridge'**, mechanism: Hiroko's tutorial for the bridge quest // tut types: **+ 'matching', 'inbetween'**, mechanism: Hiroko's tutorials for the こそあど matching quest (#8) and the in-between quest (#12) // labels: **+ tut-...**, reason: Hiroko's quest tutorials (docs/quest-tutorials.spec.json), mechanism: tut-ask is her first-time question, tut-bye her hand-off to Ryuuko, tut-<quest>-<touch|keys> the tutorial for one quest type and device // labels: **+ lr-...** , reason: the Left or Right quest (docs/left-or-right.spec.json) has its own lines, mechanism: lr-intro / lr-clear / lr-fail are NPC talks (sceneDialog), lr-word / lr-correct / lr-wrong are read by the quest hook and shown on its sign
// when a Dialog is said. Island NPCs use the first five (picked by
// pickDialog in npcRenderer.tsx). The Quest Island uses 'quest' (before the
// quest), 'retry' and the level labels: level1-start, level2-clear,
// level2-fail... The level is a number inside the label, so a new level
// needs no new name, and a label that isn't one of these is a type error

export type Dialog = {
    condition: Condition // condition: **closed union of five names** -> **Condition**, mechanism: the same five plus 'retry' and the level labels, see the type above // condition: **no quest** -> **+ quest**, reason: an NPC offers the island's next quest, mechanism: pickDialog plays it while a quest is open // condition: **spoken | questCleared | default** -> **+ greeting**, reason: NPC data is one Dialog[] now, mechanism: the greeting shown in range is just the entry tagged 'greeting'
    jp: string | string[], en: string | string[]
    choices?: { jp: string, en: string }[] // choices: **none** -> **choices?**, reason: a quest offer ends in はい / いいえ, mechanism: shown as buttons under the entry's last line; GameScene decides what each index does
    audio?: string | string[] // audio: **none** -> **audio?**, reason: lines play recorded mp3s, mechanism: file name (no .mp3) per jp line, index-aligned; missing = silent. NPCRenderer turns it into a URL with the NPC's voice folder
}

type DialogBubbleProps = {
    x?: number, // entity CENTER in world px, same anchor EntityRenderer / the name tag use
    y?: number,
    h: number, // h: **optional, default ENT_H** -> **required**, mechanism: EntityRenderer now renders the bubble and always has ent.h, so the ENT_H import is dropped; importing entityRenderer here would be a circular import (it imports this file), same reason gustRenderer takes plain x/y/w/h
    tapId?: number, // tapId: **none** -> **tapId?**, reason: NPCs are picked by tapping their bubble, mechanism: set as the data-npc attribute on the wrapper, which GameScene's stick overlay hit-tests by rect (the bubble itself stays pointerEvents none)
    audio?: string, // speak: **speak?: NPCVoice** -> **audio?: string**, reason: speechSynthesis replaced by recorded mp3s, mechanism: URL of the clip played when the bubble shows; left out = silent (EntityRenderer's bubbles, lines with no recording)
    choices?: Dialog['choices'], // choices: **none** -> **choices?**, mechanism: NPCRenderer passes them only on a talk's last line; drawn once that line has fully typed
    panel?: boolean, // panel: **none** -> **panel?**, reason: on phones the talk bubble was small and fit 15 characters, mechanism: true = on a phone-wide scene, draw this as the top-half panel (see DialogPanelHost) instead of the world bubble; NPCRenderer sets it for the active talk only
    dialogs: Dialog[] // text, en: **text?, en?** -> **dialog: Dialog[]**, reason: a line's Japanese and English travel together with the condition they're said under, mechanism: each Dialog's jp lines page as before and en[i] types under jp[i]; the entries play in order, so the caller picks which ones (by condition) to pass
}
// the bubble takes the entity's position, not its own, so a caller passes
// the same x/y/h it gives EntityRenderer and the bubble finds the top itself

export const BUBBLE_GAP = 25 // scope: **const** -> **export const**, reason: Ryuuko's target bubble sits at the same height above her, mechanism: named export like BUBBLE_BG
export const BUBBLE_BOARDER = 'black' // scope: **const** -> **export const**, reason: the Quest Island border and the char blocks share the bubble's style, mechanism: named export like BUBBLE_BG
const BUBBLE_TEXT = 'black'
export const BUBBLE_BG = '#fffff2' // scope: **const** -> **export const**, reason: the Quest Island is painted the bubble's color, mechanism: gameScene imports it for QUEST_BG

export const BUBBLE_BORDER_W = 2 // scope: **const** -> **export const**, mechanism: see BUBBLE_BOARDER
export const TAIL = 6 // scope: **const** -> **export const**, mechanism: the target bubble draws the same tail // tail height = half its width, so the slanted sides are 45°
export const BUBBLE_SHADOW = 'rgba(0,0,0,0.18)' // scope: **const** -> **export const**, mechanism: see BUBBLE_BOARDER
export const SEAM = 1 // scope: **const** -> **export const**, mechanism: see TAIL // SEAM: **none** -> **1**, mechanism: how far (world px) the fill triangle reaches up into the body fill, so the anti-aliased seam between them is hidden
export const TAIL_INNER = Math.round(TAIL + BUBBLE_BORDER_W - BUBBLE_BORDER_W * Math.SQRT2)
// world px. TAIL_INNER is the fill triangle: it starts BUBBLE_BORDER_W higher
// (over the body's bottom border) and a 45° side's border measured
// sideways is B·√2, so this size leaves a ~BUBBLE_BORDER_W black edge on
// both slants and a tip that thick at the bottom

export const triangle = (half: number, color: string, top: string) => ({ // scope: **const** -> **export const**, mechanism: see TAIL
    position: 'absolute' as const,
    left: '50%',
    top,
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: `${half}px solid transparent`,
    borderRight: `${half}px solid transparent`,
    borderTop: `${half}px solid ${color}`,
})
// a 0x0 box with only a colored top border draws a down-pointing triangle
// (half wide on each side, half tall); left 50% + translateX centers it

const PAGE_CHARS = 15 // characters shown at once // PAGE_CHARS: **12** -> **15**, mechanism: lines up to 15 characters now fit one page instead of spilling a few characters onto a second
const TYPE_MS = 70 // delay between typed characters
const PAGE_HOLD_MS = 1200 // how long a full page stays before the next one types
// a page is at most PAGE_CHARS characters; 15 at fontSize 8 (120px) fits inside
// BUBBLE_MAX_W 128, so a page is always one line
const BUBBLE_MAX_W = 128 // BUBBLE_MAX_W: **maxWidth 120** -> **128**, mechanism: 15 full-width characters are exactly 120px, so 8px of slack keeps sub-pixel rounding from wrapping the last one

const JA_FONT = 8
const EN_FONT = JA_FONT * 0.35
const EN_ONLY_FONT = JA_FONT * 0.6
const EN_ONLY_MAX_W = 96
// an English-only page (Hiroko's tutorial lines) has no Japanese above it, so
// its English is the main text and is drawn bigger than the 0.35 translation.
// Its bubble wraps at EN_ONLY_MAX_W instead of BUBBLE_MAX_W: English fills
// every line, and 128 x the talk zoom (3) ran past a 375 px phone screen
const EN_TYPE_MS = 30 // English runs ~2x longer than its kana, so it types faster
// the English sits under the Japanese at 0.35 of its size: small enough to
// stay secondary, readable once a talk zooms the scene in

export const CHOICE_TAP_ATTR = 'data-choice'
// like data-npc: the bubble stays pointerEvents none, so GameScene's stick
// overlay hit-tests the choice buttons (value = the choice index) by rect

const CHOICE_BG = '#ffe9a8'

export const DialogPanelHost = createContext<HTMLElement | null>(null)
// the screen-space box (GameScene's, over the whole scene) a mobile talk
// panel portals into. null outside a GameScene, so the bubble stays a bubble

const PHONE_MAX_W = 768 // css px; narrower scenes get the panel, same cut as Hiroko's touch / keys lines (tutorial.ts)
const PANEL_BASE_FONT = 24 // css px: JA_FONT x the talk zoom (8 x 3), the size the world bubble's Japanese is on screen today
export const PANEL_FONT_SCALE = 1.1 // the panel's text vs PANEL_BASE_FONT; tune here (1.1 = 10% bigger)
const PANEL_MARGIN = 12 // css px from the scene's sides and the safe area's top
const PANEL_RESERVE = 150 // css px of the half screen kept off the Japanese lines: the safe-area top (up to ~60), the English line, the choices and the tail
const LINE_H = 1.3

type PanelFit = { font: number, pageChars: number, perLine: number, lines: number }
const panelFit = (host: HTMLElement): PanelFit => {
    const font = PANEL_BASE_FONT * PANEL_FONT_SCALE
    const s = font / JA_FONT
    const innerW = host.clientWidth - 2 * PANEL_MARGIN - 2 * (6 * s + BUBBLE_BORDER_W * s)
    const perLine = Math.max(1, Math.floor(innerW / font))
    const lines = Math.max(1, Math.floor((host.clientHeight / 2 - PANEL_MARGIN - PANEL_RESERVE) / (font * LINE_H)))
    return { font, pageChars: perLine * lines, perLine, lines }
}
// how much Japanese one panel page holds: full-width kana are one font size
// wide, so a line fits the panel's inner width (scene width minus margins,
// the scaled padding and border) divided by the font; the lines are what
// fits in the top half after PANEL_RESERVE. Read from the host's size each
// render (GameScene re-renders every frame), so a rotate re-fits

const toList = (text?: string | string[]) => typeof text === 'string' ? [text] : text ?? []

type Page = { chars: string[], en: string[] }

const toPages = (dialog: Dialog[], pageChars = PAGE_CHARS): Page[] => { // args: **+ pageChars**, mechanism: the mobile panel pages by what fits its size (panelFit); the bubble keeps PAGE_CHARS // args: **(text, en)** -> **(dialog)**, mechanism: each entry's jp / en lists are paired up first, then paged the same way
    const lines = dialog.flatMap(d => { const ens = toList(d.en); return toList(d.jp).map((ja, i) => ({ ja, en: ens[i] })) })
    const pages = lines.flatMap(({ ja: line, en }) => {
        if (line === '') return en ? [{ chars: [], en: Array.from(en) }] : [] // empty jp: **skipped** -> **an English-only page when en is set**, reason: Hiroko's tutorial lines are English, mechanism: English isn't cut into PAGE_CHARS pages (it wraps), so the line rides the small en text
        const chars = Array.from(line)
        const n = Math.ceil(chars.length / pageChars) // size: **PAGE_CHARS** -> **pageChars**, mechanism: see args
        return Array.from({ length: n }, (_, i) => ({
            chars: chars.slice(i * pageChars, (i + 1) * pageChars),
            en: i === n - 1 ? Array.from(en ?? '') : [], // en: **ens[li]** -> **the line's own en**, mechanism: paired with its jp line above
        }))
    })
    return pages.length ? pages : [{ chars: Array.from('...'), en: [] }]
}
// each line is split into PAGE_CHARS chunks and the lines play in order, so
// a new line always starts on a fresh page. Array.from splits by code point,
// so a kana, kanji or emoji counts as one character, not two UTF-16 units.
// No text (undefined, '', []) becomes one '...' page, as before. A line's
// English rides on its LAST page only, so it types once the whole Japanese
// line has been read, and isn't cut into pages (it wraps instead)

// index show in front of name
export default function DialogBubble({ x, y = 0, h, dialogs, tapId, audio, choices, panel = false }: DialogBubbleProps) { // props: **+ panel**, mechanism: see panel // props: **no choices** -> **+ choices**, mechanism: see choices // props: **text, en** -> **dialog**, mechanism: see dialog
    const host = useContext(DialogPanelHost)
    const fit = panel && host && host.clientWidth > 0 && host.clientWidth < PHONE_MAX_W ? panelFit(host) : undefined
    // fit: set only for an active talk on a phone-wide scene; undefined = the
    // world bubble exactly as before
    const pages = toPages(dialogs, fit?.pageChars) // pageChars: **PAGE_CHARS** -> **fit's page size on the panel**, mechanism: see panelFit // pages: **toPages(text, en)** -> **toPages(dialog)**, mechanism: each page carries its English (only a line's last page has any)
    const textKey = pages.map(p => p.chars.join('') + '\t' + p.en.join('')).join('\n') // key: **Japanese only** -> **+ English**, mechanism: a changed translation also restarts the typing
    const [typing, setTyping] = useState({ key: textKey, page: 0, n: 0, e: 0 }) // state: **{ page, n }** -> **+ e**, mechanism: e = English characters typed on this page
    const cur = typing.key === textKey ? typing : { key: textKey, page: 0, n: 0, e: 0 }
    if (cur !== typing) setTyping(cur)
    // typing: which page and how many of its characters are shown. key is the
    // text it's typing; when the text prop changes, it resets to the first
    // page during render (React's "adjust state on prop change" pattern), so
    // EntityRenderer needs no key. A joined string is compared, not the
    // array, because a caller may pass a new array with the same lines each
    // frame (GameScene re-renders every rAF tick)

    const page = pages[Math.min(cur.page, pages.length - 1)]
    useEffect(() => {
        if (cur.n < page.chars.length) {
            const t = setTimeout(() => setTyping(s => ({ ...s, n: s.n + 1 })), TYPE_MS)
            return () => clearTimeout(t)
        }
        if (cur.e < page.en.length) { // step: **none** -> **type English**, mechanism: runs only after the page's Japanese is fully typed, so the reader sees Japanese first, then its meaning
            const t = setTimeout(() => setTyping(s => ({ ...s, e: s.e + 1 })), EN_TYPE_MS)
            return () => clearTimeout(t)
        }
        if (cur.page < pages.length - 1) {
            const t = setTimeout(() => setTyping(s => ({ ...s, page: s.page + 1, n: 0, e: 0 })), PAGE_HOLD_MS) // next page: **n: 0** -> **n: 0, e: 0**, mechanism: the hold starts after the English is done, and the next page clears both
            return () => clearTimeout(t)
        }
    }, [cur.page, cur.n, cur.e, page.chars.length, page.en.length, pages.length])
    // one timer at a time: type the next character, or after a full page
    // holds, clear and start the next page. The last page stays until the
    // bubble unmounts (player walks away), and walking back remounts it from
    // page 0. Cleanup clears the timer on unmount / text change, and per-frame
    // re-renders don't restart it since the deps stay the same

    useEffect(() => {
        if (!audio) return
        playLine(audio)
        return () => stopLine(audio)
    }, [audio]) // effect: **speakJa(jaText, speak)** -> **playLine(audio)**, reason: recorded mp3s instead of speechSynthesis, mechanism: plays once as the line starts typing; keyed on the URL string, so per-frame re-renders don't replay it, and a new line or an unmount stops it

    const s = fit ? fit.font / JA_FONT : 1
    // s: **none** -> **panel font / JA_FONT on the panel, else 1**, mechanism: every size below (fonts, padding, border, tail) is its world-bubble value x s, so the panel is the bubble drawn bigger in screen px
    const body = (
        <div
            style={{
                border: `${BUBBLE_BORDER_W * s}px solid ${BUBBLE_BOARDER}`,
                borderRadius: 0,
                background: BUBBLE_BG,
                color: BUBBLE_TEXT,
                padding: `${2 * s}px ${6 * s}px`,
                fontSize: JA_FONT * s, // fontSize: **8** -> **JA_FONT**, mechanism: EN_FONT is derived from it
                lineHeight: LINE_H,
                overflowWrap: 'anywhere',
                ...(fit
                    ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const }
                    : { width: 'max-content', maxWidth: page.chars.length ? BUBBLE_MAX_W : EN_ONLY_MAX_W }), // maxWidth: **BUBBLE_MAX_W** -> **EN_ONLY_MAX_W on an English-only page**, mechanism: see EN_ONLY_MAX_W // maxWidth: **120** -> **BUBBLE_MAX_W**, mechanism: see BUBBLE_MAX_W
                // layout: **max-content bubble** -> **a column filling the panel when fit**, mechanism: the panel's height is fixed (top half), so the text sits at the top and the choices are pushed to the bottom (marginTop auto)
            }}
        >
            <div>
                {page.chars.slice(0, cur.n).join('')}
                <span style={{ visibility: 'hidden' }}>{page.chars.slice(cur.n).join('')}</span> {/* text: **text?.map((l,i) => l[i])** -> **typed part + hidden rest of the page**, reason: show PAGE_CHARS characters at a time, typed one by one, mechanism: the untyped rest still takes up space but isn't painted, so the bubble is sized to the whole page from the first character and doesn't grow or shift the tail while typing */}
            </div> {/* wrapper: **bare text** -> **a block div**, mechanism: a block in a block lays out the same in the bubble, and in the panel's flex column it stays one item instead of each text run becoming its own */}
            {page.en.length > 0 && (
                <div style={{ fontSize: (page.chars.length ? EN_FONT : EN_ONLY_FONT) * s, lineHeight: LINE_H }}> {/* fontSize: **EN_FONT** -> **EN_ONLY_FONT on an English-only page**, reason: Hiroko's tutorial text was too small, mechanism: a page with no Japanese chars is English-only */}
                    {page.en.slice(0, cur.e).join('')}
                    <span style={{ visibility: 'hidden' }}>{page.en.slice(cur.e).join('')}</span>
                </div>
            )}
            {/* English: a block under the Japanese at EN_FONT, typed the
                same way (typed part + hidden rest), so the bubble is sized
                for both lines from the start and never grows mid-talk. It
                wraps inside the same BUBBLE_MAX_W */}
            {choices && choices.length > 0 && cur.page >= pages.length - 1 && cur.n >= page.chars.length && cur.e >= page.en.length && (
                <div style={{ display: 'flex', gap: 4 * s, justifyContent: 'center', marginTop: fit ? 'auto' : 3, paddingTop: fit ? 3 * s : 0 }}>
                    {choices.map((c, i) => (
                        <div key={i} {...{ [CHOICE_TAP_ATTR]: i }} style={{ border: `${s}px solid ${BUBBLE_BOARDER}`, background: CHOICE_BG, padding: `${s}px ${6 * s}px`, textAlign: 'center' }}>
                            {c.jp}
                            <div style={{ fontSize: EN_FONT * s }}>{c.en}</div>
                        </div>
                    ))}
                </div>
            )}
            {/* choices: one button per choice (jp over its small en),
                shown only after the last page's Japanese and English have
                fully typed, so the question is read before it can be
                answered. They're divs, not buttons: the bubble is
                pointerEvents none and GameScene picks them by their
                CHOICE_TAP_ATTR rect */}
        </div>
    )
    const tail = <>
        <div style={triangle(TAIL * s, BUBBLE_BOARDER, `calc(100% - ${TAIL * s}px)`)} />
        <div style={triangle(TAIL_INNER * s + SEAM, BUBBLE_BG, `calc(100% - ${(TAIL + BUBBLE_BORDER_W) * s + SEAM}px)`)} /> {/* fill triangle: **top at the border's top edge, size TAIL_INNER** -> **SEAM px higher and SEAM px bigger**, mechanism: its top edge used to land exactly on the body fill's bottom edge, and the anti-aliased edges of the two boxes left a thin line at the scene zoom; now it overlaps the body fill by SEAM px, so no edge meets there. At 45° a triangle SEAM higher and SEAM bigger has the same slanted sides, so the black outline of the tail doesn't change */}
    </>
    // tail: **inline** -> **shared, sized x s**, mechanism: the panel keeps the bubble's tail, pointing down at the NPC the talk camera centers below it

    if (fit && host) return createPortal(
        <div
            data-npc={tapId}
            style={{
                position: 'absolute',
                top: `calc(var(--safe-top, 0px) + ${PANEL_MARGIN}px)`,
                left: PANEL_MARGIN,
                right: PANEL_MARGIN,
                height: `calc(50% - var(--safe-top, 0px) - ${PANEL_MARGIN}px)`,
                display: 'flex',
                flexDirection: 'column',
                paddingBottom: TAIL * s,
                boxSizing: 'border-box',
                filter: `drop-shadow(${3 * s}px ${3 * s}px 0 ${BUBBLE_SHADOW})`,
                pointerEvents: 'none',
                userSelect: 'none',
            }}
        >
            {body}
            {tail}
        </div>,
        host,
    )
    // panel (phones, active talk): the same bubble body and tail, drawn in
    // screen px in GameScene's host instead of over the NPC. It spans the
    // scene's width minus PANEL_MARGIN and runs from the safe area's top to
    // the middle of the screen (absolute, never fixed, so Safari's bar tint
    // isn't frozen; docs/home-screen-app.md). data-npc stays on it, so a tap
    // anywhere on the panel advances the talk, and the choices keep
    // CHOICE_TAP_ATTR; GameScene finds both by rect inside its own div,
    // where the portal's host lives

    return (
        <div
            data-npc={tapId} // attr: **none** -> **data-npc={tapId}**, mechanism: React drops an undefined attribute, so only tappable bubbles get it
            style={{
                position: 'absolute',
                left: x,
                top: y - h / 2 - BUBBLE_GAP,
                transform: 'translate(-50%, -100%)',
                paddingBottom: TAIL,
                filter: `drop-shadow(3px 3px 0 ${BUBBLE_SHADOW})`,
                pointerEvents: 'none',
                userSelect: 'none',
                zIndex: 2,
            }}
        >
            {body}
            {tail}
        </div>
    )
}
// wrapper: its top is the entity's top minus BUBBLE_GAP, and translate
// (-50%, -100%) lifts it so its BOTTOM (the tail tip) sits there, centered
// on x, clearing the name tag. paddingBottom reserves the tail's room inside
// the wrapper. drop-shadow (no blur) follows the painted pixels, so the
// square body and the triangle share one flat bottom-right shadow like the
// reference. Rendered as a sibling of the body, so the lean skew doesn't
// reach it; zIndex 2 keeps it above the name tag (1)
// body: square border (radius 0), max-content width that wraps at BUBBLE_MAX_W;
// overflowWrap anywhere lets long romaji/kana without spaces break too
// tail: the black triangle hangs flush under the body; the fill triangle
// sits BUBBLE_BORDER_W higher, painting over the bottom border where they
// meet, so the outline opens into the tail instead of cutting across it

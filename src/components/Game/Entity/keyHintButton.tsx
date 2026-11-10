'use client'

import { CSSProperties } from "react"
import styles from "./keyHintButton.module.css"

export type KeyHintProps = {
    keys: string[], // keycaps shown left to right, e.g. ['Space'] or ['W', 'A', 'S', 'D']
    label?: string, // small text after the keys, e.g. 'next'
    style?: CSSProperties, // placement from the caller (position / left / top / transform)
}

const STAGGER_S = 0.15 // seconds between neighbouring keys' presses

export default function KeyHintButton({ keys, label, style }: KeyHintProps) {
    return (
        <div className={styles.hint} style={style} aria-hidden>
            <div className={styles.keys}>
                {keys.map((k, i) => (
                    <span key={k} className={styles.key} style={{ animationDelay: `${i * STAGGER_S}s` }}>{k}</span>
                ))}
            </div>
            {label && <span className={styles.label}>{label}</span>}
        </div>
    )
}
// a small dialog-bubble-style note showing which key(s) to press. Each key
// loops a press-and-release (keyHintButton.module.css @keyframes press); with
// several keys (WASD) each starts STAGGER_S later, so they press in turn like
// a finger walking over them instead of all at once. No state or effects:
// the loop is pure CSS, so the scene's per-frame re-renders don't restart it.
// prefers-reduced-motion shows the keys still, and touch devices hide the
// whole hint (no keyboard there; bubbles are tapped). The caller places it:
// it is a plain block, so DialogBubble pins it to its own corner and a quest
// can position it absolutely anywhere in its world. aria-hidden because it
// repeats what the controls already do and would be noise to a screen reader

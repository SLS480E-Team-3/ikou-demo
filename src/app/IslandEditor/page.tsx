// DEV
'use client'

import dynamic from "next/dynamic"

const IslandEditor = dynamic(() => import("@/components/IslandEditor/islandEditor"), { ssr: false })

export default function IslandEditorPage() {
    return <IslandEditor />
}
// /IslandEditor: browser-only (ssr: false), since the editor is all
// pointer / keyboard state and fetches. Not in the proxy matcher, so it
// opens without login like /Dev (spec D-15)

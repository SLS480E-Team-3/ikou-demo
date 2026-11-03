// DEV
'use client'

import { useEffect, useState } from "react"
import GameScene from "@/components/Game/Scene/gameScene"

export default function Test() {
    const [info, setInfo] = useState('')
    useEffect(() => {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:absolute;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)'
        document.body.appendChild(probe)
        const cs = getComputedStyle(probe)
        setInfo([
            `standalone: ${(navigator as { standalone?: boolean }).standalone} / ${matchMedia('(display-mode: standalone)').matches}`,
            `safe top/bottom: ${cs.paddingTop} / ${cs.paddingBottom}`,
            `inner: ${innerWidth}x${innerHeight}  screen: ${screen.width}x${screen.height}`,
        ].join('\n'))
        probe.remove()
    }, [])
    return (
        <>
            <style>{`html, body { background-color: magenta; }`}</style>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100lvh' }}>
                <GameScene />
            </div>
            <pre style={{ position: 'absolute', top: 'calc(var(--safe-top) + 8px)', left: 8, margin: 0, fontSize: 12, background: 'white', zIndex: 10 }}>{info}</pre>
        </>
    )
}
// /test (issue #13): GameScene alone, with its default lightgreen field and
// no props, so no MobDev ScreenHost, Tint, quest shell, tintEdges, border
// or overlays sit around it. The wrapper is the same absolute 100lvh box
// ScreenHost and QuestScene use, so the scene gets the same size it does
// there. The page background is magenta on purpose: any strip at the top
// or bottom of the phone that is magenta is the page showing past the
// scene; lightgreen is the scene; any other color (the manifest's
// #a9cf7a theme color, black) is drawn by iOS, not by the page.
// The <pre> readout: standalone (navigator.standalone / display-mode) says
// whether this runs as the Home Screen app; safe top/bottom are the
// env(safe-area-inset-*) values measured on a hidden probe, which are 0px
// when iOS does not let the page draw under the status bar; inner vs screen
// size shows how much of the screen the page actually gets

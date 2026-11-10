'use client'

import { UserProps } from "@/utils/schema"
import EntityRenderer, { EntityProps, NAME_GAP, NAME_SIZE } from "./entityRenderer" // import: **+ NAME_GAP, NAME_SIZE**, mechanism: the name tag under the body matches the one above

export type PlayerProps = {
    hatPoint?: { x: number, y: number }
    ent?: EntityProps
    name?: UserProps['name']
    island?: UserProps['island'],
    color?: UserProps['color'],

    talking?: boolean // talking is by defalut false
    label?: string // label: **none** -> **label?**, reason: the name moved under the body, mechanism: a quest's counter (GameScene's playerLabel) still shows above the body in the old name-tag spot
}

export default function PlayerRenderer({ velocity, maxSpeed, player }: { velocity: { x: number, y: number }, maxSpeed?: number, player: PlayerProps }) { // props: **no maxSpeed** -> **maxSpeed?**, reason: EntityRenderer's lean scales by it, mechanism: passed straight through below; optional so EntityRenderer's default applies when unset
    return (
        <div
            style={{
                position: 'inherit'
            }}
        >
            <EntityRenderer 
            style={{ transition: 'opacity 0.55s ease-in-out', opacity: player.talking ? 0 : 1 }} // style: **!talking ? { transform: 'ease-in, ease-out', opacity: 0 } : ''** -> **transition opacity 0.25s, talking ? 0 : 1**, mechanism: the transition is always set, so the browser eases 1 -> 0 when a talk starts and 0 -> 1 when it ends
            velocity={velocity} maxSpeed={maxSpeed} ent={player.ent && { ...player.ent, name: player.label }} /> {/* ent.name: **player.name ?? ent.name** -> **player.label**, reason: T5 wanted the player's name under the character, mechanism: the tag above now only carries a quest's counter; the name is drawn below */}
            {player.ent && (player.name ?? player.ent.name) && (
                <div
                    style={{
                        position: 'absolute',
                        left: player.ent.x,
                        top: (player.ent.y ?? 0) + player.ent.h / 2 + NAME_GAP,
                        transform: 'translateX(-50%)',
                        fontSize: NAME_SIZE,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 1,
                        transition: 'opacity 0.55s ease-in-out',
                        opacity: player.talking ? 0 : 1,
                    }}
                >
                    {player.name ?? player.ent.name}
                </div>
            )}
            {/* name under the body: the same tag EntityRenderer draws above,
                anchored NAME_GAP below the body's bottom edge (center y +
                h / 2) and centered by translateX(-50%). player.name (the
                username) wins over ent.name. It fades out with the body
                during a talk, using the same transition */} {/* ent: **player.ent + a name tag div here** -> **player.name copied into ent.name**, mechanism: EntityRenderer draws the tag from ent.name now; player.name (from the db user) wins, ent.name is the fallback. A fresh object each render is fine: GameScene mutates player.ent in place and the copy reads its current x/y */} {/* props: **velocity, ent** -> **+ maxSpeed**, reason: lean follows the stick, mechanism: pass-through from GameScene's PLAYER_SPEED */}
        </div>
    )
}
'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import QuestComplete from "../questComplete"
import { MatchingQuestIsland } from "./matchingQuestIsland" // imports: **+ MatchingQuestIsland**, mechanism: a quest with quest_type matching runs it
import type { KosoadoGroup } from "../kosoado"
import { DodgeQuestIsland } from "./dodgeQuestIsland" // imports: **QuestIsland only** -> **+ DodgeQuestIsland**, mechanism: island 2's NPCs open the dodge quest
import type { QuestKind } from "./tutorial"

export type QuestSceneProps = {
    islandId: number
    quest: { id: number, title: string, reward_points: number, kana: string | null } // quest: **no kana** -> **+ kana**, mechanism: handed to QuestIsland as the training target
    cleared: boolean
    tutorialSeen: boolean
    // whether Hiroko already asked this player about this quest type's
    // tutorial (a user_tutorials row for questType)
    questType: QuestKind // type: **QuestType** -> **QuestKind**, mechanism: + 'matching'
    group?: KosoadoGroup
    // a matching quest's こそあど group (its target { group })
    timerMs?: number
    // the pick timer in ms (quests.timer_ms); left out = the quest's default
    // which quest island to run (islandQuestType): 'dodge' = DodgeQuestIsland,
    // 'door' = LeftRightQuestIsland, 'particle' = ParticleQuestIsland (kana
    // = に / で / mix), anything else = QuestIsland's catch quest
}
// what the quest page loaded: the quest itself and whether this player
// already cleared it. The page (server) checks access and records the
// start/resume; the scene (client) only renders

export default function QuestScene({ islandId, quest, cleared, tutorialSeen, questType, group, timerMs }: QuestSceneProps) { // params: **+ timerMs**, mechanism: handed to MatchingQuestIsland // params: **+ group**, mechanism: handed to MatchingQuestIsland // params: **no questType** -> **+ questType**, mechanism: picks the island component and the tutorial type below // params: **no tutorialSeen** -> **+ tutorialSeen**, mechanism: passed on to QuestIsland as tutorial.seen
    const router = useRouter()
    const Island = DodgeQuestIsland // Island: **dodge / door / particle / catch by questType** -> **DodgeQuestIsland**, mechanism: the demo ships island 1 only
    // all take onLeave, tutorial and children (the success slot); kana is
    // passed only to the two kana quests, since the door quest teaches verbs
    const kana = { kana: quest.kana ?? undefined }
    const tutorial = {
        seen: tutorialSeen,
        onSeen: () => { fetch('/api/Tutorial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: questType }) }).catch(() => {}) },
    } // tutorial: **inline on the dodge Island** -> **one object**, mechanism: the matching quest gets the same seen / onSeen
    const complete = !cleared && <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}><QuestComplete quest={quest.id} points={quest.reward_points} /></div>
    if (questType === 'matching') return (
        <div style={{ position: 'relative', width: '100%', height: '100lvh' }}>
            <MatchingQuestIsland group={group} timerMs={timerMs} onLeave={() => router.push(`/Game/${islandId}`)} tutorial={tutorial}>{complete}</MatchingQuestIsland> {/* props: **no tutorial** -> **tutorial**, mechanism: Hiroko's matching tutorial, saved like the dodge one */}
            <div style={{ position: 'absolute', top: 'calc(var(--safe-top) + 16px)', left: 16, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href={`/Game/${islandId}`}>{'<-'}</Link>
                {cleared && <div style={{ fontSize: '0.75rem' }}>cleared!</div>}
            </div>
        </div>
    )
    // matching: **dodge for every quest** -> **MatchingQuestIsland for quest_type matching**, reason: the こそあど quests (issue #8), mechanism: same back arrow and COMPLETE slot as the dodge quest below; tutorial: **none** -> **the shared seen / onSeen**, mechanism: Hiroko teaches the matching quest
    return (
        <div style={{ position: 'relative', width: '100%', height: '100lvh' }}> {/* wrapper: **BUBBLE_BG** -> **no bg**, mechanism: QuestIsland fills this box with the bubble color itself and measures it for the 2x island */}
            <Island
                onLeave={() => router.push(`/Game/${islandId}`)}
                {...kana} // kana: **always** -> **kana quests only**, mechanism: LeftRightQuestIsland has no kana prop
                tutorial={tutorial}
            > {/* props: **no kana** -> **kana**, mechanism: a quest without a kana trains あ; props: **no tutorial** -> **tutorial**, mechanism: onSeen records the answer in user_tutorials via /api/Tutorial, fire-and-forget so a failed save never blocks the run (she just asks again next time) */}
                {!cleared && <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}><QuestComplete quest={quest.id} points={quest.reward_points} /></div>}
            </Island> {/* scene: **<QuestIsland>** -> **<Island>**, mechanism: DodgeQuestIsland on island 2, QuestIsland elsewhere; onSeen type: **'original'** -> **questType**, mechanism: the dodge tutorial is saved as its own user_tutorials row */}
            {/* scene: **<GameScene QUEST_BG> + onQuest** -> **<QuestIsland> + onLeave**, mechanism: Elena's はい on the fail screen goes back to the island; the children are the success slot, so COMPLETE shows only after both levels are cleared */}
            <div style={{ position: 'absolute', top: 'calc(var(--safe-top) + 16px)', left: 16, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}> {/* top: **16** -> **safe-top + 16px**, reason: the Home Screen web app draws under a see-through status bar, mechanism: --safe-top (globals.css) is the clock / Dynamic Island inset there, 0 on desktop */} {/* overlay: **absolute top-left** -> unchanged; placeholder text removed, mechanism: the training is the content now */}
                <Link href={`/Game/${islandId}`}>{'<-'}</Link>
                {/* <div>{quest.title}</div> */}
                {cleared && <div style={{ fontSize: '0.75rem' }}>cleared!</div>}
            </div>
        </div>
    )
    // the back arrow is "pause": nothing to save beyond the updated_at the
    // page already wrote, so it's a plain link to the island, where this
    // quest now shows "(resume)". The training can be replayed on a cleared
    // quest, but COMPLETE only shows when it isn't cleared, so no double claim
}

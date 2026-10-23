// DEV
import type { QuestKind } from "@/components/Game/Scene/tutorial"
import type { KosoadoGroup } from "@/components/Game/kosoado"

export type DoorTarget = { answer: string[], decoys: string[] }
export type MatchingTarget = { group: KosoadoGroup }
export type QuestTarget = string | DoorTarget | MatchingTarget // target: **+ MatchingTarget**, mechanism: a matching quest stores its こそあど group
// what a quest tests (spec F-3): a kana for dodge (あ), answer + decoy words
// for door, a こそあど group for matching

export type EditorQuest = {
    id?: number,
    island_id: number,
    title: string,
    reward_points?: number,
    kana?: string | null,
    level?: string | null,
    quest_type?: QuestKind | null,
    target?: QuestTarget | null,
}
// one quests row as the editor reads and writes it (snake_case = the db
// columns). id left out = not created yet

export const QUEST_TYPES: QuestKind[] = ['dodge', 'matching', 'door', 'original', 'shoot', 'particle'] // types: **+ matching**, mechanism: the こそあど quest (issue #8) runs in the demo
export const LEVELS = ['vocab', 'koSoADo', 'meaning'] // levels: **+ koSoADo**, mechanism: issue #7's level for the matching quests
// the choices offered in the quest form. Only dodge and matching run in this demo; the
// others are kept so a quest can already be set up for them

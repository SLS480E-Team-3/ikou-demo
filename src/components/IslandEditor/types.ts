// DEV
import type { QuestType } from "@/components/Game/Scene/tutorial"

export type DoorTarget = { answer: string[], decoys: string[] }
export type QuestTarget = string | DoorTarget
// what a quest tests (spec F-3): a kana for dodge (あ), answer + decoy words
// for door

export type EditorQuest = {
    id?: number,
    island_id: number,
    title: string,
    reward_points?: number,
    kana?: string | null,
    level?: string | null,
    quest_type?: QuestType | null,
    target?: QuestTarget | null,
}
// one quests row as the editor reads and writes it (snake_case = the db
// columns). id left out = not created yet

export const QUEST_TYPES: QuestType[] = ['dodge', 'door', 'original', 'shoot', 'particle']
export const LEVELS = ['vocab', 'meaning']
// the choices offered in the quest form. Only dodge runs in this demo; the
// others are kept so a quest can already be set up for them

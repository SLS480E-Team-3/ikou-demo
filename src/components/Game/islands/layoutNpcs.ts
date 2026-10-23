import type { NPCProps } from "../Entity/npcRenderer"
import { NPC_SCRIPTS, withQuestLine } from "../npcs/npcs"
import { toNPCProps } from "../npcs/toNPCProps"
import type { FileNpc } from "./islandFile"

export type LayoutQuest = { id: number, title: string, kana: string | null, target?: unknown, status?: 'done' | 'resume' }

export const layoutNpcs = (npcs: FileNpc[], quests: LayoutQuest[]): NPCProps[] => npcs.flatMap((n): NPCProps[] => {
    const script = NPC_SCRIPTS[n.npc]
    if (!script) return []
    const base = toNPCProps(script, n.x, n.y)
    const quest = quests.find(q => q.id === n.questId)
    if (!quest) return [{ ...base, kana: undefined, dialog: base.dialog?.filter(d => d.condition !== 'quest') }]
    const label = typeof quest.target === 'string' && quest.target ? quest.target : quest.kana ?? quest.title
    return [{ ...withQuestLine(base, label), quest }]
})
// the NPCs of a saved island (FileNpc) as the NPCProps GameScene draws: the
// npc's dialog file at the saved spot, and the quest picked in the editor
// attached directly by id (no kana-row matching). Its offer line names the
// quest's kana target (「あ」のクエストだ！), or the kana / title when the
// target is not one kana. An NPC without a quest loses its 'quest' entry
// and just talks; an unknown npc key is skipped

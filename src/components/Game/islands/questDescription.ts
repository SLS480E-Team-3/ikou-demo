export type DescribedQuest = { quest_type?: string | null, target?: unknown, kana?: string | null }

export const questDescription = (q?: DescribedQuest): string | undefined => {
    if (!q) return undefined
    const k = (typeof q.target === 'string' && q.target) || q.kana || undefined
    const kana = k ? `「${k}」` : 'the target kana'
    switch (q.quest_type ?? 'dodge') {
        case 'dodge':
        case 'original': return `Catch the ${kana} blocks and dodge the rest. Learn to read ${kana}.`
        case 'shoot': return `Catch ${kana} blocks to get bullets, then shoot Ryuuko. Learn to read ${kana}.`
        case 'door': return 'Read a Japanese verb and walk through the door with its English meaning.'
        case 'particle': return 'Catch the particle that fills the blank in a Japanese sentence.'
        case 'matching': return 'Stand on the English meaning of Ryuuko\'s こそあど word (this / that / which).'
        case 'inbetween': return 'Stand in the gap where your こそあど word fits the sentence.'
        case 'bridge': return 'Draw a bridge to the English meaning of Ryuuko\'s こそあど word.'
        default: return undefined
    }
}
// one plain-English sentence per quest type: what the player does and what
// Japanese it teaches (user testing: beginners couldn't tell what a quest
// was teaching). Shown in the tile's start bubble (useTileWalk). The kana
// quests name their kana (the editor's string target, else the kana column);
// a quest with no type is a dodge quest, the same default islandPreview
// opens. Wording follows Hiroko's tutorials (npcs/dialogs/hiroko_en.json),
// cut to one sentence; an unknown type gets no description

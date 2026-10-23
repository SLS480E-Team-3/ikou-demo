export const KOSOADO_GROUPS = ['pronoun', 'adnominal', 'adverb', 'naAdjective'] as const
export type KosoadoGroup = typeof KOSOADO_GROUPS[number]
// the four こそあど quest groups (issue #8), one matching quest each; the
// key is what a matching quest stores as its target ({ group })

export type KosoadoWord = { word: string, romaji: string, en: string }

export const KOSOADO: Record<KosoadoGroup, { name: string, words: KosoadoWord[] }> = {
    pronoun: {
        name: 'demonstrative pronouns',
        words: [
            { word: 'これ', romaji: 'kore', en: 'this (one)' },
            { word: 'それ', romaji: 'sore', en: 'that (by you)' },
            { word: 'あれ', romaji: 'are', en: 'that (over there)' },
            { word: 'どれ', romaji: 'dore', en: 'which (one)' },
        ],
    },
    adnominal: {
        name: 'pre-noun adjectivals',
        words: [
            { word: 'この', romaji: 'kono', en: 'this ~' },
            { word: 'その', romaji: 'sono', en: 'that ~ (by you)' },
            { word: 'あの', romaji: 'ano', en: 'that ~ (over there)' },
            { word: 'どの', romaji: 'dono', en: 'which ~' },
        ],
    },
    adverb: {
        name: 'adverbs',
        words: [
            { word: 'こう', romaji: 'kou', en: 'like this' },
            { word: 'そう', romaji: 'sou', en: 'like that (by you)' },
            { word: 'ああ', romaji: 'aa', en: 'like that (over there)' },
            { word: 'どう', romaji: 'dou', en: 'how' },
        ],
    },
    naAdjective: {
        name: 'adjectival nouns',
        words: [
            { word: 'こんな', romaji: 'konna', en: 'this kind of' },
            { word: 'そんな', romaji: 'sonna', en: 'that kind of (by you)' },
            { word: 'あんな', romaji: 'anna', en: 'that kind of (over there)' },
            { word: 'どんな', romaji: 'donna', en: 'what kind of' },
        ],
    },
}
// each group's words in quest order (こ, そ, あ, ど) with the English shown
// on the areas. そ / あ say "by you" / "over there" so the two "that"s can
// be told apart; the other three words of the group are the decoy pool

export const isKosoadoGroup = (v: unknown): v is KosoadoGroup => typeof v === 'string' && (KOSOADO_GROUPS as readonly string[]).includes(v)
export const groupOf = (target: unknown): KosoadoGroup | undefined => {
    const g = target && typeof target === 'object' ? (target as { group?: unknown }).group : undefined
    return isKosoadoGroup(g) ? g : undefined
}
// a quests row's target -> its group, if it is a matching target ({ group });
// anything else (a kana string, door's { answer, decoys }) gives undefined

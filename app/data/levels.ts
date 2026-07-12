// 牛津自然拼读 Level 1-5 分级手牌配置
// 选择模式：累加（Book 1 / 1+2 / 1+2+3 / 1+2+3+4 / 1+2+3+4+5）

import type { HandItem } from '../types'

export type LevelRange = 1 | 2 | 3 | 4 | 5

// ── Level 1: The Alphabet ─────────────────────────────────────────
const L1_LETTERS: HandItem[] = [
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
].map((v, i) => ({ id: `l1-${v}-${i}`, type: 'letter', value: v }))

// ── Level 2: Short Vowels ──────────────────────────────────────────
const L2_CONSONANTS: HandItem[] = [
  'b','c','d','f','h','j','l','m','n','p','r','s','t','w','z',
].map((v, i) => ({ id: `l2-c-${v}-${i}`, type: 'letter', value: v }))

const L2_RIMES: HandItem[] = [
  '-am','-an','-at','-ad','-ag','-ap',
  '-ed','-eg','-en','-et',
  '-ig','-in','-ip','-it',
  '-og','-op','-ot','-ox',
  '-ub','-ug','-up','-ut',
].map((v, i) => ({ id: `l2-r-${i}`, type: 'rime', value: v }))

// ── Level 3: Long Vowels / Magic E ───────────────────────────────
// Magic E (a_e etc.) 无 '-' 前缀（未来魔法熔炉专用）
// 元音字母组合 (-ee/-ea/-ay/-ow/-igh) 有 '-' 前缀（可直接二合成词）
const L3_VOWEL_BLOCKS: HandItem[] = [
  'a_e','i_e','o_e','u_e',
  '-ee','-ea','-ai','-ay','-oa','-ow','-igh',
].map((v, i) => ({ id: `l3-v-${i}`, type: 'rime', value: v }))

const L3_CONSONANTS: HandItem[] = [
  'b','c','d','f','g','h','k','l','m','n','p','r','s','t','w',
].map((v, i) => ({ id: `l3-c-${v}-${i}`, type: 'letter', value: v }))

// ── Level 4: Consonant Blends / Digraphs ─────────────────────────
const L4_BLENDS: HandItem[] = [
  'sh','ch','th','wh','ph',
  'bl','cl','fl','gl','pl',
  'br','cr','fr','gr','tr',
  'sm','sn','sp','st','sw',
  'ck','ng','nk',
].map((v, i) => ({ id: `l4-b-${i}`, type: 'letter', value: v }))

// ── Level 5: R-Controlled + Diphthongs ───────────────────────────
const L5_ADVANCED: HandItem[] = [
  '-ar','-er','-ir','-or','-ur',
  '-oy','-oi',
  '-oo','-aw',
].map((v, i) => ({ id: `l5-a-${i}`, type: 'rime', value: v }))

// ── 保底合成对：确保每次发牌至少有一个可以合成的词 ──────────────
// [字母值, 词根值]，词根必须以 '-' 开头
const SEED_PAIRS: Partial<Record<LevelRange, Array<[string, string]>>> = {
  2: [['c','-at'],['h','-en'],['p','-ig'],['b','-ug'],['f','-an'],['d','-og'],['j','-et'],['r','-at'],['m','-op'],['b','-ig']],
  3: [['b','-ee'],['t','-ea'],['s','-ay'],['b','-ow'],['h','-igh'],['p','-ay'],['d','-ay'],['l','-ow'],['s','-ea']],
  4: [['sh','-op'],['ch','-ip'],['cl','-am'],['fl','-ip'],['st','-op'],['sn','-ap'],['tr','-ip'],['ch','-at'],['sp','-ot']],
  5: [['c','-ar'],['j','-ar'],['b','-oy'],['j','-oy'],['t','-oy'],['m','-oo'],['p','-aw'],['f','-ur'],['b','-ar']],
}

function findGuaranteedPair(pool: HandItem[], level: LevelRange): [HandItem, HandItem] | null {
  const candidates = shuffle(SEED_PAIRS[level] ?? [])
  for (const [lv, rv] of candidates) {
    const letter = pool.find(h => h.type === 'letter' && h.value === lv)
    const rime   = pool.find(h => h.type === 'rime'   && h.value === rv)
    if (letter && rime) return [letter, rime]
  }
  return null
}

// ── 根据选择的最高 Level 返回累加手牌池 ───────────────────────────
export function getHandPool(maxLevel: LevelRange): HandItem[] {
  const pool: HandItem[] = []
  if (maxLevel >= 1) pool.push(...L1_LETTERS)
  if (maxLevel >= 2) pool.push(...L2_CONSONANTS, ...L2_RIMES)
  if (maxLevel >= 3) pool.push(...L3_CONSONANTS, ...L3_VOWEL_BLOCKS)
  if (maxLevel >= 4) pool.push(...L4_BLENDS)
  if (maxLevel >= 5) pool.push(...L5_ADVANCED)
  return pool
}

// ── 合成英雄后补充手牌（Level 2+ 保证至少 1 张词根）─────────────
export function refillTiles(maxLevel: LevelRange, count = 2): HandItem[] {
  const pool = getHandPool(maxLevel)
  const ts = Date.now()
  if (maxLevel === 1 || count <= 1) {
    return shuffle(pool).slice(0, count).map((h, i) => ({ ...h, id: `rf-${i}-${ts}` }))
  }
  // 优先给可合成的词根（从 L2 rimes 中随机取一个）
  const synRimes = pool.filter(h => h.type === 'rime' && h.value.startsWith('-'))
  const rime   = shuffle(synRimes)[0] ?? shuffle(pool.filter(h => h.type === 'rime'))[0]
  const others = shuffle(pool.filter(h => h !== rime)).slice(0, count - 1)
  return [rime, ...others].map((h, i) => ({ ...h, id: `rf-${i}-${ts}` }))
}

// ── 起始发牌：Level 2+ 保证至少有一对可合成的 ──────────────────
export function dealHand(maxLevel: LevelRange, count = 11): HandItem[] {
  const pool = getHandPool(maxLevel)
  const ts   = Date.now()

  if (maxLevel === 1) {
    const letters = pool.filter(h => h.type === 'letter')
    return shuffle(letters).slice(0, count).map((h, i) => ({ ...h, id: `hand-${i}-${ts}` }))
  }

  // 先锁定一个保底合成对
  const pair = findGuaranteedPair(pool, maxLevel)
  const guaranteed = pair ? [pair[0], pair[1]] : []

  // 剩余池中再补 2 个词根 + 若干字母填满
  const rest     = pool.filter(h => !guaranteed.includes(h))
  const extraR   = shuffle(rest.filter(h => h.type === 'rime' && h.value.startsWith('-'))).slice(0, 2)
  const extraL   = shuffle(rest.filter(h => h.type === 'letter')).slice(0, Math.max(0, count - guaranteed.length - extraR.length))

  return shuffle([...guaranteed, ...extraR, ...extraL]).map((h, i) => ({ ...h, id: `hand-${i}-${ts}` }))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Level 元信息 ─────────────────────────────────────────────────
export const LEVEL_INFO: Record<LevelRange, { label: string; emoji: string; desc: string; color: string }> = {
  1: { label: 'Book 1',     emoji: '📗', desc: '26字母 · 字母发音',           color: 'bg-emerald-500' },
  2: { label: '1 + 2',     emoji: '📘', desc: '+ 短元音 CVC · -at/-ig/-en…', color: 'bg-blue-500'    },
  3: { label: '1 + 2 + 3', emoji: '📙', desc: '+ 长元音 · Magic E · a_e',    color: 'bg-orange-500'  },
  4: { label: '1–4',       emoji: '📒', desc: '+ 辅音连读 sh/ch/bl/cr…',     color: 'bg-yellow-500'  },
  5: { label: '1–5',       emoji: '📕', desc: '+ 控制元音 ar/er/or·双元音',   color: 'bg-red-500'     },
}

// 功勋系统 — 8枚徽章，进度存入 localStorage
export type AchievementId =
  | 'first_hero' | 'star2' | 'star3'
  | 'wave3' | 'wave5' | 'wave10'
  | 'hero20' | 'level5'

export interface Achievement {
  id: AchievementId
  emoji: string
  name: string
  desc: string
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_hero', emoji: '🌱', name: '初次合成',   desc: '合成第一个英雄单词' },
  { id: 'star2',      emoji: '⭐', name: '升级达人',   desc: '将英雄升至 ★★' },
  { id: 'star3',      emoji: '🌟', name: '三星强者',   desc: '将英雄升至 ★★★' },
  { id: 'wave3',      emoji: '🛡️', name: '坚守基地',   desc: '通过第 3 波敌人' },
  { id: 'wave5',      emoji: '⚔️', name: '精英卫士',   desc: '通过第 5 波敌人' },
  { id: 'wave10',     emoji: '🏆', name: '传奇守护者', desc: '通过第 10 波敌人' },
  { id: 'hero20',     emoji: '🎓', name: '拼读学者',   desc: '累计合成 20 个英雄' },
  { id: 'level5',     emoji: '🔮', name: '拼读大师',   desc: '开启 Level 5 全词库' },
]

const KEY = 'phonics_ach'

interface AchState {
  unlocked: AchievementId[]
  heroCount: number
}

function load(): AchState {
  try {
    return { unlocked: [], heroCount: 0, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch { return { unlocked: [], heroCount: 0 } }
}

function save(s: AchState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
}

function tryUnlock(s: AchState, id: AchievementId): Achievement | null {
  if (s.unlocked.includes(id)) return null
  s.unlocked = [...s.unlocked, id]
  return ACHIEVEMENTS.find(a => a.id === id) ?? null
}

// 合成英雄时调用，返回本次新解锁的徽章
export function trackHeroSynthesized(tier = 1): Achievement[] {
  const s = load()
  s.heroCount++
  const gained: Achievement[] = []
  const u = (id: AchievementId) => { const a = tryUnlock(s, id); if (a) gained.push(a) }
  u('first_hero')
  if (tier >= 2) u('star2')
  if (tier >= 3) u('star3')
  if (s.heroCount >= 20) u('hero20')
  save(s)
  return gained
}

// 每波结束时调用（wave 从 1 开始）
export function trackWaveComplete(wave: number): Achievement[] {
  const s = load()
  const gained: Achievement[] = []
  const u = (id: AchievementId) => { const a = tryUnlock(s, id); if (a) gained.push(a) }
  if (wave >= 3)  u('wave3')
  if (wave >= 5)  u('wave5')
  if (wave >= 10) u('wave10')
  save(s)
  return gained
}

// 开启 Level 5 时调用
export function trackLevel5(): Achievement[] {
  const s = load()
  const gained: Achievement[] = []
  const u = (id: AchievementId) => { const a = tryUnlock(s, id); if (a) gained.push(a) }
  u('level5')
  save(s)
  return gained
}

// 读取当前状态（用于徽章展示页）
export function getAchState(): { unlocked: AchievementId[]; heroCount: number } {
  return load()
}

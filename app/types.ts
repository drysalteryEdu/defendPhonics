export type CellContentType = 'empty' | 'letter' | 'rime' | 'hero'

export interface Cell {
  id: string
  type: CellContentType
  value: string
  emoji?: string
  tier?: number  // 1 (default) | 2 (★★) | 3 (★★★) — hero upgrade tier
}

export interface HandItem {
  id: string
  type: 'letter' | 'rime'
  value: string
}

// ── 塔防实体 ──────────────────────────────────────────────────────

export interface Enemy {
  id: string
  row: number    // 0 | 1 | 2
  x: number      // 0-100 百分比坐标，0=基地，100=右侧敌人入口
  hp: number
  maxHp: number
  speed: number  // 每 tick 移动量（%）
}

export interface Bullet {
  id: string
  row: number
  x: number      // 0-100，子弹向右（+）移动
  damage: number
}

export interface GameLoopState {
  enemies: Enemy[]
  bullets: Bullet[]
  baseHp: number
  wave: number
  heroTick: number    // 用于控制英雄开火节奏
  spawnTick: number   // 用于控制敌人生成节奏
  phase: 'idle' | 'playing' | 'paused' | 'shop' | 'over'
  rapidFireTicks: number  // 速射道具倒计时（>0 时射速×2）
  shieldHp: number        // 护盾值（先于 baseHp 吸收伤害）
  slowTicks: number       // 冰冻道具倒计时（>0 时敌人速度×0.6）
}

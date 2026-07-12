'use client'
import { useRef, useCallback } from 'react'
import type { Cell, Enemy, Bullet, GameLoopState } from '../types'

const TICK_MS         = 50   // 20 fps
const BULLET_SPEED    = 3.0  // % per tick
const HERO_FIRE_EVERY = 20   // ticks between shots (~1s)

// 英雄列 → x 坐标（格子右边界，子弹从这里发射向右）
const colToX = (col: number) => 8 + col * 16   // col0→8, col4→72

const INITIAL_STATE: GameLoopState = {
  enemies: [], bullets: [], baseHp: 10,
  wave: 0, heroTick: 0, spawnTick: 0, phase: 'idle',
  rapidFireTicks: 0, shieldHp: 0, slowTicks: 0,
}

// ── 难度参数（按 level 1-5 × wave 双轴缩放）────────────────────
function spawnParams(wave: number, level: number) {
  // 生成间隔：越小越频繁
  const interval = Math.max(10, 55 - wave * 3 - (level - 1) * 4)
  // 每次生成的敌人数量（随波次和等级增加，上限 5）
  const count = Math.min(5, 1 + Math.floor(wave / 3) + (level >= 4 ? 1 : 0))
  // 敌人 HP（level 越高 / 波次越多 → HP 越高）
  const hp = Math.max(1, Math.floor(level / 2)) + Math.floor(wave / 4)
  // 基础移速（level 越高越快，波次越多越快）
  const baseSpeed = 0.35 + (level - 1) * 0.06 + wave * 0.03
  return { interval, count, hp, baseSpeed }
}

export function useGameLoop(
  getCells: () => Record<string, Cell>,
  onStateChange: (s: GameLoopState) => void,
  getLevel: () => number = () => 2,
) {
  const stateRef = useRef<GameLoopState>({ ...INITIAL_STATE })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const tick = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing') return

    s.heroTick++
    s.spawnTick++

    if (s.rapidFireTicks > 0) s.rapidFireTicks--
    if (s.slowTicks > 0) s.slowTicks--

    // 1. 英雄开火
    const fireEvery = s.rapidFireTicks > 0
      ? Math.max(1, Math.floor(HERO_FIRE_EVERY / 2))
      : HERO_FIRE_EVERY
    if (s.heroTick % fireEvery === 0) {
      const cells = getCells()
      Object.values(cells).forEach(cell => {
        if (cell.type !== 'hero') return
        const [, rStr, cStr] = cell.id.split('-')
        s.bullets.push({
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          row: Number(rStr), x: colToX(Number(cStr)),
          damage: cell.tier ?? 1,
        })
      })
    }

    // 2. 移动子弹
    s.bullets = s.bullets.map(b => ({ ...b, x: b.x + BULLET_SPEED })).filter(b => b.x < 105)

    // 3. 移动敌人
    s.enemies = s.enemies.map(e => ({ ...e, x: e.x - e.speed }))

    // 4. 碰撞检测
    const toRemoveBullet = new Set<string>()
    s.enemies = s.enemies.map(enemy => {
      let hp = enemy.hp
      s.bullets.forEach(b => {
        if (toRemoveBullet.has(b.id) || b.row !== enemy.row) return
        if (b.x >= enemy.x - 4 && b.x <= enemy.x + 4) {
          hp -= b.damage
          toRemoveBullet.add(b.id)
        }
      })
      return { ...enemy, hp }
    })
    s.bullets = s.bullets.filter(b => !toRemoveBullet.has(b.id))

    // 5. 移除死亡敌人
    s.enemies = s.enemies.filter(e => e.hp > 0)

    // 6. 敌人到达基地
    const reached = s.enemies.filter(e => e.x <= 2)
    if (reached.length > 0) {
      const totalDmg = reached.length
      const shieldAbsorb = Math.min(s.shieldHp, totalDmg)
      s.shieldHp = Math.max(0, s.shieldHp - shieldAbsorb)
      s.baseHp   = Math.max(0, s.baseHp   - (totalDmg - shieldAbsorb))
      s.enemies  = s.enemies.filter(e => e.x > 2)
    }

    // 7. 生成敌人（多只同时出发，按波次+等级双轴缩放）
    const lv = getLevel()
    const { interval, count, hp, baseSpeed } = spawnParams(s.wave, lv)

    if (s.spawnTick % interval === 0) {
      const startRow = Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        const row   = (startRow + i) % 3
        const speed = (s.slowTicks > 0 ? baseSpeed * 0.6 : baseSpeed) * (0.88 + Math.random() * 0.24)
        s.enemies.push({
          id: `e-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
          row, x: 100 + i * 8,  // 错开入场，避免堆叠
          hp, maxHp: hp, speed,
        })
      }

      // 每 10 次生成一波结算 → 开启商店
      if (s.spawnTick % (interval * 10) === 0) {
        s.wave++
        s.phase = 'shop'
        stopTimer()
      }
    }

    // 8. 游戏结束
    if (s.baseHp <= 0) {
      s.phase = 'over'
      stopTimer()
    }

    onStateChange({ ...s })
  }, [getCells, onStateChange, getLevel, stopTimer])

  const start = useCallback(() => {
    stateRef.current.phase = 'playing'
    timerRef.current = setInterval(tick, TICK_MS)
    onStateChange({ ...stateRef.current })
  }, [tick, onStateChange])

  const stop = useCallback(() => {
    stopTimer()
    stateRef.current.phase = 'idle'
  }, [stopTimer])

  const pause = useCallback(() => {
    if (!timerRef.current) return
    stopTimer()
    stateRef.current.phase = 'paused'
    onStateChange({ ...stateRef.current })
  }, [stopTimer, onStateChange])

  const resume = useCallback(() => {
    stateRef.current.phase = 'playing'
    timerRef.current = setInterval(tick, TICK_MS)
    onStateChange({ ...stateRef.current })
  }, [tick, onStateChange])

  const reset = useCallback(() => {
    stop()
    stateRef.current = { ...INITIAL_STATE }
    onStateChange({ ...stateRef.current })
  }, [stop, onStateChange])

  const applyEffect = useCallback((fn: (s: GameLoopState) => void) => {
    fn(stateRef.current)
    onStateChange({ ...stateRef.current })
  }, [onStateChange])

  return { start, stop, pause, resume, reset, applyEffect }
}

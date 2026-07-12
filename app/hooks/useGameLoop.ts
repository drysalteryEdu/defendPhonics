'use client'
import { useRef, useCallback } from 'react'
import type { Cell, Enemy, Bullet, GameLoopState } from '../types'

const TICK_MS       = 50    // 20 fps game logic
const ENEMY_SPEED   = 0.6   // % per tick
const BULLET_SPEED  = 3.0   // % per tick
const HERO_FIRE_EVERY = 20  // ticks between shots (~1s)
const SPAWN_EVERY   = 60    // ticks between spawns (~3s, decreases with waves)

// 英雄列 → x 坐标（格子右边界，子弹从这里发射向右）
const colToX = (col: number) => 8 + col * 16   // col0→8, col4→72

const INITIAL_STATE: GameLoopState = {
  enemies: [], bullets: [], baseHp: 10,
  wave: 0, heroTick: 0, spawnTick: 0, phase: 'idle',
  rapidFireTicks: 0, shieldHp: 0, slowTicks: 0,
}

export function useGameLoop(
  getCells: () => Record<string, Cell>,
  onStateChange: (s: GameLoopState) => void,
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

    // 速射道具倒计时
    if (s.rapidFireTicks > 0) s.rapidFireTicks--

    // 冰冻道具倒计时
    if (s.slowTicks > 0) s.slowTicks--

    // 1. 英雄开火（速射模式下射速×2）
    const fireEvery = s.rapidFireTicks > 0
      ? Math.max(1, Math.floor(HERO_FIRE_EVERY / 2))
      : HERO_FIRE_EVERY
    if (s.heroTick % fireEvery === 0) {
      const cells = getCells()
      Object.values(cells).forEach(cell => {
        if (cell.type !== 'hero') return
        const [, rStr, cStr] = cell.id.split('-')
        const row = Number(rStr)
        const col = Number(cStr)
        s.bullets.push({
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          row, x: colToX(col), damage: cell.tier ?? 1,
        })
      })
    }

    // 2. 移动子弹（向右）
    s.bullets = s.bullets
      .map(b => ({ ...b, x: b.x + BULLET_SPEED }))
      .filter(b => b.x < 105)

    // 3. 移动敌人（向左）
    s.enemies = s.enemies.map(e => ({ ...e, x: e.x - e.speed }))

    // 4. 碰撞检测：子弹 vs 敌人（同行，坐标接近）
    const toRemoveBullet = new Set<string>()
    s.enemies = s.enemies.map(enemy => {
      let hp = enemy.hp
      s.bullets.forEach(b => {
        if (toRemoveBullet.has(b.id)) return
        if (b.row !== enemy.row) return
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

    // 6. 敌人到达基地（x <= 2），护盾优先吸伤
    const reached = s.enemies.filter(e => e.x <= 2)
    if (reached.length > 0) {
      const totalDmg = reached.length
      const shieldAbsorb = Math.min(s.shieldHp, totalDmg)
      s.shieldHp = Math.max(0, s.shieldHp - shieldAbsorb)
      s.baseHp = Math.max(0, s.baseHp - (totalDmg - shieldAbsorb))
      s.enemies = s.enemies.filter(e => e.x > 2)
    }

    // 7. 生成敌人（波次越高越频繁）
    const spawnInterval = Math.max(20, SPAWN_EVERY - s.wave * 3)
    if (s.spawnTick % spawnInterval === 0) {
      const row = Math.floor(Math.random() * 3)
      const hp = 2 + Math.floor(s.wave / 3)
      const baseSpeed = ENEMY_SPEED + s.wave * 0.05
      const speed = s.slowTicks > 0 ? baseSpeed * 0.6 : baseSpeed
      s.enemies.push({
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        row, x: 100, hp, maxHp: hp, speed,
      })

      // 每 10 次生成一波结算 → 开启商店
      if (s.spawnTick % (spawnInterval * 10) === 0) {
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
  }, [getCells, onStateChange, stopTimer])

  const start = useCallback(() => {
    const s = stateRef.current
    s.phase = 'playing'
    timerRef.current = setInterval(tick, TICK_MS)
    onStateChange({ ...s })
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

  // 供商店道具直接修改 loop state（在 shop/paused 阶段调用）
  const applyEffect = useCallback((fn: (s: GameLoopState) => void) => {
    fn(stateRef.current)
    onStateChange({ ...stateRef.current })
  }, [onStateChange])

  return { start, stop, pause, resume, reset, applyEffect }
}

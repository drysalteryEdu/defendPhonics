'use client'
import { useRef, useCallback } from 'react'
import type { Cell, Enemy, Bullet, GameLoopState } from '../types'

const TICK_MS      = 50    // 20 fps game logic
const ENEMY_SPEED  = 0.6   // % per tick
const BULLET_SPEED = 3.0   // % per tick
const HERO_FIRE_EVERY = 20 // ticks between shots (~1s)
const SPAWN_EVERY  = 60    // ticks between spawns (~3s, decreases with waves)

// 英雄列 → x 坐标（格子右边界，子弹从这里发射向右）
// 5 列占 0-80% 宽度（留 20% 右侧给敌人动画区）
const colToX = (col: number) => 8 + col * 16   // col0→8, col4→72

export function useGameLoop(
  getCells: () => Record<string, Cell>,
  onStateChange: (s: GameLoopState) => void,
) {
  const stateRef = useRef<GameLoopState>({
    enemies: [], bullets: [], baseHp: 10,
    wave: 0, heroTick: 0, spawnTick: 0, phase: 'idle',
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== 'playing') return

    s.heroTick++
    s.spawnTick++

    // 1. 英雄开火
    if (s.heroTick % HERO_FIRE_EVERY === 0) {
      const cells = getCells()
      Object.values(cells).forEach(cell => {
        if (cell.type !== 'hero') return
        const [, rStr, cStr] = cell.id.split('-')
        const row = Number(rStr)
        const col = Number(cStr)
        s.bullets.push({
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          row, x: colToX(col), damage: 1,
        })
      })
    }

    // 2. 移动子弹（向右）
    s.bullets = s.bullets
      .map(b => ({ ...b, x: b.x + BULLET_SPEED }))
      .filter(b => b.x < 105)   // 飞出屏幕右侧删除

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

    // 6. 敌人到达基地（x <= 2）
    const reached = s.enemies.filter(e => e.x <= 2)
    if (reached.length > 0) {
      s.baseHp = Math.max(0, s.baseHp - reached.length)
      s.enemies = s.enemies.filter(e => e.x > 2)
    }

    // 7. 生成敌人（波次越高越频繁）
    const spawnInterval = Math.max(20, SPAWN_EVERY - s.wave * 3)
    if (s.spawnTick % spawnInterval === 0) {
      const row = Math.floor(Math.random() * 3)
      const hp = 2 + Math.floor(s.wave / 3)
      s.enemies.push({
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        row, x: 100, hp, maxHp: hp,
        speed: ENEMY_SPEED + s.wave * 0.05,
      })
      // 每 10 次生成一波结算
      if (s.spawnTick % (spawnInterval * 10) === 0) s.wave++
    }

    // 8. 游戏结束
    if (s.baseHp <= 0) {
      s.phase = 'over'
      stop()
    }

    onStateChange({ ...s })
  }, [getCells, onStateChange])

  const start = useCallback(() => {
    const s = stateRef.current
    s.phase = 'playing'
    timerRef.current = setInterval(tick, TICK_MS)
    onStateChange({ ...s })
  }, [tick, onStateChange])

  const stop = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    stateRef.current.phase = 'idle'
  }, [])

  const pause = useCallback(() => {
    if (!timerRef.current) return
    clearInterval(timerRef.current)
    timerRef.current = null
    stateRef.current.phase = 'paused'
    onStateChange({ ...stateRef.current })
  }, [onStateChange])

  const resume = useCallback(() => {
    stateRef.current.phase = 'playing'
    timerRef.current = setInterval(tick, TICK_MS)
    onStateChange({ ...stateRef.current })
  }, [tick, onStateChange])

  const reset = useCallback(() => {
    stop()
    stateRef.current = {
      enemies: [], bullets: [], baseHp: 10,
      wave: 0, heroTick: 0, spawnTick: 0, phase: 'idle',
    }
    onStateChange({ ...stateRef.current })
  }, [stop, onStateChange])

  return { start, stop, pause, resume, reset }
}

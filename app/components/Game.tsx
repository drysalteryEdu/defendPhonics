'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { Cell, HandItem, GameLoopState } from '../types'
import GridCell from './GridCell'
import LetterBlock from './LetterBlock'
import BattleOverlay from './BattleOverlay'
import DifficultyPicker from './DifficultyPicker'
import WaveShop from './WaveShop'
import { lookupSynthesis } from '../data/words'
import { dealHand, refillTiles, type LevelRange, LEVEL_INFO } from '../data/levels'
import { getRandomShopItems, type ShopItem } from '../data/shopItems'
import { useGameLoop } from '../hooks/useGameLoop'
import { playSynthesis, playPlace, playReturn, playInvalid } from '../utils/sounds'

const ROWS = 3
const COLS = 5

function makeEmptyCells(): Record<string, Cell> {
  const cells: Record<string, Cell> = {}
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const id = `cell-${r}-${c}`
      cells[id] = { id, type: 'empty', value: '' }
    }
  return cells
}

function overlayTextSize(value: string) {
  if (value.length <= 1) return 'text-3xl sm:text-5xl'
  if (value.length <= 3) return 'text-2xl sm:text-4xl'
  return 'text-xl sm:text-3xl'
}

export default function Game() {
  const [level, setLevel]           = useState<LevelRange>(2)
  const [showPicker, setShowPicker] = useState(false)
  const [cells, setCells]           = useState(makeEmptyCells)
  const [hand, setHand]             = useState<HandItem[]>(() => dealHand(2))
  const [activeId, setActiveId]     = useState<string | null>(null)
  const [loopState, setLoopState]   = useState<GameLoopState>({
    enemies: [], bullets: [], baseHp: 10, wave: 0,
    heroTick: 0, spawnTick: 0, phase: 'idle',
    rapidFireTicks: 0, shieldHp: 0, slowTicks: 0,
  })
  const [shopItems, setShopItems]   = useState<ShopItem[] | null>(null)

  // useRef for getCells → game loop reads latest state without closure staleness
  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const getCells = useCallback(() => cellsRef.current, [])

  const loop = useGameLoop(getCells, setLoopState)

  // Open wave shop when phase becomes 'shop'
  const lastShopWaveRef = useRef(-1)
  useEffect(() => {
    if (loopState.phase === 'shop' && lastShopWaveRef.current !== loopState.wave) {
      lastShopWaveRef.current = loopState.wave
      setShopItems(getRandomShopItems(3))
    }
  }, [loopState.phase, loopState.wave])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const getActive = useCallback((): { value: string; type: 'letter' | 'rime' | 'hero' } | null => {
    if (!activeId) return null
    const hi = hand.find(h => h.id === activeId)
    if (hi) return hi
    const c = cells[activeId]
    if (c && c.type !== 'empty') return { value: c.value, type: c.type }
    return null
  }, [activeId, hand, cells])

  function handleDragStart(e: DragStartEvent) { setActiveId(String(e.active.id)) }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const sourceId = String(active.id)
    const targetId = String(over.id)
    if (sourceId === targetId || !targetId.startsWith('cell-')) return

    const sourceHand = hand.find(h => h.id === sourceId)
    const sourceCell = cells[sourceId]
    const targetCell = cells[targetId]

    if (sourceHand) {
      if (targetCell.type === 'empty') {
        playPlace()
        setHand(p => p.filter(h => h.id !== sourceId))
        setCells(p => ({ ...p, [targetId]: { id: targetId, type: sourceHand.type, value: sourceHand.value } }))
      } else if (targetCell.type !== 'hero') {
        const hit = lookupSynthesis(sourceHand.value, targetCell.value)
        if (hit) {
          playSynthesis()
          setHand(p => [...p.filter(h => h.id !== sourceId), ...refillTiles(level, 2)])
          setCells(p => ({ ...p, [targetId]: { id: targetId, type: 'hero', value: hit.word, emoji: hit.emoji } }))
        } else { playInvalid() }
      }
    } else if (sourceCell && sourceCell.type !== 'empty') {
      // V4: hero-on-hero merge → upgrade tier
      if (
        sourceCell.type === 'hero' && targetCell.type === 'hero' &&
        sourceCell.value === targetCell.value
      ) {
        const newTier = Math.min(3, (sourceCell.tier ?? 1) + (targetCell.tier ?? 1))
        playSynthesis()
        setCells(p => ({
          ...p,
          [sourceId]: { id: sourceId, type: 'empty', value: '' },
          [targetId]: { ...targetCell, tier: newTier },
        }))
        return
      }

      if (targetCell.type === 'empty') {
        playPlace()
        setCells(p => ({
          ...p,
          [sourceId]: { id: sourceId, type: 'empty', value: '' },
          [targetId]: { ...sourceCell, id: targetId },
        }))
      } else if (targetCell.type !== 'hero' && sourceCell.type !== 'hero') {
        const hit = lookupSynthesis(sourceCell.value, targetCell.value)
        if (hit) {
          playSynthesis()
          setHand(p => [...p, ...refillTiles(level, 2)])
          setCells(p => ({
            ...p,
            [sourceId]: { id: sourceId, type: 'empty', value: '' },
            [targetId]: { id: targetId, type: 'hero', value: hit.word, emoji: hit.emoji },
          }))
        } else {
          playPlace()
          setCells(p => ({
            ...p,
            [sourceId]: { ...targetCell, id: sourceId },
            [targetId]: { ...sourceCell, id: targetId },
          }))
        }
      }
    }
  }

  function handleShopSelect(item: ShopItem) {
    setShopItems(null)
    if (item.id === 'heal') {
      loop.applyEffect(s => { s.baseHp = Math.min(10, s.baseHp + 3) })
    } else if (item.id === 'redraw') {
      setHand(dealHand(level))
    } else if (item.id === 'add_tiles') {
      setHand(p => [...p, ...refillTiles(level, 5)])
    } else if (item.id === 'rapid') {
      loop.applyEffect(s => { s.rapidFireTicks = 400 })  // 400 ticks = 20s at 20fps
    } else if (item.id === 'shield') {
      loop.applyEffect(s => { s.shieldHp = (s.shieldHp ?? 0) + 3 })
    } else if (item.id === 'slow') {
      loop.applyEffect(s => { s.slowTicks = 300 })  // 300 ticks = 15s at 20fps
    }
    loop.resume()
  }

  function handleRemoveFromCell(cellId: string) {
    const cell = cells[cellId]
    if (cell.type === 'empty' || cell.type === 'hero') return
    playReturn()
    setHand(p => [...p, { id: `h-${Date.now()}`, type: cell.type as 'letter' | 'rime', value: cell.value }])
    setCells(p => ({ ...p, [cellId]: { id: cellId, type: 'empty', value: '' } }))
  }

  function handleReset() {
    loop.reset()
    setCells(makeEmptyCells())
    setHand(dealHand(level))
    setShopItems(null)
    lastShopWaveRef.current = -1
  }

  function handleLevelChange(lv: LevelRange) {
    setLevel(lv)
    loop.reset()
    setCells(makeEmptyCells())
    setHand(dealHand(lv))
    setShopItems(null)
    lastShopWaveRef.current = -1
  }

  const active     = getActive()
  const heroCount  = Object.values(cells).filter(c => c.type === 'hero').length
  const lvInfo     = LEVEL_INFO[level]
  const isPlaying  = loopState.phase === 'playing'
  const isPaused   = loopState.phase === 'paused'
  const isOver     = loopState.phase === 'over'
  const isShop     = loopState.phase === 'shop'

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-gradient-to-b from-sky-500 to-indigo-600 px-3 py-6 gap-4"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between w-full max-w-sm sm:max-w-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg tracking-wide">🛡️ 拼读保卫战</h1>
          <p className="text-sky-100 text-xs mt-0.5">
            {lvInfo.emoji} {lvInfo.label}
            {heroCount > 0 && <span className="ml-2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{heroCount} 英雄</span>}
            {loopState.shieldHp > 0 && <span className="ml-1 bg-blue-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">🛡️{loopState.shieldHp}</span>}
            {loopState.rapidFireTicks > 0 && <span className="ml-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">⚡速射</span>}
            {loopState.slowTicks > 0 && <span className="ml-1 bg-cyan-400 text-cyan-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">❄️冰冻</span>}
          </p>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/70 rounded-xl px-3 py-1.5 transition-all"
        >
          {lvInfo.emoji} 词库
        </button>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 3×5 Battle Grid */}
        <section className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-3 sm:p-4 shadow-2xl w-full max-w-sm sm:max-w-lg">
          <p className="text-[10px] text-sky-100 text-center mb-2 uppercase tracking-widest">战场 3×5</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const id = `cell-${r}-${c}`
                return <GridCell key={id} cell={cells[id]} onDoubleClick={() => handleRemoveFromCell(id)} />
              })
            )}
          </div>

          {/* 塔防覆盖层（敌人 + 子弹 + 状态） */}
          {(isPlaying || isPaused || isOver || isShop) && (
            <BattleOverlay loop={loopState} />
          )}
        </section>

        {/* 塔防控制栏 */}
        <div className="flex gap-2 w-full max-w-sm sm:max-w-lg">
          {/* 基地 HP */}
          <div className="flex items-center gap-1 bg-white/20 rounded-2xl px-3 py-2 flex-1">
            <span className="text-lg">🏰</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-3 rounded-sm ${
                    i < loopState.shieldHp
                      ? 'bg-blue-300'
                      : i < loopState.baseHp + loopState.shieldHp
                      ? 'bg-green-300'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 开始 / 暂停 / 继续 */}
          {!isPlaying && !isOver && !isShop && (
            <button
              onClick={isPaused ? loop.resume : loop.start}
              disabled={heroCount === 0}
              className="bg-green-400 hover:bg-green-300 disabled:bg-white/20 text-white disabled:text-white/40 font-black text-sm px-4 rounded-2xl transition-all"
            >
              {isPaused ? '▶ 继续' : '▶ 开战'}
            </button>
          )}
          {isPlaying && (
            <button onClick={loop.pause} className="bg-yellow-400 hover:bg-yellow-300 text-white font-black text-sm px-4 rounded-2xl transition-all">
              ⏸ 暂停
            </button>
          )}

          {/* Wave 计数 */}
          <div className="bg-white/20 rounded-2xl px-3 py-2 text-white text-xs font-bold text-center min-w-[4rem]">
            <div className="text-lg leading-none">⚔️</div>
            <div>Wave {loopState.wave + 1}</div>
          </div>
        </div>

        {/* Hand area */}
        <section className="bg-white/20 backdrop-blur-sm rounded-3xl p-3 sm:p-5 shadow-xl w-full max-w-sm sm:max-w-lg">
          <p className="text-[10px] text-sky-100 text-center mb-3 uppercase tracking-widest">手牌区 · 拖入战场</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {hand.map(item => <LetterBlock key={item.id} item={item} />)}
            {hand.length === 0 && <p className="text-sky-200 text-sm py-2 w-full text-center">所有字母已上场 ✓</p>}
          </div>
        </section>

        <DragOverlay dropAnimation={null}>
          {active && (
            <div className={[
              'w-14 h-14 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center',
              'shadow-2xl rotate-3 scale-110 pointer-events-none',
              active.type === 'rime' ? 'bg-emerald-400' : 'bg-blue-400',
            ].join(' ')}>
              <span className={`${overlayTextSize(active.value)} font-black text-white`}>{active.value}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Tips + Reset */}
      <footer className="flex flex-col items-center gap-2 w-full max-w-sm sm:max-w-lg">
        <p className="text-xs text-sky-200 text-center leading-relaxed">
          💡 合成英雄后点 ▶ 开战 &nbsp;|&nbsp; 双击格子退回手牌 &nbsp;|&nbsp; 同名英雄叠加升级 ⭐
        </p>
        <button
          onClick={handleReset}
          className="text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/50 rounded-full px-5 py-1.5 transition-all"
        >
          重新开始
        </button>
      </footer>

      {/* 难度选择弹窗 */}
      {showPicker && (
        <DifficultyPicker
          value={level}
          onChange={handleLevelChange}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* 波次商店弹窗 */}
      {isShop && shopItems && (
        <WaveShop
          wave={loopState.wave}
          items={shopItems}
          onSelect={handleShopSelect}
        />
      )}
    </div>
  )
}

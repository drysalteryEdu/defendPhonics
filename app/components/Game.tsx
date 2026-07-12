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
import AchievementToast from './AchievementToast'
import BadgeGallery from './BadgeGallery'
import MusicReward from './MusicReward'
import AntiAddictionOverlay from './AntiAddictionOverlay'
import { lookupSynthesis } from '../data/words'
import { dealHand, refillTiles, BOOK_INFO, isPurelyLetters } from '../data/levels'
import { getRandomShopItems, type ShopItem } from '../data/shopItems'
import { useGameLoop } from '../hooks/useGameLoop'
import { useAntiAddiction } from '../hooks/useAntiAddiction'
import { playSynthesis, playPlace, playReturn, playInvalid } from '../utils/sounds'
import { speakPhonics, speakLetter } from '../utils/phonicsAudio'
import { logEvent } from '../utils/supabase'
import { FEATURES } from '../config/features'
import { type Song, pickRandomSong } from '../data/songs'
import {
  type Achievement,
  trackHeroSynthesized,
  trackWaveComplete,
  trackLevel5,
} from '../data/achievements'

const ROWS = 3
const COLS = 5
const HINT_DELAY_MS = 10_000

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

function findHintPair(hand: HandItem[], cells: Record<string, Cell>): [string, string] | null {
  for (const a of hand) {
    for (const b of hand) {
      if (a.id >= b.id) continue
      if (lookupSynthesis(a.value, b.value)) return [a.id, b.id]
    }
  }
  for (const a of hand) {
    for (const cell of Object.values(cells)) {
      if (cell.type === 'empty' || cell.type === 'hero') continue
      if (lookupSynthesis(a.value, cell.value)) return [a.id, cell.id]
    }
  }
  return null
}

const DEFAULT_SELECTION = {
  '1-1': true, '1-2': true, '1-3': true, '1-4': true,
  '2-1': true, '2-2': true
}

export default function Game() {
  const [selection, setSelection]     = useState<Record<string, boolean>>(() => DEFAULT_SELECTION)
  const [showPicker, setShowPicker]   = useState(false)
  const [showBadges, setShowBadges]   = useState(false)
  const [hintMode, setHintMode]       = useState(false)   // 提示模式，默认关闭
  const [cells, setCells]             = useState(makeEmptyCells)
  const [hand, setHand]               = useState<HandItem[]>(() => dealHand(DEFAULT_SELECTION))
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [hintIds, setHintIds]         = useState<Set<string>>(new Set())
  const [pendingToasts, setPendingToasts] = useState<Achievement[]>([])
  const [shopItems, setShopItems]     = useState<ShopItem[] | null>(null)
  // 激励音乐（每局最多 2 次）
  const [musicSong, setMusicSong]     = useState<Song | null>(null)
  const lastMusicWaveRef              = useRef(-1)
  const lastSongIdRef                 = useRef(-1)
  const musicRewardCountRef           = useRef(0)
  const [loopState, setLoopState]     = useState<GameLoopState>({
    enemies: [], bullets: [], baseHp: 10, wave: 0,
    heroTick: 0, spawnTick: 0, phase: 'idle',
    rapidFireTicks: 0, shieldHp: 0, slowTicks: 0,
  })

  // Refs 供 game loop / hint interval 读取最新值（避免 stale closure）
  const cellsRef = useRef(cells); cellsRef.current = cells
  const handRef  = useRef(hand);  handRef.current  = hand
  const selectionRef = useRef(selection); selectionRef.current = selection
  
  const getCells  = useCallback(() => cellsRef.current, [])
  
  const getHighestBookNum = (sel: Record<string, boolean>) => {
    let maxB = 1
    Object.keys(sel).forEach(k => {
      if (sel[k]) {
        const b = Number(k.split('-')[0])
        if (b > maxB) maxB = b
      }
    })
    return maxB
  }
  const getLevel  = useCallback(() => getHighestBookNum(selectionRef.current), [])

  const loop = useGameLoop(getCells, setLoopState, getLevel)

  const isPlaying = loopState.phase === 'playing'
  const isPaused  = loopState.phase === 'paused'
  const isOver    = loopState.phase === 'over'
  const isShop    = loopState.phase === 'shop'

  // ── 防沉溺 ─────────────────────────────────────────────────────
  const antiAdd = useAntiAddiction(isPlaying)
  useEffect(() => {
    if (antiAdd.showBreak && isPlaying) loop.pause()
  }, [antiAdd.showBreak, isPlaying])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── 激励音乐：HP 降至临界值触发 ────────────────────────────────
  useEffect(() => {
    if (!FEATURES.musicReward) return
    if (loopState.phase !== 'playing') return
    if (loopState.baseHp > FEATURES.musicCriticalHp) return
    if (lastMusicWaveRef.current === loopState.wave) return
    if (musicRewardCountRef.current >= 2) return
    lastMusicWaveRef.current = loopState.wave
    musicRewardCountRef.current++
    loop.pause()
    const song = pickRandomSong(lastSongIdRef.current)
    lastSongIdRef.current = song.id
    setMusicSong(song)
  }, [loopState.baseHp, loopState.phase, loopState.wave])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleMusicClaim() {
    setMusicSong(null)
    loop.applyEffect(s => { s.baseHp = Math.min(10, s.baseHp + 3) })
    loop.resume()
    logEvent('music_claim', loopState.wave, selectionRef.current, { bonus_hp: 3 })
  }

  // ── 波次商店 ───────────────────────────────────────────────────
  const lastShopWaveRef = useRef(-1)
  useEffect(() => {
    if (loopState.phase === 'shop' && lastShopWaveRef.current !== loopState.wave) {
      lastShopWaveRef.current = loopState.wave
      setShopItems(getRandomShopItems(FEATURES.shopItemCount))
    }
  }, [loopState.phase, loopState.wave])

  // ── Supabase operation log state-change hooks ─────────────────
  useEffect(() => {
    if (loopState.phase === 'over') {
      logEvent('game_over', loopState.wave, selectionRef.current, { final_wave: loopState.wave, baseHp: loopState.baseHp })
    } else if (loopState.phase === 'playing') {
      logEvent('game_start', loopState.wave, selectionRef.current, { wave: loopState.wave })
    } else if (loopState.phase === 'shop') {
      logEvent('wave_complete', loopState.wave, selectionRef.current, { wave: loopState.wave, baseHp: loopState.baseHp })
    }
  }, [loopState.phase])

  // ── 提示系统（只在 hintMode 开启时运行）────────────────────────
  const lastActionRef = useRef(Date.now())
  function bumpAction() { lastActionRef.current = Date.now(); setHintIds(new Set()) }

  useEffect(() => {
    if (!hintMode) { setHintIds(new Set()); return }
    const iv = setInterval(() => {
      if (Date.now() - lastActionRef.current < HINT_DELAY_MS) return
      const pair = findHintPair(handRef.current, cellsRef.current)
      if (pair) setHintIds(new Set(pair))
    }, 1000)
    return () => clearInterval(iv)
  }, [hintMode])

  function queueAchievements(gained: Achievement[]) {
    if (gained.length === 0) return
    setPendingToasts(p => [...p, ...gained])
  }

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
        bumpAction(); playPlace()
        setHand(p => p.filter(h => h.id !== sourceId))
        setCells(p => ({ ...p, [targetId]: { id: targetId, type: sourceHand.type, value: sourceHand.value } }))
        logEvent('place_tile', loopState.wave, selection, { from: 'hand', type: sourceHand.type, value: sourceHand.value, cell: targetId })
        if (sourceHand.type === 'letter') {
          speakLetter(sourceHand.value)
        }
      } else if (targetCell.type !== 'hero') {
        const hit = lookupSynthesis(sourceHand.value, targetCell.value)
        if (hit) {
          bumpAction(); playSynthesis()
          speakPhonics(sourceHand.value, targetCell.value, hit.word)
          queueAchievements(trackHeroSynthesized(1))
          setHand(p => [...p.filter(h => h.id !== sourceId), ...refillTiles(selection, 2)])
          setCells(p => ({ ...p, [targetId]: { id: targetId, type: 'hero', value: hit.word, emoji: hit.emoji } }))
          logEvent('synthesize_hero', loopState.wave, selection, { from: 'hand', letter: sourceHand.value, rime: targetCell.value, word: hit.word })
        } else { 
          playInvalid() 
          logEvent('invalid_synthesis', loopState.wave, selection, { from: 'hand', val1: sourceHand.value, val2: targetCell.value })
        }
      }
    } else if (sourceCell && sourceCell.type !== 'empty') {
      if (sourceCell.type === 'hero' && targetCell.type === 'hero' && sourceCell.value === targetCell.value) {
        const newTier = Math.min(3, (sourceCell.tier ?? 1) + (targetCell.tier ?? 1))
        bumpAction(); playSynthesis()
        speakPhonics(sourceCell.value, '', sourceCell.value) // Repeat sound on upgrade
        queueAchievements(trackHeroSynthesized(newTier))
        setCells(p => ({
          ...p,
          [sourceId]: { id: sourceId, type: 'empty', value: '' },
          [targetId]: { ...targetCell, tier: newTier },
        }))
        logEvent('upgrade_hero', loopState.wave, selection, { word: targetCell.value, tier: newTier })
        return
      }
      if (targetCell.type === 'empty') {
        bumpAction(); playPlace()
        setCells(p => ({
          ...p,
          [sourceId]: { id: sourceId, type: 'empty', value: '' },
          [targetId]: { ...sourceCell, id: targetId },
        }))
        logEvent('move_tile', loopState.wave, selection, { from_cell: sourceId, to_cell: targetId, type: sourceCell.type, value: sourceCell.value })
      } else if (targetCell.type !== 'hero' && sourceCell.type !== 'hero') {
        const hit = lookupSynthesis(sourceCell.value, targetCell.value)
        if (hit) {
          bumpAction(); playSynthesis()
          speakPhonics(sourceCell.value, targetCell.value, hit.word)
          queueAchievements(trackHeroSynthesized(1))
          setHand(p => [...p, ...refillTiles(selection, 2)])
          setCells(p => ({
            ...p,
            [sourceId]: { id: sourceId, type: 'empty', value: '' },
            [targetId]: { id: targetId, type: 'hero', value: hit.word, emoji: hit.emoji },
          }))
          logEvent('synthesize_hero', loopState.wave, selection, { from: 'board', letter: sourceCell.value, rime: targetCell.value, word: hit.word })
        } else {
          bumpAction(); playPlace()
          setCells(p => ({
            ...p,
            [sourceId]: { ...targetCell, id: sourceId },
            [targetId]: { ...sourceCell, id: targetId },
          }))
          logEvent('swap_tiles', loopState.wave, selection, { cell1: sourceId, cell2: targetId })
        }
      }
    }
  }

  function handleShopSelect(item: ShopItem) {
    setShopItems(null)
    queueAchievements(trackWaveComplete(loopState.wave))
    bumpAction()
    logEvent('shop_select', loopState.wave, selection, { item_id: item.id, item_label: item.label })

    if (item.id === 'heal') {
      loop.applyEffect(s => { s.baseHp = Math.min(10, s.baseHp + 3) })
    } else if (item.id === 'fullheal') {
      loop.applyEffect(s => { s.baseHp = 10; s.shieldHp = 0 })
    } else if (item.id === 'bomb') {
      loop.applyEffect(s => { s.enemies = []; s.bullets = [] })
    } else if (item.id === 'redraw') {
      if (FEATURES.redrawClearsGrid) {
        // 清空战场英雄 + 清扫残余敌人 + 补充 14 张牌
        loop.applyEffect(s => { s.enemies = []; s.bullets = [] })
        setCells(makeEmptyCells())
        setHand(dealHand(selection, 14))
      } else {
        setHand(dealHand(selection))
      }
    } else if (item.id === 'add_tiles') {
      setHand(p => [...p, ...refillTiles(selection, 5)])
    } else if (item.id === 'rapid') {
      loop.applyEffect(s => { s.rapidFireTicks = 400 })
    } else if (item.id === 'shield') {
      loop.applyEffect(s => { s.shieldHp = (s.shieldHp ?? 0) + 3 })
    } else if (item.id === 'slow') {
      loop.applyEffect(s => { s.slowTicks = 300 })
    }

    loop.resume()
  }

  function handleRemoveFromCell(cellId: string) {
    const cell = cells[cellId]
    if (cell.type === 'empty' || cell.type === 'hero') return
    bumpAction(); playReturn()
    setHand(p => [...p, { id: `h-${Date.now()}`, type: cell.type as 'letter' | 'rime', value: cell.value }])
    setCells(p => ({ ...p, [cellId]: { id: cellId, type: 'empty', value: '' } }))
    logEvent('return_tile', loopState.wave, selection, { cell: cellId, type: cell.type, value: cell.value })
  }

  function handleReset() {
    loop.reset()
    setCells(makeEmptyCells())
    setHand(dealHand(selection))
    setShopItems(null); setMusicSong(null)
    lastShopWaveRef.current = -1
    lastMusicWaveRef.current = -1
    musicRewardCountRef.current = 0
    bumpAction()
    logEvent('game_reset', 0, selection, {})
  }

  function handleSelectionChange(newSelection: Record<string, boolean>) {
    setSelection(newSelection)
    loop.reset()
    setCells(makeEmptyCells())
    setHand(dealHand(newSelection))
    setShopItems(null); setMusicSong(null)
    lastShopWaveRef.current = -1
    lastMusicWaveRef.current = -1
    musicRewardCountRef.current = 0
    bumpAction()
    logEvent('selection_change', 0, newSelection, {})
    
    // Track Level 5 achievement if any Book 5 unit is selected
    const hasBook5 = Object.keys(newSelection).some(k => newSelection[k] && k.startsWith('5-'))
    if (hasBook5) queueAchievements(trackLevel5())
  }

  // 如果 redrawClearsGrid，展示时修改描述
  const enrichedShopItems = shopItems?.map(item =>
    item.id === 'redraw' && FEATURES.redrawClearsGrid
      ? { ...item, label: '重置战场', emoji: '🔄', desc: '清空战场+手牌，全新部署（+14张）' }
      : item
  ) ?? null

  const active    = getActive()
  const heroCount = Object.values(cells).filter(c => c.type === 'hero').length
  
  // Custom selection summary format
  const getSelectionSummary = (sel: Record<string, boolean>) => {
    const books = new Set<number>()
    Object.keys(sel).forEach(k => {
      if (sel[k]) books.add(Number(k.split('-')[0]))
    })
    const arr = Array.from(books).sort()
    if (arr.length === 0) return { label: '空', emoji: '⚙️' }
    if (arr.length === 1) return { label: `Book ${arr[0]}`, emoji: BOOK_INFO[arr[0]]?.emoji || '📚' }
    return { label: `Book ${arr.join('+')}`, emoji: '📚' }
  }
  const selSummary = getSelectionSummary(selection)
  const selectedUnitCount = Object.values(selection).filter(Boolean).length

  return (
    <div
      className="min-h-screen flex flex-col items-center bg-gradient-to-b from-sky-500 to-indigo-600 px-3 py-6 gap-4"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between w-full max-w-sm sm:max-w-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg tracking-wide">🛡️ 拼读保卫战</h1>
          <p className="text-sky-100 text-xs mt-0.5 flex flex-wrap items-center gap-1">
            {selSummary.emoji} {selSummary.label} ({selectedUnitCount} 单元)
            {heroCount > 0 && <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{heroCount} 英雄</span>}
            {loopState.shieldHp > 0 && <span className="bg-blue-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">🛡️{loopState.shieldHp}</span>}
            {loopState.rapidFireTicks > 0 && <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">⚡速射</span>}
            {loopState.slowTicks > 0 && <span className="bg-cyan-400 text-cyan-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">❄️冰冻</span>}
            {FEATURES.antiAddiction && antiAdd.playMin > 0 && <span className="text-sky-300 text-[10px]">⏱{antiAdd.playMin}m</span>}
          </p>
        </div>
        <div className="flex gap-1.5">
          {/* 提示模式开关（界面可选，默认关闭） */}
          <button
            onClick={() => setHintMode(v => !v)}
            title={hintMode ? '关闭提示' : '开启新手提示（10秒无操作后亮起）'}
            className={[
              'text-xs border rounded-xl px-2.5 py-1.5 transition-all',
              hintMode
                ? 'bg-amber-400/30 border-amber-300 text-amber-200'
                : 'text-white/60 border-white/20 hover:text-white hover:border-white/50',
            ].join(' ')}
          >
            💡
          </button>
          <button onClick={() => setShowBadges(true)} title="功勋徽章" className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/70 rounded-xl px-2.5 py-1.5 transition-all">
            🏆
          </button>
          <button onClick={() => setShowPicker(true)} className="text-xs text-white/80 hover:text-white border border-white/30 hover:border-white/70 rounded-xl px-3 py-1.5 transition-all">
            {selSummary.emoji} 词库
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 3×5 战场 */}
        <section className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-3 sm:p-4 shadow-2xl w-full max-w-sm sm:max-w-lg">
          <p className="text-[10px] text-sky-100 text-center mb-2 uppercase tracking-widest">战场 3×5</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
            {Array.from({ length: ROWS }, (_, r) =>
              Array.from({ length: COLS }, (_, c) => {
                const id = `cell-${r}-${c}`
                return (
                  <GridCell
                    key={id}
                    cell={cells[id]}
                    onDoubleClick={() => handleRemoveFromCell(id)}
                    isHint={hintIds.has(id)}
                  />
                )
              })
            )}
          </div>
          {(isPlaying || isPaused || isOver || isShop) && <BattleOverlay loop={loopState} />}
        </section>

        {/* 控制栏 */}
        <div className="flex gap-2 w-full max-w-sm sm:max-w-lg">
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
                      ? loopState.baseHp <= FEATURES.musicCriticalHp
                        ? 'bg-red-400 animate-pulse'
                        : 'bg-green-300'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </div>
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
          <div className="bg-white/20 rounded-2xl px-3 py-2 text-white text-xs font-bold text-center min-w-[4rem]">
            <div className="text-lg leading-none">⚔️</div>
            <div>Wave {loopState.wave + 1}</div>
          </div>
        </div>

        {/* 手牌区 */}
        <section className="bg-white/20 backdrop-blur-sm rounded-3xl p-3 sm:p-5 shadow-xl w-full max-w-sm sm:max-w-lg">
          <p className="text-[10px] text-sky-100 text-center mb-3 uppercase tracking-widest">
            手牌区 · 拖入战场
            {hintMode && hintIds.size > 0 && <span className="ml-2 text-amber-300 animate-pulse">💡 提示闪烁</span>}
            {hintMode && hintIds.size === 0 && <span className="ml-2 text-amber-300/50">💡 提示模式</span>}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {hand.map(item => (
              <LetterBlock key={item.id} item={item} isHint={hintIds.has(item.id)} />
            ))}
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

      <footer className="flex flex-col items-center gap-2 w-full max-w-sm sm:max-w-lg">
        <p className="text-xs text-sky-200 text-center leading-relaxed">
          💡 合成英雄后点 ▶ 开战 &nbsp;|&nbsp; 双击格子退回手牌 &nbsp;|&nbsp; 同名英雄叠加升级 ⭐
        </p>
        <button onClick={handleReset} className="text-xs text-white/60 hover:text-white border border-white/20 hover:border-white/50 rounded-full px-5 py-1.5 transition-all">
          重新开始
        </button>
      </footer>

      {/* ── 弹窗层 ────────────────────────────────────────────── */}
      {showPicker && <DifficultyPicker value={selection} onChange={handleSelectionChange} onClose={() => setShowPicker(false)} />}

      {isShop && enrichedShopItems && (
        <WaveShop wave={loopState.wave} items={enrichedShopItems} onSelect={handleShopSelect} />
      )}

      {showBadges && <BadgeGallery onClose={() => setShowBadges(false)} />}

      {FEATURES.musicReward && musicSong && (
        <MusicReward song={musicSong} onClaim={handleMusicClaim} />
      )}

      {antiAdd.showWarn && (
        <AntiAddictionOverlay playMin={antiAdd.playMin} mode="warn" onContinue={antiAdd.dismissWarn} />
      )}
      {antiAdd.showBreak && (
        <AntiAddictionOverlay
          playMin={antiAdd.playMin}
          mode="break"
          onContinue={() => { antiAdd.dismissBreak(); if (isPaused) loop.resume() }}
        />
      )}

      {pendingToasts[0] && (
        <AchievementToast
          key={pendingToasts[0].id}
          achievement={pendingToasts[0]}
          onDismiss={() => setPendingToasts(p => p.slice(1))}
        />
      )}
    </div>
  )
}

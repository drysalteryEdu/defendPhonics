'use client'
import { useState } from 'react'
import { BOOK_UNITS, BOOK_INFO } from '../data/levels'

interface Props {
  value: Record<string, boolean>
  onChange: (selection: Record<string, boolean>) => void
  onClose: () => void
}

export default function DifficultyPicker({ value, onChange, onClose }: Props) {
  // null = 书目列表；number = 展示该册的单元
  const [activeBook, setActiveBook] = useState<number | null>(null)

  const getSelectedCount = (book: number) =>
    BOOK_UNITS.filter(u => u.book === book && value[`${book}-${u.unit}`]).length

  const totalSelected = Object.values(value).filter(Boolean).length

  function handleToggleUnit(book: number, unit: number) {
    const key = `${book}-${unit}`
    const next = { ...value, [key]: !value[key] }
    if (!Object.values(next).some(Boolean)) return   // 至少保留一个
    onChange(next)
  }

  function handleToggleBook(book: number) {
    const units = BOOK_UNITS.filter(u => u.book === book)
    const allOn = units.every(u => value[`${book}-${u.unit}`])
    const next = { ...value }
    units.forEach(u => { next[`${book}-${u.unit}`] = !allOn })
    if (!Object.values(next).some(Boolean)) return
    onChange(next)
  }

  // ── 第二级：某册的单元列表 ─────────────────────────────────────
  if (activeBook !== null) {
    const info    = BOOK_INFO[activeBook]
    const units   = BOOK_UNITS.filter(u => u.book === activeBook)
    const allOn   = units.every(u => value[`${activeBook}-${u.unit}`])
    const selCnt  = getSelectedCount(activeBook)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
        <div className="relative bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col max-h-[88vh]">

          {/* 顶部导航栏 */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setActiveBook(null)}
              className="text-slate-400 hover:text-white text-xl leading-none px-1"
            >
              ←
            </button>
            <span className="text-xl">{info.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white font-black text-sm truncate">{info.label}</div>
              <div className="text-slate-400 text-[10px]">{info.desc}</div>
            </div>
            <button
              onClick={() => handleToggleBook(activeBook)}
              className={`shrink-0 text-[11px] px-3 py-1.5 rounded-xl font-bold border transition-all ${
                allOn
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400'
              }`}
            >
              {allOn ? '全不选' : '全选'}
            </button>
          </div>

          {/* 单元列表 */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {units.map(unit => {
              const key       = `${activeBook}-${unit.unit}`
              const isChecked = !!value[key]
              return (
                <button
                  key={key}
                  onClick={() => handleToggleUnit(activeBook, unit.unit)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-2xl border transition-all active:scale-95 ${
                    isChecked
                      ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                      : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                  }`}
                >
                  <span className={`mt-0.5 text-base leading-none ${isChecked ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {isChecked ? '☑' : '☐'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm">{unit.label}: {unit.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{unit.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 底部 */}
          <div className="px-4 pb-5 pt-3 border-t border-slate-800 shrink-0">
            <div className="text-center text-xs text-slate-500 mb-3">
              已选 <span className="text-indigo-400 font-bold">{selCnt}</span> / {units.length} 个单元
            </div>
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black py-3 rounded-2xl transition-all"
            >
              确定 · 全局已选 {totalSelected} 单元
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 第一级：5 本书选择卡片 ────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col">

        <div className="px-5 pt-5 pb-3 text-center shrink-0">
          <h2 className="text-lg font-black text-white">选择词汇范围</h2>
          <p className="text-xs text-slate-400 mt-1">点击每册可细选单元 · 至少选一个</p>
        </div>

        {/* 5 本书卡片 */}
        <div className="px-4 pb-2 flex flex-col gap-2">
          {([1, 2, 3, 4, 5] as const).map(bookNum => {
            const info    = BOOK_INFO[bookNum]
            const total   = BOOK_UNITS.filter(u => u.book === bookNum).length
            const selCnt  = getSelectedCount(bookNum)
            const pct     = Math.round(selCnt / total * 100)

            return (
              <button
                key={bookNum}
                onClick={() => setActiveBook(bookNum)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700/60 active:scale-95 transition-all text-left"
              >
                <span className="text-2xl shrink-0">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm leading-tight">{info.label}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{info.desc}</div>
                  {/* 进度条 */}
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-sm font-black ${selCnt > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>
                    {selCnt}/{total}
                  </div>
                  <div className="text-slate-600 text-[10px]">单元</div>
                </div>
                <span className="text-slate-600 text-sm">›</span>
              </button>
            )
          })}
        </div>

        {/* 底部确认 */}
        <div className="px-4 pb-5 pt-3 border-t border-slate-800 mt-2">
          {totalSelected === 0 && (
            <p className="text-center text-amber-400 text-xs mb-2 font-bold">⚠️ 请至少选择一个单元</p>
          )}
          <button
            onClick={totalSelected > 0 ? onClose : undefined}
            disabled={totalSelected === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-white font-black py-3 rounded-2xl transition-all"
          >
            确定 · 已选 {totalSelected} 单元
          </button>
        </div>
      </div>
    </div>
  )
}

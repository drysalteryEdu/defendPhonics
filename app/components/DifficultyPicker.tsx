'use client'
import { useState } from 'react'
import { BOOK_UNITS, BOOK_INFO } from '../data/levels'

interface Props {
  value: Record<string, boolean>
  onChange: (selection: Record<string, boolean>) => void
  onClose: () => void
}

export default function DifficultyPicker({ value, onChange, onClose }: Props) {
  // Track which books are expanded
  const [expandedBooks, setExpandedBooks] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: false
  })

  // Helper to count selected units in a book
  const getSelectedCount = (book: number) => {
    return BOOK_UNITS.filter(u => u.book === book).filter(u => value[`${book}-${u.unit}`]).length
  }

  // Toggle expand state for a book
  const toggleExpand = (book: number) => {
    setExpandedBooks(prev => ({ ...prev, [book]: !prev[book] }))
  }

  // Toggle single unit selection
  const handleToggleUnit = (book: number, unit: number) => {
    const key = `${book}-${unit}`
    const newValue = { ...value, [key]: !value[key] }
    
    // Ensure at least one unit is selected globally
    const selectedCount = Object.values(newValue).filter(Boolean).length
    if (selectedCount === 0) {
      alert('⚠️ 至少需要选择一个单元来进行游戏！')
      return
    }
    onChange(newValue)
  }

  // Select/Deselect all units in a book
  const handleToggleBook = (book: number) => {
    const bookUnits = BOOK_UNITS.filter(u => u.book === book)
    const allSelected = bookUnits.every(u => value[`${book}-${u.unit}`])
    
    const newValue = { ...value }
    bookUnits.forEach(u => {
      newValue[`${book}-${u.unit}`] = !allSelected
    })

    // Ensure at least one unit remains selected
    const selectedCount = Object.values(newValue).filter(Boolean).length
    if (selectedCount === 0) {
      alert('⚠️ 至少需要选择一个单元来进行游戏！')
      return
    }
    onChange(newValue)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        <h2 className="text-xl font-black text-center text-white mb-1">自定义词汇与单元选择</h2>
        <p className="text-xs text-center text-slate-400 mb-4">
          细化选择具体册数的单元，可自由组合搭配
        </p>

        {/* Scrollable list of Books */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {([1, 2, 3, 4, 5] as number[]).map(bookNum => {
            const info = BOOK_INFO[bookNum]
            const isExpanded = expandedBooks[bookNum]
            const selectedCount = getSelectedCount(bookNum)
            const totalUnits = BOOK_UNITS.filter(u => u.book === bookNum).length
            const isAllSelected = selectedCount === totalUnits

            return (
              <div 
                key={bookNum}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all"
              >
                {/* Book Header */}
                <div 
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-slate-850 transition-colors`}
                  onClick={() => toggleExpand(bookNum)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.emoji}</span>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {info.label}
                        <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-1.5 py-0.5 rounded-full">
                          {selectedCount}/{totalUnits} 单元
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{info.desc}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleBook(bookNum)}
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all border ${
                        isAllSelected 
                          ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600' 
                          : 'bg-emerald-600/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/50'
                      }`}
                    >
                      {isAllSelected ? '取消全选' : '全选'}
                    </button>
                    <span className={`text-slate-400 font-mono transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </div>
                </div>

                {/* Units List (Accordion Body) */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-900/40 grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto">
                    {BOOK_UNITS.filter(u => u.book === bookNum).map(unit => {
                      const unitKey = `${bookNum}-${unit.unit}`
                      const isSelected = !!value[unitKey]

                      return (
                        <label 
                          key={unitKey}
                          className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-slate-800 border-slate-600 text-white shadow-inner' 
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleUnit(bookNum, unit.unit)}
                            className="mt-1 rounded border-slate-700 text-indigo-600 focus:ring-indigo-650 bg-slate-900"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-slate-200 flex justify-between">
                              <span>{unit.label}: {unit.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">{unit.desc}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-lg transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

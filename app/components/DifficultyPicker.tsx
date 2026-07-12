'use client'
import type { LevelRange } from '../data/levels'
import { LEVEL_INFO } from '../data/levels'

interface Props {
  value: LevelRange
  onChange: (level: LevelRange) => void
  onClose: () => void
}

export default function DifficultyPicker({ value, onChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-black text-center text-gray-800 mb-1">选择词汇范围</h2>
        <p className="text-xs text-center text-gray-400 mb-5">
          选择越高，字母池越丰富，难度越大
        </p>

        <div className="flex flex-col gap-3">
          {([1, 2, 3, 4, 5] as LevelRange[]).map(lv => {
            const info = LEVEL_INFO[lv]
            const isSelected = value === lv
            return (
              <button
                key={lv}
                onClick={() => { onChange(lv); onClose() }}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all',
                  isSelected
                    ? `${info.color} border-transparent text-white shadow-lg scale-[1.02]`
                    : 'border-gray-200 hover:border-gray-300 text-gray-800',
                ].join(' ')}
              >
                <span className="text-2xl">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm">{info.label}</div>
                  <div className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {info.desc}
                  </div>
                </div>
                {isSelected && <span className="text-lg">✓</span>}
              </button>
            )
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  )
}

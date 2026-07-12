'use client'
import { ACHIEVEMENTS, getAchState } from '../data/achievements'

interface Props {
  onClose: () => void
}

export default function BadgeGallery({ onClose }: Props) {
  const { unlocked, heroCount } = getAchState()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-black text-center text-gray-800 mb-1">功勋徽章</h2>
        <p className="text-xs text-center text-gray-400 mb-4">
          已解锁 {unlocked.length} / {ACHIEVEMENTS.length} &nbsp;·&nbsp; 累计合成 {heroCount} 英雄
        </p>
        <div className="grid grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlocked.includes(ach.id)
            return (
              <div
                key={ach.id}
                title={isUnlocked ? ach.desc : '尚未解锁'}
                className={[
                  'flex flex-col items-center gap-1 p-2 rounded-2xl text-center transition-all',
                  isUnlocked ? 'bg-amber-50 border-2 border-amber-300' : 'bg-gray-100 border-2 border-transparent opacity-40',
                ].join(' ')}
              >
                <span className="text-2xl">{isUnlocked ? ach.emoji : '🔒'}</span>
                <span className="text-[10px] font-bold text-gray-700 leading-tight">{ach.name}</span>
              </div>
            )
          })}
        </div>
        {unlocked.length > 0 && (
          <div className="mt-4 space-y-1">
            {ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).map(ach => (
              <div key={ach.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span>{ach.emoji}</span>
                <span className="font-bold">{ach.name}</span>
                <span className="text-gray-400">— {ach.desc}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  )
}

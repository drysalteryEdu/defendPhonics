'use client'
import { useEffect } from 'react'
import type { Achievement } from '../data/achievements'

interface Props {
  achievement: Achievement
  onDismiss: () => void
}

export default function AchievementToast({ achievement, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-amber-400 text-amber-900 rounded-2xl px-4 py-3 shadow-2xl min-w-[200px] max-w-xs cursor-pointer"
      onClick={onDismiss}
      style={{ animation: 'slideDown 0.3s ease-out' }}
    >
      <span className="text-3xl shrink-0">{achievement.emoji}</span>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">🏆 功勋解锁</div>
        <div className="font-black text-sm leading-tight">{achievement.name}</div>
        <div className="text-[11px] opacity-80 leading-tight mt-0.5">{achievement.desc}</div>
      </div>
    </div>
  )
}

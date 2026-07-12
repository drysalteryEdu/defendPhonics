'use client'
import { useState, useEffect } from 'react'
import type { ShopItem } from '../data/shopItems'

interface Props {
  wave: number
  items: ShopItem[]
  onSelect: (item: ShopItem) => void
}

export default function WaveShop({ wave, items, onSelect }: Props) {
  const [picked, setPicked]       = useState<string | null>(null)
  const [showItems, setShowItems] = useState(false)

  // Celebrate for 1s before revealing the shop
  useEffect(() => {
    const t = setTimeout(() => setShowItems(true), 1000)
    return () => clearTimeout(t)
  }, [])

  function handlePick(item: ShopItem) {
    if (picked) return
    setPicked(item.id)
    setTimeout(() => onSelect(item), 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-indigo-800 to-purple-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl w-full max-w-xs mx-4">
        {!showItems ? (
          // ── Celebration screen ────────────────────────────────
          <div className="flex flex-col items-center py-8 gap-3" style={{ animation: 'slideDown 0.4s ease-out' }}>
            <div className="text-6xl">🎉</div>
            <h2 className="text-white text-2xl font-black tracking-wide">第 {wave} 波通过！</h2>
            <div className="flex gap-1 text-2xl">
              {Array.from({ length: Math.min(wave, 5) }, (_, i) => (
                <span key={i} style={{ animation: `slideDown 0.3s ease-out ${i * 0.12}s both` }}>⭐</span>
              ))}
            </div>
            <p className="text-purple-300 text-sm mt-2">准备好道具强化防线…</p>
          </div>
        ) : (
          // ── Item picker ────────────────────────────────────────
          <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-1">🎁</div>
              <h2 className="text-white text-lg font-black">选择一个道具</h2>
              <p className="text-purple-300 text-xs mt-1">强化防线，迎接下一波挑战</p>
            </div>
            {/* 3件以下用竖排，4件以上用 2×2 宫格 */}
            <div className={items.length >= 4 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2.5'}>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => handlePick(item)}
                  disabled={picked !== null}
                  data-testid={`shop-item-${item.id}`}
                  className={[
                    items.length >= 4
                      ? 'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all'
                      : 'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left',
                    picked === item.id
                      ? 'border-amber-400 bg-amber-400/20 scale-105'
                      : picked !== null
                      ? 'border-white/10 bg-white/5 opacity-40 cursor-default'
                      : 'border-white/20 bg-white/10 hover:border-amber-300 hover:bg-amber-300/10 active:scale-95 cursor-pointer',
                  ].join(' ')}
                >
                  {items.length >= 4 ? (
                    // 宫格模式：竖排紧凑
                    <>
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="text-white font-bold text-[11px] text-center leading-tight">{item.label}</div>
                      <div className="text-purple-300 text-[9px] text-center leading-tight">{item.desc}</div>
                    </>
                  ) : (
                    // 列表模式：横排
                    <>
                      <span className="text-3xl shrink-0">{item.emoji}</span>
                      <div>
                        <div className="text-white font-bold text-sm">{item.label}</div>
                        <div className="text-purple-300 text-[11px] leading-tight mt-0.5">{item.desc}</div>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

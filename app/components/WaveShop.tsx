'use client'
import { useState } from 'react'
import type { ShopItem } from '../data/shopItems'

interface Props {
  wave: number
  items: ShopItem[]
  onSelect: (item: ShopItem) => void
}

export default function WaveShop({ wave, items, onSelect }: Props) {
  const [picked, setPicked] = useState<string | null>(null)

  function handlePick(item: ShopItem) {
    if (picked) return
    setPicked(item.id)
    setTimeout(() => onSelect(item), 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-indigo-800 to-purple-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl w-full max-w-xs mx-4">
        <div className="text-center mb-5">
          <div className="text-4xl mb-1">🎉</div>
          <h2 className="text-white text-lg font-black">第 {wave} 波通过！</h2>
          <p className="text-purple-300 text-xs mt-1">选择一个道具强化防线</p>
        </div>
        <div className="flex flex-col gap-2.5">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handlePick(item)}
              disabled={picked !== null}
              data-testid={`shop-item-${item.id}`}
              className={[
                'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left',
                picked === item.id
                  ? 'border-amber-400 bg-amber-400/20 scale-105'
                  : picked !== null
                  ? 'border-white/10 bg-white/5 opacity-40 cursor-default'
                  : 'border-white/20 bg-white/10 hover:border-amber-300 hover:bg-amber-300/10 active:scale-95 cursor-pointer',
              ].join(' ')}
            >
              <span className="text-3xl shrink-0">{item.emoji}</span>
              <div>
                <div className="text-white font-bold text-sm">{item.label}</div>
                <div className="text-purple-300 text-[11px] leading-tight mt-0.5">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

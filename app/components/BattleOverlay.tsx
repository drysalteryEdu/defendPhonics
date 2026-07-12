'use client'
import type { Enemy, Bullet, GameLoopState } from '../types'

interface Props {
  loop: GameLoopState
}

const ROW_TOPS = ['8%', '40%', '72%']   // 3 行的垂直中心百分比

// HP 颜色
function hpColor(hp: number, max: number) {
  const ratio = hp / max
  if (ratio > 0.6) return 'bg-green-400'
  if (ratio > 0.3) return 'bg-yellow-400'
  return 'bg-red-400'
}

export default function BattleOverlay({ loop }: Props) {
  const { enemies, bullets, baseHp, wave, phase } = loop
  const isOver = phase === 'over'

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">

      {/* 基地血量 */}
      <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col items-center justify-center gap-1 bg-black/20 rounded-l-2xl">
        <span className="text-white text-[9px] font-bold" style={{ writingMode: 'vertical-rl' }}>基地</span>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-sm transition-colors ${i < baseHp ? 'bg-green-400' : 'bg-gray-600'}`}
          />
        ))}
      </div>

      {/* 波次 / 状态 */}
      <div className="absolute top-1 right-2 text-white/70 text-[10px] font-bold">
        Wave {wave + 1}
      </div>

      {/* 敌人 */}
      {enemies.map(e => (
        <div
          key={e.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
          style={{ left: `${e.x}%`, top: ROW_TOPS[e.row] }}
        >
          <span className="text-2xl leading-none">👾</span>
          {/* HP 条 */}
          <div className="w-6 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${hpColor(e.hp, e.maxHp)}`}
              style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
            />
          </div>
        </div>
      ))}

      {/* 子弹 */}
      {bullets.map(b => (
        <div
          key={b.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 text-lg leading-none"
          style={{ left: `${b.x}%`, top: ROW_TOPS[b.row] }}
        >
          🐟
        </div>
      ))}

      {/* 游戏结束 */}
      {isOver && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 rounded-2xl">
          <span className="text-5xl">💀</span>
          <p className="text-white text-2xl font-black">基地沦陷！</p>
          <p className="text-white/60 text-sm">Wave {wave} · 点击"重新开始"再战</p>
        </div>
      )}
    </div>
  )
}

'use client'

interface Props {
  playMin: number
  mode: 'warn' | 'break'
  onContinue: () => void
}

const BREAK_TIPS = [
  '👀 眼睛要休息一下哦，看看远处的绿色植物吧！',
  '🧘 做几次深呼吸，活动一下手和脖子吧！',
  '💧 去喝杯水，补充水分对大脑有好处！',
  '🌤️ 出去走走，晒晒太阳更健康！',
]

export default function AntiAddictionOverlay({ playMin, mode, onContinue }: Props) {
  const tip = BREAK_TIPS[playMin % BREAK_TIPS.length]

  if (mode === 'warn') {
    // 非阻塞横幅：固定在顶部，不挡游戏
    return (
      <div
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[65] flex items-center gap-3 bg-orange-400 text-orange-950 rounded-2xl px-4 py-2.5 shadow-2xl max-w-xs w-[90%]"
        style={{ animation: 'slideDown 0.3s ease-out' }}
      >
        <span className="text-2xl shrink-0">⏱️</span>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm">已玩 {playMin} 分钟啦！</div>
          <div className="text-[11px] opacity-80 leading-tight">适当休息，保护眼睛哦 👀</div>
        </div>
        <button
          onClick={onContinue}
          className="shrink-0 text-xs font-bold bg-orange-200 hover:bg-orange-100 px-2.5 py-1 rounded-xl transition-all"
        >
          知道了
        </button>
      </div>
    )
  }

  // 阻塞全屏：建议休息
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-indigo-950/90 backdrop-blur-md p-4">
      <div
        className="bg-gradient-to-b from-indigo-800 to-purple-900 rounded-3xl p-7 shadow-2xl w-full max-w-xs text-center"
        style={{ animation: 'slideDown 0.4s ease-out' }}
      >
        <div className="text-6xl mb-3">😴</div>
        <h2 className="text-white text-xl font-black mb-1">休息一下吧！</h2>
        <p className="text-purple-200 text-sm mb-2">你已经玩了 <span className="text-amber-300 font-black">{playMin} 分钟</span> 了</p>
        <div className="bg-white/10 rounded-2xl p-3 mb-5 text-purple-200 text-xs leading-relaxed">
          {tip}
        </div>
        <button
          onClick={onContinue}
          className="w-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm py-3 rounded-2xl transition-all mb-2"
        >
          好的，再玩 5 分钟 ▶
        </button>
        <p className="text-purple-400 text-[10px]">家长可关闭标签页来强制休息</p>
      </div>
    </div>
  )
}

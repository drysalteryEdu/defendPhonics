'use client'
import { useState, useEffect, useRef } from 'react'
import { FEATURES } from '../config/features'

export interface AntiAddictionState {
  playMin: number
  showWarn: boolean   // 非阻塞提示条
  showBreak: boolean  // 阻塞建议休息页
  dismissWarn: () => void
  dismissBreak: () => void
}

export function useAntiAddiction(isPlaying: boolean): AntiAddictionState {
  const [playMs, setPlayMs]           = useState(0)
  const [warnDismissed, setWarnDismissed] = useState(false)
  const breakDismissAtRef = useRef(-1)  // 上次关闭 break 时的 playMin

  // 只在 playing 状态下累加时间
  useEffect(() => {
    if (!FEATURES.antiAddiction || !isPlaying) return
    const iv = setInterval(() => setPlayMs(ms => ms + 1000), 1000)
    return () => clearInterval(iv)
  }, [isPlaying])

  const playMin  = Math.floor(playMs / 60000)
  const warnMin  = FEATURES.antiAddictionWarnMin
  const breakMin = FEATURES.antiAddictionBreakMin

  // 达到 breakMin 后，每 5 分钟重新提示一次
  const showBreak = FEATURES.antiAddiction &&
    playMin >= breakMin &&
    playMin >= breakDismissAtRef.current + 5

  const showWarn = FEATURES.antiAddiction &&
    !showBreak &&
    playMin >= warnMin &&
    !warnDismissed

  return {
    playMin,
    showWarn,
    showBreak,
    dismissWarn:  () => setWarnDismissed(true),
    dismissBreak: () => { breakDismissAtRef.current = playMin },
  }
}

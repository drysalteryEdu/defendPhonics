// 音效模块 — Web Audio API MIDI合成
//
// 扩展说明：
//   后续替换真实音频时，只需修改各 export function 内部实现。
//   例：将 playMidi(...) 替换为 new Audio('/sounds/synthesis.mp3').play()
//   预留音频文件路径常量以便搜索替换。
//
// const SOUND_SYNTHESIS = '/sounds/synthesis.mp3'  // TODO: 替换为真实音频
// const SOUND_PLACE     = '/sounds/place.mp3'
// const SOUND_RETURN    = '/sounds/return.mp3'

let _ctx: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!_ctx) _ctx = new AudioContext()
  // 部分浏览器需要用户交互后才能播放
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function note(
  freq: number,
  startSec: number,
  durationSec: number,
  type: OscillatorType = 'triangle',
  gain = 0.3,
) {
  const ac = ctx()
  if (!ac) return
  const osc = ac.createOscillator()
  const g   = ac.createGain()
  osc.connect(g)
  g.connect(ac.destination)
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime + startSec)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + startSec + durationSec)
  osc.start(ac.currentTime + startSec)
  osc.stop(ac.currentTime + startSec + durationSec + 0.05)
}

// ── 合成英雄成功：C5-E5-G5 上升大三和弦，清亮 ──
export function playSynthesis() {
  note(523.25, 0.00, 0.35, 'triangle', 0.40)  // C5
  note(659.25, 0.08, 0.35, 'triangle', 0.35)  // E5
  note(783.99, 0.16, 0.55, 'triangle', 0.30)  // G5
}

// ── 放置字母：轻点击感 ──
export function playPlace() {
  note(440, 0, 0.12, 'sine', 0.18)
}

// ── 退回手牌：下滑短音 ──
export function playReturn() {
  note(330, 0, 0.10, 'sine', 0.15)
}

// ── 无效合成：低沉短振 ──
export function playInvalid() {
  note(180, 0, 0.15, 'square', 0.12)
}

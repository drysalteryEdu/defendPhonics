// 自然拼读语音合成 — 基于 Web Speech API
// 移动端兼容要点：
//   1. onend 链式调用（避免 Android 队列静默丢弃）
//   2. cancel() 后延 50ms 再 speak（修复 iOS cancel 未完成即 speak 的 bug）
//   3. 显式选英文音色（修复 MIUI/小米浏览器用中文声道问题）

const ONSET_PHONETIC: Record<string, string> = {
  a:'ah', b:'buh', c:'cuh', d:'duh', e:'eh', f:'fuh', g:'guh', h:'huh', i:'ih',
  j:'juh', k:'cuh', l:'uhl', m:'muh', n:'nuh', o:'ah', p:'puh', q:'quh', r:'ruh',
  s:'ss', t:'tuh', u:'uh', v:'vuh', w:'wuh', x:'ks', y:'yuh', z:'zuh',
  sh:'shh', ch:'chuh', th:'thuh', wh:'wuh', ph:'fuh',
  bl:'bluh', cl:'cluh', fl:'fluh', gl:'gluh', pl:'pluh', sl:'sluh',
  br:'bruh', cr:'cruh', fr:'fruh', gr:'gruh', pr:'pruh', tr:'truh',
  sm:'smuh', sn:'snuh', sp:'spuh', st:'stuh', sw:'swuh',
  ck:'cuh', ng:'ing', nk:'ink', qu:'quw',
}

const RIME_PHONETIC: Record<string, string> = {
  '-am':'am', '-an':'an', '-at':'at', '-ad':'ad', '-ag':'ag', '-ap':'ap',
  '-ed':'ed', '-eg':'egg', '-en':'en', '-et':'et',
  '-ig':'ig', '-in':'in', '-ip':'ip', '-it':'it',
  '-og':'og', '-op':'op', '-ot':'ot', '-ox':'ox',
  '-ub':'ub', '-ug':'ug', '-up':'up', '-ut':'ut',
  'a_e':'ay', 'i_e':'eye', 'o_e':'oh', 'u_e':'yoo',
  '-ee':'ee', '-ea':'ee', '-ai':'ay', '-ay':'ay',
  '-oa':'oh', '-ow':'oh', '-igh':'eye', '-y':'eye',
  '-ar':'ar', '-er':'er', '-ir':'er', '-or':'or', '-ur':'er',
  '-oy':'oy', '-oi':'oy', '-oo':'oo', '-aw':'aw',
  '-all':'all', '-air':'air', '-ear':'ear',
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** 选英文声道——修复 MIUI 默认用中文发音的问题 */
function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang === 'en-US') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  )
}

function mkUtterance(text: string, rate: number, pitch: number): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = rate
  u.pitch = pitch
  const voice = pickEnglishVoice()
  if (voice) u.voice = voice
  return u
}

/** 链式播放——onend 驱动，避免 Android 同时入队被静默丢弃 */
function speakChain(synth: SpeechSynthesis, utterances: SpeechSynthesisUtterance[]) {
  if (!utterances.length) return
  const [head, ...tail] = utterances
  if (tail.length) head.onend = () => speakChain(synth, tail)
  synth.speak(head)
}

/**
 * 自然拼读三段式发音：Onset → Rime → 完整词
 * 例：c + -an → "cuh … an … can"
 */
export function speakPhonics(onset: string, rime: string, word: string) {
  if (!isSpeechSupported()) return
  const synth = window.speechSynthesis

  const onsetSound = ONSET_PHONETIC[onset.toLowerCase()] ?? onset
  const rimeSound  = RIME_PHONETIC[rime] ?? rime.replace('-', '').replace('_e', '')

  const utterances = [
    mkUtterance(onsetSound, 0.75, 1.1),
    mkUtterance(rimeSound,  0.75, 1.1),
    mkUtterance(word,       0.70, 1.0),
  ]

  synth.cancel()
  // iOS：cancel() 是异步完成的，延 50ms 后再 speak 否则第一句被吞
  setTimeout(() => speakChain(synth, utterances), 50)
}

/**
 * 单字母发音：字母名 → 拼读音
 * 例：c → "see … cuh"
 */
export function speakLetter(letter: string) {
  if (!isSpeechSupported()) return
  const synth = window.speechSynthesis

  const phonetic = ONSET_PHONETIC[letter.toLowerCase()] ?? letter
  const utterances = [
    mkUtterance(letter,   0.80, 1.1),
    mkUtterance(phonetic, 0.75, 1.0),
  ]

  synth.cancel()
  setTimeout(() => speakChain(synth, utterances), 50)
}

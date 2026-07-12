// Onset / Consonant Blend phonetic approximations for browser TTS
const ONSET_PHONETIC: Record<string, string> = {
  a: 'ah', b: 'buh', c: 'cuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh', i: 'ih',
  j: 'juh', k: 'cuh', l: 'uhl', m: 'muh', n: 'nuh', o: 'ah', p: 'puh', q: 'quh', r: 'ruh',
  s: 'ss', t: 'tuh', u: 'uh', v: 'vuh', w: 'wuh', x: 'ks', y: 'yuh', z: 'zuh',
  sh: 'shh', ch: 'chuh', th: 'thuh', wh: 'wuh', ph: 'fuh',
  bl: 'bluh', cl: 'cluh', fl: 'fluh', gl: 'gluh', pl: 'pluh', sl: 'sluh',
  br: 'bruh', cr: 'cruh', fr: 'fruh', gr: 'gruh', pr: 'pruh', tr: 'truh',
  sm: 'smuh', sn: 'snuh', sp: 'spuh', st: 'stuh', sw: 'swuh',
  ck: 'cuh', ng: 'ing', nk: 'ink', qu: 'quw'
}

// Rime / Vowel Block phonetic approximations for browser TTS
const RIME_PHONETIC: Record<string, string> = {
  // Short Vowels
  '-am': 'am', '-an': 'an', '-at': 'at', '-ad': 'ad', '-ag': 'ag', '-ap': 'ap',
  '-ed': 'ed', '-eg': 'egg', '-en': 'en', '-et': 'et',
  '-ig': 'ig', '-in': 'in', '-ip': 'ip', '-it': 'it',
  '-og': 'og', '-op': 'op', '-ot': 'ot', '-ox': 'ox',
  '-ub': 'ub', '-ug': 'ug', '-up': 'up', '-ut': 'ut',
  // Long Vowels
  'a_e': 'ay', 'i_e': 'eye', 'o_e': 'oh', 'u_e': 'yoo',
  '-ee': 'ee', '-ea': 'ee', '-ai': 'ay', '-ay': 'ay', '-oa': 'oh', '-ow': 'oh', '-igh': 'eye', '-y': 'eye',
  // Book 5
  '-ar': 'ar', '-er': 'er', '-ir': 'er', '-or': 'or', '-ur': 'er',
  '-oy': 'oy', '-oi': 'oy', '-oo': 'oo', '-aw': 'aw',
  '-all': 'all', '-air': 'air', '-ear': 'ear'
}

/**
 * Pronounces a synthesized word by breaking it down: onset sound + rime sound -> full word
 */
export function speakPhonics(onset: string, rime: string, word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Cancel any ongoing speech to avoid overlapping
  window.speechSynthesis.cancel()

  const onsetSound = ONSET_PHONETIC[onset.toLowerCase()] || onset
  const rimeSound = RIME_PHONETIC[rime] || rime.replace('-', '').replace('_', '')

  // Step 1: Onset sound
  const u1 = new SpeechSynthesisUtterance(onsetSound)
  u1.lang = 'en-US'
  u1.rate = 0.75
  u1.pitch = 1.1

  // Step 2: Rime sound
  const u2 = new SpeechSynthesisUtterance(rimeSound)
  u2.lang = 'en-US'
  u2.rate = 0.75
  u2.pitch = 1.1

  // Step 3: Full word
  const u3 = new SpeechSynthesisUtterance(word)
  u3.lang = 'en-US'
  u3.rate = 0.70
  u3.pitch = 1.0

  window.speechSynthesis.speak(u1)
  window.speechSynthesis.speak(u2)
  window.speechSynthesis.speak(u3)
}

/**
 * Pronounces a single letter name and then its phonetic sound
 */
export function speakLetter(letter: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()

  const onsetSound = ONSET_PHONETIC[letter.toLowerCase()] || letter

  // Step 1: Letter Name
  const u1 = new SpeechSynthesisUtterance(letter)
  u1.lang = 'en-US'
  u1.rate = 0.75

  // Step 2: Phonetic Sound
  const u2 = new SpeechSynthesisUtterance(onsetSound)
  u2.lang = 'en-US'
  u2.rate = 0.8

  window.speechSynthesis.speak(u1)
  window.speechSynthesis.speak(u2)
}

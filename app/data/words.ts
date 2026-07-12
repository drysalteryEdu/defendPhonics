// 合成字典：letter + rime → word + emoji
// 数据来源：牛津自然拼读 Level 2 (Short Vowels CVC)
// key 格式：letter+rime （字母块值 + '+' + 词根块值）
const SYNTHESIS_MAP: Record<string, { word: string; emoji: string }> = {
  // -am family (Level 2 Unit 1)
  'j+-am': { word: 'jam', emoji: '🍓' },
  'r+-am': { word: 'ram', emoji: '🐏' },
  'y+-am': { word: 'yam', emoji: '🍠' },
  'd+-am': { word: 'dam', emoji: '🌊' },
  // -an family (Level 2 Unit 1)
  'c+-an': { word: 'can', emoji: '🥫' },
  'f+-an': { word: 'fan', emoji: '🌀' },
  'm+-an': { word: 'man', emoji: '🧑' },
  'p+-an': { word: 'pan', emoji: '🍳' },
  // -ad family (Level 2 Unit 2)
  'd+-ad': { word: 'dad', emoji: '👨' },
  's+-ad': { word: 'sad', emoji: '😢' },
  // -ag family (Level 2 Unit 2)
  'b+-ag': { word: 'bag', emoji: '👜' },
  'r+-ag': { word: 'rag', emoji: '🧹' },
  't+-ag': { word: 'tag', emoji: '🏷️' },
  // -ap family (Level 2 Unit 2)
  'c+-ap': { word: 'cap', emoji: '🧢' },
  'm+-ap': { word: 'map', emoji: '🗺️' },
  'n+-ap': { word: 'nap', emoji: '😴' },
  // -at family (Level 2 Unit 2) ★ 核心
  'b+-at': { word: 'bat', emoji: '🦇' },
  'c+-at': { word: 'cat', emoji: '🐱' },
  'h+-at': { word: 'hat', emoji: '🎩' },
  'm+-at': { word: 'mat', emoji: '🟫' },
  'r+-at': { word: 'rat', emoji: '🐀' },
  's+-at': { word: 'sat', emoji: '🪑' },
  // -ed family (Level 2 Unit 3)
  'b+-ed': { word: 'bed', emoji: '🛏️' },
  'r+-ed': { word: 'red', emoji: '🔴' },
  'l+-ed': { word: 'led', emoji: '💡' },
  // -eg family (Level 2 Unit 3)
  'l+-eg': { word: 'leg', emoji: '🦵' },
  'p+-eg': { word: 'peg', emoji: '📌' },
  // -en family (Level 2 Unit 3) ★
  'h+-en': { word: 'hen', emoji: '🐔' },
  'p+-en': { word: 'pen', emoji: '🖊️' },
  't+-en': { word: 'ten', emoji: '🔟' },
  'd+-en': { word: 'den', emoji: '🏡' },
  // -et family (Level 2 Unit 3)
  'n+-et': { word: 'net', emoji: '🥅' },
  'p+-et': { word: 'pet', emoji: '🐾' },
  'w+-et': { word: 'wet', emoji: '💧' },
  'j+-et': { word: 'jet', emoji: '✈️' },
  // -ig family (Level 2 Unit 4) ★
  'd+-ig': { word: 'dig', emoji: '⛏️' },
  'p+-ig': { word: 'pig', emoji: '🐷' },
  'w+-ig': { word: 'wig', emoji: '👱' },
  'b+-ig': { word: 'big', emoji: '🏔️' },
  'j+-ig': { word: 'jig', emoji: '💃' },
  // -in family (Level 2 Unit 4)
  'b+-in': { word: 'bin', emoji: '🗑️' },
  'f+-in': { word: 'fin', emoji: '🐟' },
  'p+-in': { word: 'pin', emoji: '📍' },
  'w+-in': { word: 'win', emoji: '🏆' },
  // -ip family (Level 2 Unit 4)
  'd+-ip': { word: 'dip', emoji: '🥣' },
  'l+-ip': { word: 'lip', emoji: '💋' },
  'z+-ip': { word: 'zip', emoji: '🤐' },
  't+-ip': { word: 'tip', emoji: '💡' },
  // -it family (Level 2 Unit 4)
  'h+-it': { word: 'hit', emoji: '⚾' },
  'p+-it': { word: 'pit', emoji: '🕳️' },
  's+-it': { word: 'sit', emoji: '🪑' },
  'b+-it': { word: 'bit', emoji: '🔩' },
  // -og family (Level 2 Unit 5) ★
  'd+-og': { word: 'dog', emoji: '🐶' },
  'j+-og': { word: 'jog', emoji: '🏃' },
  'l+-og': { word: 'log', emoji: '🪵' },
  'h+-og': { word: 'hog', emoji: '🐗' },
  // -op family (Level 2 Unit 5)
  'h+-op': { word: 'hop', emoji: '🐰' },
  'm+-op': { word: 'mop', emoji: '🧹' },
  'p+-op': { word: 'pop', emoji: '🎈' },
  't+-op': { word: 'top', emoji: '🔝' },
  // -ot family (Level 2 Unit 5)
  'd+-ot': { word: 'dot', emoji: '⚫' },
  'h+-ot': { word: 'hot', emoji: '🔥' },
  'p+-ot': { word: 'pot', emoji: '🪴' },
  'n+-ot': { word: 'not', emoji: '🚫' },
  // -ox family (Level 2 Unit 5)
  'b+-ox': { word: 'box', emoji: '📦' },
  'f+-ox': { word: 'fox', emoji: '🦊' },
  // -ub family (Level 2 Unit 6)
  'c+-ub': { word: 'cub', emoji: '🐻' },
  't+-ub': { word: 'tub', emoji: '🛁' },
  's+-ub': { word: 'sub', emoji: '🚢' },
  'r+-ub': { word: 'rub', emoji: '🖐️' },
  // -ug family (Level 2 Unit 6) ★
  'b+-ug': { word: 'bug', emoji: '🐛' },
  'm+-ug': { word: 'mug', emoji: '☕' },
  'r+-ug': { word: 'rug', emoji: '🪆' },
  'h+-ug': { word: 'hug', emoji: '🤗' },
  'j+-ug': { word: 'jug', emoji: '🏺' },
  't+-ug': { word: 'tug', emoji: '⚓' },
  // -up family (Level 2 Unit 6)
  'c+-up': { word: 'cup', emoji: '🥤' },
  'p+-up': { word: 'pup', emoji: '🐶' },
  // -ut family (Level 2 Unit 6)
  'c+-ut': { word: 'cut', emoji: '✂️' },
  'h+-ut': { word: 'hut', emoji: '🏚️' },
  'n+-ut': { word: 'nut', emoji: '🥜' },
  'b+-ut': { word: 'but', emoji: '↩️' },
}

export function lookupSynthesis(valA: string, valB: string) {
  const isRimeA = valA.startsWith('-')
  const letter = isRimeA ? valB : valA
  const rime = isRimeA ? valA : valB
  if (!rime.startsWith('-')) return null
  return SYNTHESIS_MAP[`${letter}+${rime}`] ?? null
}

// 合成字典：letter + rime → word + emoji
// key 格式：letter+rime （字母块值 + '+' + 词根块值，词根必须以 '-' 开头）
const SYNTHESIS_MAP: Record<string, { word: string; emoji: string }> = {
  // ── Level 2: Short Vowels CVC ────────────────────────────────────
  // -am family
  'j+-am': { word: 'jam',  emoji: '🍓' },
  'r+-am': { word: 'ram',  emoji: '🐏' },
  'y+-am': { word: 'yam',  emoji: '🍠' },
  'd+-am': { word: 'dam',  emoji: '🌊' },
  // -an family
  'c+-an': { word: 'can',  emoji: '🥫' },
  'f+-an': { word: 'fan',  emoji: '🌀' },
  'm+-an': { word: 'man',  emoji: '🧑' },
  'p+-an': { word: 'pan',  emoji: '🍳' },
  // -ad family
  'd+-ad': { word: 'dad',  emoji: '👨' },
  's+-ad': { word: 'sad',  emoji: '😢' },
  // -ag family
  'b+-ag': { word: 'bag',  emoji: '👜' },
  'r+-ag': { word: 'rag',  emoji: '🧹' },
  't+-ag': { word: 'tag',  emoji: '🏷️' },
  // -ap family
  'c+-ap': { word: 'cap',  emoji: '🧢' },
  'm+-ap': { word: 'map',  emoji: '🗺️' },
  'n+-ap': { word: 'nap',  emoji: '😴' },
  // -at family ★
  'b+-at': { word: 'bat',  emoji: '🦇' },
  'c+-at': { word: 'cat',  emoji: '🐱' },
  'h+-at': { word: 'hat',  emoji: '🎩' },
  'm+-at': { word: 'mat',  emoji: '🟫' },
  'r+-at': { word: 'rat',  emoji: '🐀' },
  's+-at': { word: 'sat',  emoji: '🪑' },
  // -ed family
  'b+-ed': { word: 'bed',  emoji: '🛏️' },
  'r+-ed': { word: 'red',  emoji: '🔴' },
  'l+-ed': { word: 'led',  emoji: '💡' },
  // -eg family
  'l+-eg': { word: 'leg',  emoji: '🦵' },
  'p+-eg': { word: 'peg',  emoji: '📌' },
  // -en family ★
  'h+-en': { word: 'hen',  emoji: '🐔' },
  'p+-en': { word: 'pen',  emoji: '🖊️' },
  't+-en': { word: 'ten',  emoji: '🔟' },
  'd+-en': { word: 'den',  emoji: '🏡' },
  // -et family
  'n+-et': { word: 'net',  emoji: '🥅' },
  'p+-et': { word: 'pet',  emoji: '🐾' },
  'w+-et': { word: 'wet',  emoji: '💧' },
  'j+-et': { word: 'jet',  emoji: '✈️' },
  // -ig family ★
  'd+-ig': { word: 'dig',  emoji: '⛏️' },
  'p+-ig': { word: 'pig',  emoji: '🐷' },
  'w+-ig': { word: 'wig',  emoji: '👱' },
  'b+-ig': { word: 'big',  emoji: '🏔️' },
  'j+-ig': { word: 'jig',  emoji: '💃' },
  // -in family
  'b+-in': { word: 'bin',  emoji: '🗑️' },
  'f+-in': { word: 'fin',  emoji: '🐟' },
  'p+-in': { word: 'pin',  emoji: '📍' },
  'w+-in': { word: 'win',  emoji: '🏆' },
  // -ip family
  'd+-ip': { word: 'dip',  emoji: '🥣' },
  'l+-ip': { word: 'lip',  emoji: '💋' },
  'z+-ip': { word: 'zip',  emoji: '🤐' },
  't+-ip': { word: 'tip',  emoji: '💡' },
  // -it family
  'h+-it': { word: 'hit',  emoji: '⚾' },
  'p+-it': { word: 'pit',  emoji: '🕳️' },
  's+-it': { word: 'sit',  emoji: '🪑' },
  'b+-it': { word: 'bit',  emoji: '🔩' },
  // -og family ★
  'd+-og': { word: 'dog',  emoji: '🐶' },
  'j+-og': { word: 'jog',  emoji: '🏃' },
  'l+-og': { word: 'log',  emoji: '🪵' },
  'h+-og': { word: 'hog',  emoji: '🐗' },
  // -op family
  'h+-op': { word: 'hop',  emoji: '🐰' },
  'm+-op': { word: 'mop',  emoji: '🧹' },
  'p+-op': { word: 'pop',  emoji: '🎈' },
  't+-op': { word: 'top',  emoji: '🔝' },
  // -ot family
  'd+-ot': { word: 'dot',  emoji: '⚫' },
  'h+-ot': { word: 'hot',  emoji: '🔥' },
  'p+-ot': { word: 'pot',  emoji: '🪴' },
  'n+-ot': { word: 'not',  emoji: '🚫' },
  // -ox family
  'b+-ox': { word: 'box',  emoji: '📦' },
  'f+-ox': { word: 'fox',  emoji: '🦊' },
  // -ub family
  'c+-ub': { word: 'cub',  emoji: '🐻' },
  't+-ub': { word: 'tub',  emoji: '🛁' },
  's+-ub': { word: 'sub',  emoji: '🚢' },
  'r+-ub': { word: 'rub',  emoji: '🖐️' },
  // -ug family ★
  'b+-ug': { word: 'bug',  emoji: '🐛' },
  'm+-ug': { word: 'mug',  emoji: '☕' },
  'r+-ug': { word: 'rug',  emoji: '🪆' },
  'h+-ug': { word: 'hug',  emoji: '🤗' },
  'j+-ug': { word: 'jug',  emoji: '🏺' },
  't+-ug': { word: 'tug',  emoji: '⚓' },
  // -up family
  'c+-up': { word: 'cup',  emoji: '🥤' },
  'p+-up': { word: 'pup',  emoji: '🐶' },
  // -ut family
  'c+-ut': { word: 'cut',  emoji: '✂️' },
  'h+-ut': { word: 'hut',  emoji: '🏚️' },
  'n+-ut': { word: 'nut',  emoji: '🥜' },
  'b+-ut': { word: 'but',  emoji: '↩️' },

  // ── Level 3: Vowel Digraphs (-ee / -ea / -ay / -ow / -igh) ───────
  // -ee family
  'b+-ee':  { word: 'bee',  emoji: '🐝' },
  'f+-ee':  { word: 'fee',  emoji: '💸' },
  's+-ee':  { word: 'see',  emoji: '👁️' },
  't+-ee':  { word: 'tee',  emoji: '⛳' },
  // -ea family
  't+-ea':  { word: 'tea',  emoji: '☕' },
  's+-ea':  { word: 'sea',  emoji: '🌊' },
  'p+-ea':  { word: 'pea',  emoji: '🟢' },
  // -ay family
  'b+-ay':  { word: 'bay',  emoji: '⚓' },
  'd+-ay':  { word: 'day',  emoji: '🌅' },
  'h+-ay':  { word: 'hay',  emoji: '🌾' },
  'j+-ay':  { word: 'jay',  emoji: '🐦' },
  'p+-ay':  { word: 'pay',  emoji: '💳' },
  'r+-ay':  { word: 'ray',  emoji: '☀️' },
  's+-ay':  { word: 'say',  emoji: '💬' },
  'w+-ay':  { word: 'way',  emoji: '🛣️' },
  // -ow family (/oʊ/ sound)
  'b+-ow':  { word: 'bow',  emoji: '🎀' },
  'l+-ow':  { word: 'low',  emoji: '⬇️' },
  'm+-ow':  { word: 'mow',  emoji: '🌿' },
  'r+-ow':  { word: 'row',  emoji: '🚣' },
  't+-ow':  { word: 'tow',  emoji: '🚗' },
  's+-ow':  { word: 'sow',  emoji: '🐷' },
  // -igh family
  'h+-igh': { word: 'high', emoji: '🔝' },
  's+-igh': { word: 'sigh', emoji: '😔' },

  // ── Level 4: Consonant Blends + Level 2 rimes ────────────────────
  // sh + rimes
  'sh+-op': { word: 'shop', emoji: '🛍️' },
  'sh+-ot': { word: 'shot', emoji: '🎯' },
  'sh+-ip': { word: 'ship', emoji: '🚢' },
  'sh+-in': { word: 'shin', emoji: '🦵' },
  // ch + rimes
  'ch+-ip': { word: 'chip', emoji: '🍟' },
  'ch+-op': { word: 'chop', emoji: '🪓' },
  'ch+-at': { word: 'chat', emoji: '💬' },
  'ch+-in': { word: 'chin', emoji: '🧑' },
  'ch+-ug': { word: 'chug', emoji: '🚂' },
  // th + rimes
  'th+-in': { word: 'thin', emoji: '📏' },
  'th+-en': { word: 'then', emoji: '⏭️' },
  // wh + rimes
  'wh+-ip': { word: 'whip', emoji: '🪢' },
  // cl + rimes
  'cl+-ap': { word: 'clap', emoji: '👏' },
  'cl+-ub': { word: 'club', emoji: '♣️' },
  'cl+-am': { word: 'clam', emoji: '🐚' },
  // fl + rimes
  'fl+-ap': { word: 'flap', emoji: '✈️' },
  'fl+-ip': { word: 'flip', emoji: '🔄' },
  'fl+-ag': { word: 'flag', emoji: '🚩' },
  // sl + rimes
  'sl+-ip': { word: 'slip', emoji: '🧊' },
  'sl+-ug': { word: 'slug', emoji: '🐌' },
  'sl+-ap': { word: 'slap', emoji: '👋' },
  // sn + rimes
  'sn+-ap': { word: 'snap', emoji: '📸' },
  'sn+-ug': { word: 'snug', emoji: '🤗' },
  // sp + rimes
  'sp+-ot': { word: 'spot', emoji: '🔍' },
  'sp+-in': { word: 'spin', emoji: '🌀' },
  'sp+-it': { word: 'spit', emoji: '💦' },
  // st + rimes
  'st+-op': { word: 'stop', emoji: '🛑' },
  'st+-ub': { word: 'stub', emoji: '🎫' },
  'st+-em': { word: 'stem', emoji: '🌱' },
  // tr + rimes
  'tr+-ip': { word: 'trip', emoji: '✈️' },
  'tr+-im': { word: 'trim', emoji: '✂️' },
  // dr + rimes
  'dr+-ip': { word: 'drip', emoji: '💧' },
  'dr+-op': { word: 'drop', emoji: '💧' },
  // cr + rimes
  'cr+-op': { word: 'crop', emoji: '🌾' },
  // gr + rimes
  'gr+-ip': { word: 'grip', emoji: '✊' },
  'gr+-ab': { word: 'grab', emoji: '✋' },
  // bl + rimes
  'bl+-ot': { word: 'blot', emoji: '🖊️' },
  // pl + rimes
  'pl+-op': { word: 'plop', emoji: '💧' },
  'pl+-ug': { word: 'plug', emoji: '🔌' },
  // sm + rimes
  'sm+-ug': { word: 'smug', emoji: '😏' },
  // L4 blends + L3 digraph rimes
  'tr+-ee': { word: 'tree', emoji: '🌳' },
  'fr+-ee': { word: 'free', emoji: '🦋' },
  'fl+-ee': { word: 'flee', emoji: '🏃' },
  'gr+-ay': { word: 'gray', emoji: '🩶' },
  'pl+-ay': { word: 'play', emoji: '🎮' },
  'pr+-ay': { word: 'pray', emoji: '🙏' },
  'cl+-ay': { word: 'clay', emoji: '🏺' },
  'sn+-ow': { word: 'snow', emoji: '❄️' },
  'bl+-ow': { word: 'blow', emoji: '💨' },
  'fl+-ow': { word: 'flow', emoji: '🌊' },
  'gl+-ow': { word: 'glow', emoji: '✨' },
  'sl+-ow': { word: 'slow', emoji: '🐢' },
  'gr+-ow': { word: 'grow', emoji: '🌱' },

  // ── Level 5: R-Controlled Vowels + Diphthongs ────────────────────
  // -ar family
  'c+-ar':  { word: 'car',  emoji: '🚗' },
  'b+-ar':  { word: 'bar',  emoji: '🍫' },
  'j+-ar':  { word: 'jar',  emoji: '🫙' },
  'f+-ar':  { word: 'far',  emoji: '⭐' },
  't+-ar':  { word: 'tar',  emoji: '⚫' },
  'w+-ar':  { word: 'war',  emoji: '⚔️' },
  // L4 blend + -ar
  'st+-ar': { word: 'star', emoji: '🌟' },
  'sc+-ar': { word: 'scar', emoji: '🩹' },
  // -er family
  'h+-er':  { word: 'her',  emoji: '👩' },
  // -ir family
  's+-ir':  { word: 'sir',  emoji: '🎩' },
  // -or family
  'f+-or':  { word: 'for',  emoji: '➡️' },
  'n+-or':  { word: 'nor',  emoji: '🚫' },
  // -ur family
  'f+-ur':  { word: 'fur',  emoji: '🐻' },
  'p+-ur':  { word: 'purr', emoji: '🐱' },
  // -oy family
  'b+-oy':  { word: 'boy',  emoji: '👦' },
  'j+-oy':  { word: 'joy',  emoji: '😊' },
  't+-oy':  { word: 'toy',  emoji: '🪀' },
  's+-oy':  { word: 'soy',  emoji: '🫛' },
  // -oo family
  'b+-oo':  { word: 'boo',  emoji: '👻' },
  'm+-oo':  { word: 'moo',  emoji: '🐄' },
  'z+-oo':  { word: 'zoo',  emoji: '🦁' },
  'g+-oo':  { word: 'goo',  emoji: '🤢' },
  'w+-oo':  { word: 'woo',  emoji: '💌' },
  // -aw family
  'j+-aw':  { word: 'jaw',  emoji: '😬' },
  'l+-aw':  { word: 'law',  emoji: '⚖️' },
  'p+-aw':  { word: 'paw',  emoji: '🐾' },
  'r+-aw':  { word: 'raw',  emoji: '🥩' },
  's+-aw':  { word: 'saw',  emoji: '🪚' },
}

export function lookupSynthesis(valA: string, valB: string) {
  const isRimeA = valA.startsWith('-')
  const letter = isRimeA ? valB : valA
  const rime = isRimeA ? valA : valB
  if (!rime.startsWith('-')) return null
  return SYNTHESIS_MAP[`${letter}+${rime}`] ?? null
}

import type { HandItem } from '../types'
import { lookupSynthesis, getMatchingLettersForRime, getMatchingRimesForLetter } from './words'

export interface UnitConfig {
  book: number; // 1 to 5
  unit: number; // 1 to 8
  label: string; // e.g. "Unit 1"
  name: string; // e.g. "Aa, Bb, Cc"
  desc: string; // description of rules/sounds
  letters?: string[]; // letters introduced
  rimes?: string[]; // rimes introduced
}

// ── Oxford Phonics World 1-5 Detailed Unit Configuration ──────────
export const BOOK_UNITS: UnitConfig[] = [
  // Book 1: The Alphabet
  { book: 1, unit: 1, label: 'Unit 1', name: 'Aa, Bb, Cc', desc: 'apple, ant, bear, bird, cat, cup', letters: ['a', 'b', 'c'] },
  { book: 1, unit: 2, label: 'Unit 2', name: 'Dd, Ee, Ff', desc: 'dog, desk, egg, elephant, fish, fan', letters: ['d', 'e', 'f'] },
  { book: 1, unit: 3, label: 'Unit 3', name: 'Gg, Hh, Ii', desc: 'goat, gift, hat, horse, igloo, ink', letters: ['g', 'h', 'i'] },
  { book: 1, unit: 4, label: 'Unit 4', name: 'Jj, Kk, Ll', desc: 'jam, jet, kangaroo, key, lion, lamp', letters: ['j', 'k', 'l'] },
  { book: 1, unit: 5, label: 'Unit 5', name: 'Mm, Nn, Oo', desc: 'monkey, milk, nut, net, octopus, ox', letters: ['m', 'n', 'o'] },
  { book: 1, unit: 6, label: 'Unit 6', name: 'Pp, Qq, Rr', desc: 'panda, pen, queen, quilt, rabbit, rose', letters: ['p', 'q', 'r'] },
  { book: 1, unit: 7, label: 'Unit 7', name: 'Ss, Tt, Uu, Vv', desc: 'sun, seal, tiger, turtle, umbrella, van', letters: ['s', 't', 'u', 'v'] },
  { book: 1, unit: 8, label: 'Unit 8', name: 'Ww, Xx, Yy, Zz', desc: 'wolf, web, fox, box, yo-yo, yak, zebra, zoo', letters: ['w', 'x', 'y', 'z'] },

  // Book 2: Short Vowels (CVC)
  { book: 2, unit: 1, label: 'Unit 1', name: 'Short a (-am, -an)', desc: 'jam, ram, yam; pan, man, fan', rimes: ['-am', '-an'] },
  { book: 2, unit: 2, label: 'Unit 2', name: 'Short a (-ad, -ag, -ap, -at)', desc: 'dad, sad; bag, rag; cap, map; cat, bat', rimes: ['-ad', '-ag', '-ap', '-at'] },
  { book: 2, unit: 3, label: 'Unit 3', name: 'Short e (-ed, -eg, -en, -et)', desc: 'bed, red; peg, leg; pen, ten; pet, net', rimes: ['-ed', '-eg', '-en', '-et'] },
  { book: 2, unit: 4, label: 'Unit 4', name: 'Short i (-ig, -in, -ip, -it)', desc: 'pig, wig; pin, bin; lip, zip; sit, hit', rimes: ['-ig', '-in', '-ip', '-it'] },
  { book: 2, unit: 5, label: 'Unit 5', name: 'Short o (-og, -op, -ot, -ox)', desc: 'dog, log; mop, hop; pot, hot; box, fox', rimes: ['-og', '-op', '-ot', '-ox'] },
  { book: 2, unit: 6, label: 'Unit 6', name: 'Short u (-ub, -ug, -up, -ut)', desc: 'tub, cub; bug, mug; cup, pup; nut, hut', rimes: ['-ub', '-ug', '-up', '-ut'] },
  { book: 2, unit: 7, label: 'Unit 7', name: 'Review 1 (Short a, e, i)', desc: 'am, an, ad, ag, ap, at, ed, eg, en, et, ig, in, ip, it', rimes: ['-am', '-an', '-ad', '-ag', '-ap', '-at', '-ed', '-eg', '-en', '-et', '-ig', '-in', '-ip', '-it'] },
  { book: 2, unit: 8, label: 'Unit 8', name: 'Review 2 (Short o, u)', desc: 'og, op, ot, ox, ub, ug, up, ut', rimes: ['-og', '-op', '-ot', '-ox', '-ub', '-ug', '-up', '-ut'] },

  // Book 3: Long Vowels (Magic E & Digraphs)
  { book: 3, unit: 1, label: 'Unit 1', name: 'Long a (a_e)', desc: 'cake, game, gate, cave, wave', rimes: ['a_e'] },
  { book: 3, unit: 2, label: 'Unit 2', name: 'Long i (i_e)', desc: 'kite, bike, five, dive, time', rimes: ['i_e'] },
  { book: 3, unit: 3, label: 'Unit 3', name: 'Long o (o_e)', desc: 'bone, cone, rope, home, rose', rimes: ['o_e'] },
  { book: 3, unit: 4, label: 'Unit 4', name: 'Long u (u_e)', desc: 'cube, tube, mule, cute', rimes: ['u_e'] },
  { book: 3, unit: 5, label: 'Unit 5', name: 'ee, ea (Long e)', desc: 'bee, tree, green; leaf, meat, sea', rimes: ['-ee', '-ea'] },
  { book: 3, unit: 6, label: 'Unit 6', name: 'ai, ay (Long a)', desc: 'rain, train; day, play, say', rimes: ['-ai', '-ay'] },
  { book: 3, unit: 7, label: 'Unit 7', name: 'oa, ow (Long o)', desc: 'boat, coat, soap; bow, row, snow', rimes: ['-oa', '-ow'] },
  { book: 3, unit: 8, label: 'Unit 8', name: 'igh, y (Long i)', desc: 'night, light; fly, sky, cry, my', rimes: ['-igh', '-y'] },

  // Book 4: Consonant Blends
  { book: 4, unit: 1, label: 'Unit 1', name: 'L-Blends', desc: 'black, clock, flag, glass, plant, slide', letters: ['bl', 'cl', 'fl', 'gl', 'pl', 'sl'] },
  { book: 4, unit: 2, label: 'Unit 2', name: 'R-Blends', desc: 'bread, crab, frog, green, prize, tree', letters: ['br', 'cr', 'fr', 'gr', 'pr', 'tr'] },
  { book: 4, unit: 3, label: 'Unit 3', name: 'S-Blends', desc: 'smile, snow, spoon, swim, star', letters: ['sm', 'sn', 'sp', 'sw', 'st'] },
  { book: 4, unit: 4, label: 'Unit 4', name: 'Digraphs 1 (sh, ch, wh, ph)', desc: 'ship, shell, chick, watch, whale, photo', letters: ['sh', 'ch', 'wh', 'ph'] },
  { book: 4, unit: 5, label: 'Unit 5', name: 'Digraphs 2 (th, ck, qu)', desc: 'three, teeth, duck, clock, queen, quick', letters: ['th', 'ck', 'qu'] },
  { book: 4, unit: 6, label: 'Unit 6', name: 'Ending Blends 1 (-ing, -ink, -and, -ent)', desc: 'ring, king; bank, pink; hand, sand; tent', rimes: ['-ing', '-ink', '-and', '-ent'] },
  { book: 4, unit: 7, label: 'Unit 7', name: 'Ending Blends 2 (-amp, -ask, -elt)', desc: 'camp, lamp; desk, mask; belt, melt', rimes: ['-amp', '-ask', '-elt'] },
  { book: 4, unit: 8, label: 'Unit 8', name: 'Review & Soft C/G', desc: 'city, mice; cage, page, giraffe', letters: ['c', 'g'] },

  // Book 5: Letter Combinations
  { book: 5, unit: 1, label: 'Unit 1', name: 'R-Controlled Vowels', desc: 'car, star; bird; nurse; teacher; doctor', rimes: ['-ar', '-er', '-ir', '-or', '-ur'] },
  { book: 5, unit: 2, label: 'Unit 2', name: 'Diphthongs (oy, oi, oo, aw)', desc: 'coin, boil, boy, toy, book, pool, draw', rimes: ['-oy', '-oi', '-oo', '-aw'] },
  { book: 5, unit: 3, label: 'Unit 3', name: 'Special Combos (-all)', desc: 'ball, tall, fall', rimes: ['-all'] },
  { book: 5, unit: 4, label: 'Unit 4', name: 'R-Vowel Advanced (-air, -ear)', desc: 'hair, chair; clear, ear, hear', rimes: ['-air', '-ear'] },
  { book: 5, unit: 5, label: 'Unit 5', name: 'Open Syllables (a, e, i, o, u)', desc: 'baby, lady, he, she, tiger, spider, music', letters: ['b', 'l', 'h', 's', 't'] },
  { book: 5, unit: 6, label: 'Unit 6', name: 'Schwa (weak vowel)', desc: 'panda, banana, lemon, monkey', letters: ['p', 'b', 'c', 'l', 'm', 's'] },
  { book: 5, unit: 7, label: 'Unit 7', name: 'Silent Letters', desc: 'knee, knife; write, wrong; lamb, comb', letters: ['kn', 'wr'] },
  { book: 5, unit: 8, label: 'Unit 8', name: 'Suffixes (tion, sion)', desc: 'station, action, television, picture', rimes: ['-tion', '-sion'] }
]

export const BOOK_INFO: Record<number, { label: string; emoji: string; color: string; desc: string }> = {
  1: { label: 'Book 1: Alphabet', emoji: '📗', color: 'bg-emerald-500', desc: '26字母与首音' },
  2: { label: 'Book 2: Short Vowels', emoji: '📘', color: 'bg-blue-500', desc: '短元音与CVC' },
  3: { label: 'Book 3: Long Vowels', emoji: '📙', color: 'bg-orange-500', desc: '长元音与Magic E' },
  4: { label: 'Book 4: Blends & Digraphs', emoji: '📒', color: 'bg-yellow-500', desc: '辅音连读与双辅音' },
  5: { label: 'Book 5: Letter Combinations', emoji: '📕', color: 'bg-red-500', desc: '控制元音与双元音' }
}

/**
 * Generate a complete card pool based on selected book-units
 */
export function getHandPool(selection: Record<string, boolean>): HandItem[] {
  const lettersSet = new Set<string>()
  const rimesSet = new Set<string>()
  let hasBook1Selected = false

  BOOK_UNITS.forEach(config => {
    const key = `${config.book}-${config.unit}`
    if (selection[key]) {
      if (config.book === 1) {
        hasBook1Selected = true
      }
      
      // Add explicitly defined letters and their matching rimes
      if (config.letters) {
        config.letters.forEach(l => {
          lettersSet.add(l)
          if (config.book > 1) {
            // Find rimes that can combine with this letter to ensure usability
            getMatchingRimesForLetter(l).forEach(r => rimesSet.add(r))
          }
        })
      }

      // Add explicitly defined rimes and their matching letters
      if (config.rimes) {
        config.rimes.forEach(r => {
          rimesSet.add(r)
          // Find letters that can combine with this rime
          getMatchingLettersForRime(r).forEach(l => lettersSet.add(l))
        })
      }
    }
  })

  // Format into HandItem structures
  const pool: HandItem[] = []
  
  // Add letters
  Array.from(lettersSet).forEach((val, i) => {
    pool.push({ id: `sel-l-${val}-${i}`, type: 'letter', value: val })
  })

  // Add rimes
  Array.from(rimesSet).forEach((val, i) => {
    pool.push({ id: `sel-r-${val.replace('-', '')}-${i}`, type: 'rime', value: val })
  })

  // Fallback: If no cards are selected, default to Book 1 Unit 1 letters
  if (pool.length === 0) {
    ['a', 'b', 'c'].forEach((val, i) => {
      pool.push({ id: `fb-l-${val}-${i}`, type: 'letter', value: val })
    })
  }

  return pool
}

/**
 * Check if the active card pool is purely letters (e.g. only Book 1 selected)
 */
export function isPurelyLetters(selection: Record<string, boolean>): boolean {
  let hasSynthesizable = false
  BOOK_UNITS.forEach(config => {
    const key = `${config.book}-${config.unit}`
    if (selection[key]) {
      if (config.book > 1 || config.rimes) {
        hasSynthesizable = true
      }
    }
  })
  return !hasSynthesizable
}

/**
 * Lock a guaranteed synthesizable pair from the pool
 */
function findGuaranteedPair(pool: HandItem[]): [HandItem, HandItem] | null {
  const letters = pool.filter(h => h.type === 'letter')
  const rimes = pool.filter(h => h.type === 'rime')
  const shuffledL = shuffle(letters)
  const shuffledR = shuffle(rimes)

  for (const l of shuffledL) {
    for (const r of shuffledR) {
      if (lookupSynthesis(l.value, r.value)) {
        return [l, r]
      }
    }
  }
  return null
}

/**
 * Refill cards during the game
 */
export function refillTiles(selection: Record<string, boolean>, count = 2): HandItem[] {
  const pool = getHandPool(selection)
  const ts = Date.now()
  
  if (isPurelyLetters(selection) || count <= 1) {
    return shuffle(pool).slice(0, count).map((h, i) => ({ ...h, id: `rf-${i}-${ts}` }))
  }

  // Ensure we get a good mix of rimes and letters
  const synRimes = pool.filter(h => h.type === 'rime')
  const rime = shuffle(synRimes)[0] ?? shuffle(pool.filter(h => h.type === 'rime'))[0]
  const others = shuffle(pool.filter(h => h !== rime)).slice(0, count - 1)
  
  return [rime, ...others].map((h, i) => ({ ...h, id: `rf-${i}-${ts}` }))
}

/**
 * Distribute starting hand, guaranteeing at least one match if possible
 */
export function dealHand(selection: Record<string, boolean>, count = 11): HandItem[] {
  const pool = getHandPool(selection)
  const ts = Date.now()

  if (isPurelyLetters(selection)) {
    const letters = pool.filter(h => h.type === 'letter')
    return shuffle(letters).slice(0, count).map((h, i) => ({ ...h, id: `hand-${i}-${ts}` }))
  }

  // Try to lock a guaranteed match
  const pair = findGuaranteedPair(pool)
  const guaranteed = pair ? [pair[0], pair[1]] : []

  // Add extra rimes and fill with letters
  const rest = pool.filter(h => !guaranteed.includes(h))
  const extraR = shuffle(rest.filter(h => h.type === 'rime')).slice(0, 2)
  const extraL = shuffle(rest.filter(h => h.type === 'letter')).slice(0, Math.max(0, count - guaranteed.length - extraR.length))

  return shuffle([...guaranteed, ...extraR, ...extraL]).map((h, i) => ({ ...h, id: `hand-${i}-${ts}` }))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

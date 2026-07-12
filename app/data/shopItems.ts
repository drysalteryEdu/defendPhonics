// ── 道具定义（8种，带稀有度权重）────────────────────────────────
export type ShopItemId =
  | 'heal' | 'redraw' | 'add_tiles' | 'rapid' | 'shield' | 'slow'
  | 'bomb' | 'fullheal'

export interface ShopItem {
  id: ShopItemId
  emoji: string
  label: string
  desc: string
  weight: number  // 权重越小越稀有（稀有=1，普通=3）
}

export const ALL_SHOP_ITEMS: ShopItem[] = [
  // ── 普通（weight 3）─────────────────────────────────────────
  { id: 'heal',      emoji: '❤️',  label: '基地回血',   desc: '基地恢复 3 点生命值',               weight: 3 },
  { id: 'add_tiles', emoji: '🎁',  label: '额外补牌',   desc: '立即在手牌区加 5 张牌',             weight: 3 },
  { id: 'shield',    emoji: '🛡️', label: '护盾 +3',    desc: '基地获得 3 点护盾，先于血量吸伤',   weight: 3 },
  { id: 'slow',      emoji: '❄️',  label: '冰冻一波',   desc: '接下来 15 秒敌人移速降低 40%',      weight: 3 },
  // ── 稀少（weight 2）─────────────────────────────────────────
  { id: 'rapid',     emoji: '⚡',  label: '速射 20 秒', desc: '英雄射速 ×2，持续 20 秒',           weight: 2 },
  { id: 'redraw',    emoji: '🃏',  label: '重新发牌',   desc: '弃掉手牌，重新抽 11 张',            weight: 2 },
  // ── 稀有（weight 1）─────────────────────────────────────────
  { id: 'bomb',      emoji: '💥',  label: '清场炸弹',   desc: '消灭当前屏幕上所有敌人',            weight: 1 },
  { id: 'fullheal',  emoji: '💊',  label: '基地满血',   desc: '基地恢复至满血（10 点）',           weight: 1 },
]

// 带权重的随机选取（不重复），稀有道具出现概率较低
function weightedPick(pool: ShopItem[]): [ShopItem, ShopItem[]] {
  const total = pool.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= pool[i].weight
    if (r <= 0 || i === pool.length - 1) {
      return [pool[i], pool.filter((_, j) => j !== i)]
    }
  }
  return [pool[0], pool.slice(1)]
}

export function getRandomShopItems(count = 4): ShopItem[] {
  const result: ShopItem[] = []
  let pool = [...ALL_SHOP_ITEMS]
  for (let i = 0; i < count && pool.length > 0; i++) {
    const [item, remaining] = weightedPick(pool)
    result.push(item)
    pool = remaining
  }
  return result
}

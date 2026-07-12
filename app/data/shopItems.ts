export type ShopItemId = 'heal' | 'redraw' | 'add_tiles' | 'rapid' | 'shield' | 'slow'

export interface ShopItem {
  id: ShopItemId
  emoji: string
  label: string
  desc: string
}

export const ALL_SHOP_ITEMS: ShopItem[] = [
  { id: 'heal',      emoji: '❤️',  label: '基地回血',   desc: '基地恢复 3 点生命值' },
  { id: 'redraw',    emoji: '🃏',  label: '重新发牌',   desc: '弃掉手牌，重新抽 11 张' },
  { id: 'add_tiles', emoji: '🎁',  label: '额外补牌',   desc: '立即在手牌区加 5 张牌' },
  { id: 'rapid',     emoji: '⚡',  label: '速射 20 秒', desc: '英雄射速 ×2，持续 20 秒' },
  { id: 'shield',    emoji: '🛡️', label: '护盾 +3',    desc: '基地获得 3 点护盾，先于血量吸伤' },
  { id: 'slow',      emoji: '❄️',  label: '冰冻一波',   desc: '接下来 15 秒敌人移速降低 40%' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getRandomShopItems(count = 3): ShopItem[] {
  return shuffle([...ALL_SHOP_ITEMS]).slice(0, count)
}

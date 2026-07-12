// ── 功能开关（Feature Flags）────────────────────────────────────
// 修改此文件即可开启/关闭可选功能；部分功能也在游戏界面提供实时开关

export const FEATURES = {
  // 激励音乐：基地血量降至 criticalHp 时暂停游戏，播放一首 Super Simple Songs
  musicReward: true,
  musicCriticalHp: 3,          // HP ≤ 此值时触发（每局最多 2 次，每波 1 次）

  // 防沉溺：累计 playing 状态时长提醒（软提醒，不强制关闭）
  antiAddiction: true,
  antiAddictionWarnMin: 15,    // 第一次警告（分钟）
  antiAddictionBreakMin: 25,   // 建议休息（分钟，每 5 分钟重新提示）

  // 重新发牌时是否同时清空战场所有英雄（true = 高风险高回报）
  // false = 只换手牌（默认）；true = 清空战场+手牌，发 14 张新牌
  redrawClearsGrid: false,

  // 每波商店展示的道具数量（建议 3-4）
  shopItemCount: 4,
}

// ── 功能开关（Feature Flags）────────────────────────────────────
// 修改此文件即可开启/关闭可选功能，无需改动组件代码

export const FEATURES = {
  // 激励音乐：基地血量降至 criticalHp 时暂停游戏，播放一首 Super Simple Songs
  // 30秒儿歌完成后发放回血奖励（原型阶段替代视频广告）
  musicReward: true,
  musicCriticalHp: 3,        // HP ≤ 此值时触发（每波最多触发一次）

  // 防沉溺：累计 playing 状态时长提醒（软提醒，不强制关闭）
  antiAddiction: true,
  antiAddictionWarnMin: 15,  // 第一次警告（分钟）
  antiAddictionBreakMin: 25, // 建议休息（分钟，每5分钟重新提示）
}

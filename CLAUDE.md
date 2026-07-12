# CLAUDE.md — 拼读保卫战 (PhonicsDefend)

面向英语自然拼读的塔防游戏原型。玩家将字母牌与韵脚牌拼合成单词英雄，英雄自动向右射击消灭入侵的怪兽，守住基地。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router（纯客户端，SSR 禁用） |
| UI | React 19 + Tailwind CSS 3 |
| 拖拽 | @dnd-kit/core 6（PointerSensor + TouchSensor） |
| 语言 | TypeScript 5（strict） |
| 部署 | Vercel（静态导出 `output: 'export'` 未启用，走 SSG） |
| 远程仓库 | https://github.com/drysalteryEdu/defendPhonics |

**重要约束：** `app/components/Game.tsx` 和所有拖拽相关组件必须用 `dynamic(() => import(...), { ssr: false })` 包裹，防止 dnd-kit 在服务端渲染时报错。

---

## 目录结构

```
PhonicsDefend/
├── app/
│   ├── components/
│   │   ├── Game.tsx            — 主游戏组件（状态中枢）
│   │   ├── LetterBlock.tsx     — 手牌区可拖拽字母/韵脚块
│   │   ├── GridCell.tsx        — 战场格子（可放置 + 可拖离）
│   │   ├── BattleOverlay.tsx   — 战场敌人/子弹 Canvas 层
│   │   ├── WaveShop.tsx        — 通关商店（1s 庆典 + 道具选择）
│   │   ├── DifficultyPicker.tsx — 关卡选择（Level 1-5）
│   │   ├── MusicReward.tsx     — 激励音乐（HP 危急时触发）
│   │   ├── AntiAddictionOverlay.tsx — 防沉溺提示
│   │   ├── AchievementToast.tsx — 功勋解锁提示（自动消失）
│   │   └── BadgeGallery.tsx    — 功勋展示弹窗
│   ├── config/
│   │   └── features.ts         — 功能开关（Feature Flags）
│   ├── data/
│   │   ├── levels.ts           — 5 级字母/韵脚池 + 发牌逻辑
│   │   ├── shopItems.ts        — 8 种道具定义 + 加权随机选取
│   │   ├── achievements.ts     — 8 枚功勋定义 + localStorage 追踪
│   │   └── songs.ts            — Super Simple Songs 列表 + 歌词备用
│   ├── hooks/
│   │   ├── useGameLoop.ts      — 20fps 游戏主循环（敌人/子弹/碰撞）
│   │   └── useAntiAddiction.ts — 累计游戏时长追踪
│   ├── types.ts                — Cell / HandItem / Enemy / Bullet / GameLoopState
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                — 入口：dynamic import Game，SSR 禁用
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 开发命令

```bash
# 安装依赖
npm install

# 本地开发服务器（默认 port 3000，或指定端口）
npm run dev
npm run dev -- --port 3001

# TypeScript 类型检查（不编译）
npx tsc --noEmit

# 生产构建
npm run build

# 本地预览生产构建
npm run start
```

> **注意：** 修改 `.next/` 缓存可能导致 `Cannot find module './xxx.js'` 错误。
> 遇到此错误执行：`rm -rf .next && npm run dev`

---

## 本地运行

```bash
cd /home/asgard/gitLab/文档/IdiomDict/PhonicsDefend
npm run dev -- --port 3001
# 浏览器打开 http://localhost:3001
```

**后台启动（不阻塞终端）：**
```bash
npm run dev -- --port 3001 &> /tmp/phonics-dev.log &
# 等待约 5 秒后访问
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/
```

---

## 远程部署（Vercel）

- **自动部署**：推送到 `main` 分支后 Vercel 自动触发构建（约 60 秒）
- **仓库**：https://github.com/drysalteryEdu/defendPhonics
- **Vercel 项目**：绑定上述仓库，Framework Preset = Next.js

```bash
# 推送触发部署
git push origin main

# 查看最近部署状态（需安装 Vercel CLI）
vercel ls
```

---

## 测试方法

### 1. TypeScript 静态检查

```bash
npx tsc --noEmit
# 无输出 = 通过；有输出 = 有类型错误需修复后再提交
```

### 2. Playwright 桌面拖拽测试

使用 Playwright MCP 工具对正在运行的 dev server（port 3001）进行交互测试：

```
1. browser_navigate  → http://localhost:3001/
2. browser_snapshot  → 确认手牌区和战场格子已渲染
3. browser_drag      → startTarget=手牌块 ref, endTarget=空格 ref
4. browser_evaluate  → 检查 emptyInGrid 数量减少
```

### 3. Playwright 安卓触摸模拟

模拟安卓浏览器触摸拖拽（`pointerType: 'touch'`）：

```javascript
// 在 browser_evaluate 中执行：
async () => {
  const src  = document.querySelector('[class*="cursor-grab"]')
  const dest = [...document.querySelectorAll('[class*="border-dashed"]')][0]
  const sr = src.getBoundingClientRect(), dr = dest.getBoundingClientRect()
  const sx = sr.left + sr.width/2, sy = sr.top + sr.height/2
  const dx = dr.left + dr.width/2, dy = dr.top  + dr.height/2

  const fire = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, isPrimary: true,
    pointerId: 1, pointerType: 'touch', clientX: x, clientY: y,
    pressure: type === 'pointerup' ? 0 : 0.5,
  }))

  fire(src, 'pointerdown', sx, sy)
  await new Promise(r => setTimeout(r, 250))  // 满足 TouchSensor 200ms 延迟
  for (let i = 1; i <= 8; i++) {
    fire(src, 'pointermove', sx + (dx-sx)*i/8, sy + (dy-sy)*i/8)
    await new Promise(r => setTimeout(r, 20))
  }
  fire(dest, 'pointerup', dx, dy)
  await new Promise(r => setTimeout(r, 100))

  return {
    emptyInGrid: document.querySelectorAll('[class*="border-dashed"]').length,
    occupied: [...document.querySelectorAll('[class*="aspect-square"]')]
      .filter(c => c.textContent?.trim() && c.textContent.trim() !== '+')
      .map(c => c.textContent?.trim()),
  }
}
// 期望：emptyInGrid 从 15 减为 14，occupied 有一个字母值
```

**也可先 resize 为手机视口：**
```
browser_resize → width:375, height:812
```

### 4. 功能回归检查清单

| 功能 | 验证方式 |
|------|----------|
| 手牌 → 战场拖拽（桌面） | `browser_drag` |
| 手牌 → 战场拖拽（安卓触摸） | `browser_evaluate` PointerEvent 模拟 |
| 战场格子 → 手牌双击退回 | `browser_evaluate` dblclick 事件 |
| 字母 + 韵脚合成英雄 | 拖入相邻格后 `browser_snapshot` 确认 emoji 出现 |
| 开战按钮激活 | 合成至少一个英雄后按钮变为可点击 |
| 通关商店 1s 庆典 → 道具选择 | `browser_wait_for` 文字 "选择一个道具" |
| 功勋 Toast 显示 | 通关波次后 `browser_snapshot` 检查 amber 提示 |

---

## 关键设计说明

### 拖拽 touch-action 规则（Android 关键）

- `LetterBlock`：内联 `style={{ touchAction: 'none' }}` + Tailwind `touch-none`
- `GridCell` 占用格（有内容）：内联 `touchAction: 'none'` + `touch-none`
- `GridCell` 空格（放置目标）：`touch-pan-y`（允许页面滚动）

违反此规则会导致安卓浏览器在 dnd-kit `TouchSensor` 的 200ms 延迟内劫持触摸事件，使拖拽完全失效。

### 游戏循环

`useGameLoop`：20fps（50ms/tick），wave × level 双轴难度缩放：
- 生成间隔 = `max(10, 55 - wave×3 - (level-1)×4)` ticks
- 每次生成数 = `min(5, 1 + floor(wave/3) + (level≥4 ? 1 : 0))`
- 每 10 次生成触发波次结算 → 进入商店阶段

### 保底合成对

`dealHand()` 通过 `SEED_PAIRS`（每 level 预定义配对）确保每次发牌至少包含一对可合成的（字母，韵脚），防止玩家无牌可出。

### Feature Flags

`app/config/features.ts` 控制可选功能。修改后重启 dev server 生效，无需改业务代码。

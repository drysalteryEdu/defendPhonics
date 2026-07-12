# 《拼读保卫战》开发日志

## 项目背景

基于《牛津自然拼读 Oxford Phonics World》1-5 级词汇体系开发的寓教于乐塔防小游戏。
目标用户：4-8 岁自然拼读学习儿童。
原型目标：验证「拖拽合成字母 → 召唤单词英雄」的核心玩法体验。

参考文档（均在 `docs/` 目录）：
- `全案开发设计文档.md` — 整体架构、技术选型、商业化方案
- `原型机制与合成升级规则设计.md` — 合成规则细化、Level 1-5 拼读大纲
- `牛津自然拼读 (Levels 1-5) 完整词汇与单元大纲汇总.md` — 后台词汇基础数据

---

## 技术选型

| 层次 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 15 (App Router) | 静态导出 → Vercel 零配置部署 |
| 样式 | Tailwind CSS v3 | 超大号 UI 快速实现，儿童友好风格 |
| 拖拽 | @dnd-kit/core + @dnd-kit/utilities | 支持 PointerSensor / TouchSensor，H5 触控兼容 |
| 语言 | TypeScript | 类型安全，AI 友好 |
| 数据 | 纯前端本地字典（`app/data/words.ts`） | 原型阶段无后端，后期迁移 Supabase |

---

## 目录结构

```
PhonicsDefend/
├── app/
│   ├── page.tsx              # 页面入口（'use client' + dynamic ssr:false）
│   ├── layout.tsx            # HTML 骨架 + 全局元数据
│   ├── globals.css           # Tailwind 基础样式 + 全局重置
│   ├── types.ts              # Cell / HandItem / Enemy / Bullet / GameLoopState 类型
│   ├── data/
│   │   ├── words.ts          # Level 2 合成字典（70+ 条目）+ lookupSynthesis()
│   │   └── levels.ts         # 5级字母池定义 + dealHand() + LEVEL_INFO
│   ├── hooks/
│   │   └── useGameLoop.ts    # 塔防 Game Loop（20fps，useRef 防闭包）
│   └── components/
│       ├── Game.tsx          # 核心游戏逻辑（状态机 + DndContext）
│       ├── GridCell.tsx      # 可放置 + 可拖拽格子（useDroppable + useDraggable）
│       ├── LetterBlock.tsx   # 手牌字母块（useDraggable）
│       ├── BattleOverlay.tsx # 塔防覆盖层（3行敌人+子弹+游戏结束提示）
│       └── DifficultyPicker.tsx # 词汇范围选择弹窗（5档）
├── docs/                     # 设计原文档（md + docx）
├── DEVLOG.md                 # 本文件
├── USER_MANUAL.md            # 用户使用手册
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── .gitignore
```

---

## 核心数据结构

```typescript
// 网格格子
type Cell = {
  id: string                            // 'cell-{row}-{col}'
  type: 'empty' | 'letter' | 'rime' | 'hero'
  value: string                         // 'c' / '-at' / 'cat'
  emoji?: string                        // '🐱'（英雄专属）
}

// 手牌字母块
type HandItem = {
  id: string
  type: 'letter' | 'rime'
  value: string
}
```

---

## 合成规则实现

### 合成字典（`app/data/words.ts`）

key 格式：`辅音字母 + '+' + 词根块`（例如 `'c+-at'`）

覆盖范围（Level 2 全部词族）：

| 词族 | 可合成单词 |
|------|-----------|
| -am  | jam, ram, yam, dam |
| -an  | can, fan, man, pan |
| -at  | bat, cat, hat, mat, rat, sat |
| -ad  | dad, sad |
| -ag  | bag, rag, tag |
| -ap  | cap, map, nap |
| -ed  | bed, red, led |
| -eg  | leg, peg |
| -en  | hen, pen, ten, den |
| -et  | net, pet, wet, jet |
| -ig  | dig, pig, wig, big, jig |
| -in  | bin, fin, pin, win |
| -ip  | dip, lip, zip, tip |
| -it  | hit, pit, sit, bit |
| -og  | dog, jog, log, hog |
| -op  | hop, mop, pop, top |
| -ot  | dot, hot, pot, not |
| -ox  | box, fox |
| -ub  | cub, tub, sub, rub |
| -ug  | bug, mug, rug, hug, jug, tug |
| -up  | cup, pup |
| -ut  | cut, hut, nut, but |

### lookupSynthesis 逻辑

```typescript
export function lookupSynthesis(valA: string, valB: string) {
  const isRimeA = valA.startsWith('-')
  const letter = isRimeA ? valB : valA
  const rime   = isRimeA ? valA : valB
  if (!rime.startsWith('-')) return null  // 两个都是字母 → 无法合成
  return SYNTHESIS_MAP[`${letter}+${rime}`] ?? null
}
```

### 拖拽交互状态机

| 操作 | 结果 |
|------|------|
| 手牌 → 空格子 | 字母上场，从手牌移除 |
| 手牌 → 有字母格子（字母+词根可合成） | 触发合成 → 格子变为英雄（金色+emoji） |
| 手牌 → 有字母格子（无法合成） | 无效，字母留在手牌 |
| 格子 → 空格子 | 字母移动 |
| 格子 → 格子（可合成） | 触发合成，源格子清空 |
| 格子 → 格子（不可合成） | 两格交换 |
| 双击格子 | 字母退回手牌（仅 letter / rime，英雄不可退） |

---

## H5 适配方案

| 问题 | 解决方案 |
|------|---------|
| iPhone 刘海 / Home Bar | `padding: max(1.5rem, env(safe-area-inset-*))` |
| 触控精度 | `touch-action: manipulation`（防误触缩放） |
| 格子尺寸响应式 | `w-14 h-14 sm:w-24 sm:h-24`（56px→96px） |
| 字体大小响应式 | `text-3xl sm:text-5xl`（根据字符长度调整） |
| 拖拽传感器 | `PointerSensor(distance:8)` + `TouchSensor(delay:200)` |

---

## 已知问题与解决过程

### 1. npm install 后无 `.bin` 目录
**原因**：第一次 `npm install` 在不同 CWD 执行，导致 `.bin` 未生成。  
**解法**：确认 CWD 在 `PhonicsDefend/` 后重新 `npm install`。

### 2. Next.js `ssr: false` 不能用于 Server Component
**报错**：`ssr: false is not allowed with next/dynamic in Server Components`  
**解法**：给 `app/page.tsx` 加 `'use client'` 指令后即可使用 `dynamic + ssr:false`。

### 3. dnd-kit hydration mismatch
**原因**：dnd-kit 在 SSR 时生成的 DOM 属性与客户端不一致。  
**解法**：`page.tsx` 使用 `dynamic(() => import('./components/Game'), { ssr: false })` 完全跳过 SSR。

### 4. Next.js worker SIGBUS / @swc/helpers 缺失
**原因**：中间某次 `npm install removed 30 packages` 删掉了 `@swc/helpers`。  
**解法**：重新 `npm install`，确认 `node_modules/@swc/helpers` 存在。

### 5. Dev 服务器需要 nohup 才能保持运行
**原因**：Bash 工具退出时会杀掉子进程，`&` 后台不够。  
**解法**：`nohup node_modules/.bin/next dev --port 3001 > /tmp/phonics-dev.log 2>&1 &`

---

## 本地开发启动命令

```bash
cd /home/asgard/gitLab/文档/IdiomDict/PhonicsDefend

# 安装依赖（仅首次）
npm install

# 启动开发服务器（保持后台运行）
nohup node_modules/.bin/next dev --port 3001 > /tmp/phonics-dev.log 2>&1 &

# 查看日志
tail -f /tmp/phonics-dev.log

# 停止服务器
kill $(lsof -ti:3001)
```

访问地址：
- 本机：http://localhost:3001
- 手机（同局域网）：http://192.168.2.122:3001（IP 随网络变化）
- 线上（Vercel）：https://defend-phonics.vercel.app

---

## 音效系统（`app/utils/sounds.ts`）

使用 **Web Audio API** 合成 MIDI 风格音效，零依赖、无需音频文件，离线可用。

| 事件 | 音效描述 | 函数 |
|------|---------|------|
| 合成英雄成功 | C5-E5-G5 上升大三和弦（清亮欢快） | `playSynthesis()` |
| 字母放入格子 | 轻柔单音 A4 | `playPlace()` |
| 字母退回手牌 | 下滑短音 E4 | `playReturn()` |
| 无效合成尝试 | 低沉方波短振 | `playInvalid()` |

**扩展方法（后续接入真实音频）：**
```typescript
// 在 sounds.ts 顶部解注释音频路径，替换函数实现：
// const SOUND_SYNTHESIS = '/sounds/synthesis.mp3'
// export function playSynthesis() { new Audio(SOUND_SYNTHESIS).play() }
```

---

## 待开发功能（后续版本）

### V2：塔防 Game Loop ✅ 已完成（v0.2.0）
- [x] 敌人系统：👾 定时从右侧第 N 行生成，匀速左移
- [x] 攻击系统：英雄格子定时发射子弹 🐟，同行命中扣血
- [x] 碰撞结算：useRef 存最新状态（防 setInterval 闭包陷阱）
- [x] 基地血量：敌人越过左边界 → 扣基地血，归零游戏结束
- [ ] Super Simple Songs 激励时间：基地告急时触发 30s 儿歌 → 发放奖励道具

### V3：难度 / 词汇范围选择 ✅ 已完成（v0.2.0）

#### 设计方案：牛津分级 + 累加模式

玩家在开局前选择**词汇范围**（对应牛津自然拼读书目）：

| 选项 | 包含书目 | 召唤池内容 |
|------|---------|-----------|
| 📗 Book 1 | Level 1 | 26 个单字母（Aa-Zz）|
| 📗📘 Book 1+2 | Level 1-2 | 字母 + 短元音词族（-at/-ig/-en/-og/-ug…）|
| 📗📘📙 Book 1-3 | Level 1-3 | + Magic E 词根块（`a_e`/`i_e`/`o_e`）|
| 📗📘📙📒 Book 1-4 | Level 1-4 | + 连缀块（`sh`/`ch`/`bl`/`cr`/`st`…）|
| 📗📘📙📒📕 Book 1-5 | Level 1-5 | + 控制元音块（`ar`/`er`/`or`）+ 双元音（`ou`/`oi`）|

#### 实现计划（已完成）：
- [x] `app/data/levels.ts` 统一 5 级字母池 + `dealHand()` + `LEVEL_INFO`
- [x] 开局界面增加"词库选择"卡片（DifficultyPicker 弹窗）
- [x] 根据选择动态发牌（dealHand 从累加池随机抽取，保证至少 3 个词根）
- [ ] Level 1 特殊规则：同字母叠加升级（待 V4 卡组构筑阶段实现）

### V4：卡组构筑（Deck Building）
- [ ] 赛前选词界面：最多选 4-5 个目标单词英雄
- [ ] 召唤池收缩：只掉落所选单词的字母 / 词根块
- [ ] 冲突处理：玩家手动拖拽决定合成方向（如 cat + can 共用 c/a）

### V5：数据持久化 + 功勋系统

接入 **Supabase**，以下数据写入云端：

#### 数据表设计（草案）

```sql
-- 玩家档案
create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 游戏记录
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  level_range text,         -- '1' / '1-2' / '1-3' …
  heroes_made int,          -- 本局合成英雄数
  waves_survived int,       -- 抵御波数
  duration_s int,
  created_at timestamptz default now()
);

-- 功勋系统（成就）
create table achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id),
  badge_id text not null,   -- 见下方徽章列表
  unlocked_at timestamptz default now()
);
```

#### 功勋徽章列表（首批）

| 徽章 ID | 图标 | 名称 | 解锁条件 |
|---------|------|------|---------|
| `first_hero` | 🌟 | 初出茅庐 | 合成第一个单词英雄 |
| `cat_master` | 🐱 | 猫咪大师 | 合成 CAT 英雄 10 次 |
| `full_grid` | 🗺️ | 占领全场 | 15 个格子全部上场 |
| `wave_5` | 🛡️ | 初级卫士 | 抵御 5 波敌人 |
| `wave_20` | ⚔️ | 英勇卫士 | 抵御 20 波敌人 |
| `book2_clear` | 📘 | 短元音大师 | Book 2 模式合成全部 22 个词族代表词 |
| `book3_clear` | 📙 | 魔法E大师 | Book 3 模式合成全部 Magic E 英雄 |
| `no_damage` | 💎 | 完美防守 | 一局内基地不掉血完成 |
| `speedrun` | ⚡ | 闪电手 | 3 分钟内合成 10 个英雄 |
| `song_time` | 🎵 | 好奇宝宝 | 触发 3 次 Super Simple Songs 激励 |

- [ ] 功勋解锁动画（全屏烟花 + 徽章放大弹出）
- [ ] 成就页面：展示所有徽章（已解锁亮色 / 未解锁灰色）
- [ ] Supabase RLS：匿名 insert + select（同 hanzi-game 方案）

### V4：卡组构筑
- [ ] 赛前选词界面（最多选 4-5 个目标英雄）
- [ ] 召唤池收缩：仅掉落所选单词的必要字母块

### V5：商业化 & 数据持久化
- [ ] Supabase 接入：词汇库动态拉取、局内进度存储
- [ ] Super Simple Songs 激励时间（30s 儿歌 → 奖励道具）
- [ ] Vercel 正式部署

---

## v0.3.0 — 2026-07-12

### 本版本完成功能

#### 1. 细粒度单元选择（Gemini 实现）
- `levels.ts` 重构：40 个牛津自然拼读单元（5册 × 8单元），每单元有 letters / rimes 配置
- `DifficultyPicker` 升级为**两级导航**：
  - 第一级：5 本书卡片 + 进度条，手机一屏显示不拥挤
  - 第二级：← 返回、8 个单元逐一勾选（☑/☐ 大按钮）、全选/全不选
  - 底部全局已选计数；至少选 1 个单元的校验
- `dealHand()` 升级：根据选中单元动态计算可合成字母/韵脚池，不再用固定 SEED_PAIRS
- `words.ts` 补全 Magic E（a_e / i_e / o_e / u_e）词条及 Ending Blends

#### 2. Supabase 操作日志（Gemini 实现）
- `app/utils/supabase.ts`：操作日志模块
  - 无 key 时降级到 `localStorage`（最近 200 条），游戏绝不崩溃
  - 生成持久化 `session_id`（本设备唯一）
  - 记录事件：`game_start` / `place_tile` / `synthesize_hero` / `upgrade_hero` / `invalid_synthesis` / `shop_select` / `return_tile` / `game_reset` / `wave_complete`
- `docs/supabase-setup.sql`：建表 + RLS + pg_cron 6 个月自动清理 SQL

**Supabase 接入完整流程（已完成，2026-07-12）**

| 步骤 | 操作 | 状态 |
|------|------|------|
| 1 | 在 Supabase 创建项目 `wyimsgozynhotjdzqgfv` | ✅ |
| 2 | 在 Dashboard → SQL Editor 手动执行建表 SQL | ✅ 用户手动完成 |
| 3 | 在 Vercel 配置环境变量（见下方）| ✅ |
| 4 | `vercel --prod` 重新部署 | ✅ 2026-07-12 |

**Vercel 环境变量（Project: defend-phonics，Environment: Production）**：
```
NEXT_PUBLIC_SUPABASE_URL  = https://wyimsgozynhotjdzqgfv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（JWT anon key）
```

**操作注意事项（踩坑记录）**：
- `vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY` 时 Vercel CLI 会弹出 rename 警告，
  必须选择 **Keep as NEXT_PUBLIC_...（保留原名）**，否则浏览器端无法读取
- "Is it sensitive?" 回答 **No**（anon key 本来就是公开设计的）
- 用 stdin 重定向传值可跳过交互：
  ```bash
  echo "your-key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
  ```
- `sb_publishable_*` 格式（新版 Supabase key）和 `eyJ...`（JWT 格式）**两者均可**连通
  supabase-js v2 建议使用 JWT 格式

**Supabase 表结构**（`phonics_defend_logs`）：
```sql
id          bigserial PRIMARY KEY
session_id  text NOT NULL          -- 设备唯一标识（localStorage 持久化）
event_type  text NOT NULL          -- place_tile / synthesize_hero / game_start 等
wave        integer                -- 当前波次
level       text                   -- 已选单元 JSON 字符串
details     jsonb DEFAULT '{}'     -- 事件详情（word / letter / rime 等）
client_time timestamptz NOT NULL   -- 客户端时间
created_at  timestamptz DEFAULT now()
```

**RLS 策略**：anon 角色只允许 INSERT，不允许 SELECT/UPDATE/DELETE

**6 个月日志保留**（pg_cron，在 Dashboard SQL Editor 执行）：
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('phonics-log-cleanup-6m', '0 3 * * *',
  $$DELETE FROM phonics_defend_logs WHERE client_time < NOW() - INTERVAL '6 months';$$
);
```
> ⚠️ pg_cron 在部分 Supabase 套餐需要单独申请开启，如失败可先跳过，改用手动清理

#### 3. 自然拼读语音（Gemini 实现 + 本版修复）
- `app/utils/phonicsAudio.ts`：基于 Web Speech API
  - 合成英雄时：Onset → Rime → 完整词 三段发音
  - 放置字母时：字母名 → 拼读音
- **移动端修复（本次）**：
  - 改用 `onend` 链式调用（Android 多条 `speak()` 入队常被静默丢弃）
  - `cancel()` 后延 50ms 再 speak（iOS `cancel()` 是异步的，立即 speak 第一句被吞）
  - `pickEnglishVoice()` 显式选英文声道（修复 MIUI/小米浏览器默认用中文声道）

#### 4. 已知问题 & 下版计划

| 问题 | 状态 |
|------|------|
| 手机端 Web Speech API 支持率约 70%（微信浏览器不支持）| 待做降级文字提示 |
| 地图路径规划（赵云式弯曲路径 + 攻击距离）| v0.4 分阶段实现 |
| Supabase 通关日志分析（有真实用户数据上传）| 需提供 Supabase 凭据后可查询分析 |

---

## 版本记录

| 版本 | 日期 | 主要内容 |
|------|------|---------|
| v0.1.0 | 2026-07-11 | 项目初始化：3×5 网格 + 手牌拖拽 + Level 2 合成字典 + H5 适配 |
| v0.1.1 | 2026-07-11 | 接入 Web Audio MIDI 音效（合成/放置/退回/无效）+ 用户手册 + 开发日志完善 |
| v0.2.0 | 2026-07-12 | 5档词汇范围选择 + 塔防 Game Loop（3行赛道，20fps）+ Vercel 部署 |
| v0.3.0 | 2026-07-12 | 40单元细粒度选择 + Supabase 日志 + 拼读语音 + 功勋系统 + 道具商店 + 防沉溺 + 安卓拖拽修复 + 移动端词库UI重构 |



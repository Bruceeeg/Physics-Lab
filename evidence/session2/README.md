# Session 2 学习记录

**日期**：2026-08-25  
**主题**：Cursor 操作与配置；搜索 / 安装 Agent Skill；调用技能改页面  
**项目**：Physics Lab  
**相关对话**：[skill install](7fd5db66-2a22-48c6-8250-c59dd4558c42)、[Linear motion page redesign](bea70b1d-fb0f-4aad-870f-6ed22a17a6ba)

---

## 1. 本次学了什么

1. 弄清 Cursor 里 **Agent Skill** 是什么、放在哪、怎么被 Agent 自动选用。
2. 从 GitHub 搜索并安装两个前端设计技能到当前项目。
3. 用本地脚本检索设计系统建议，并写出项目级 `design-system/` 文档。
4. 按技能规则重构匀变速直线运动页面视觉（不改物理与播放逻辑）。

---

## 2. Cursor 操作与配置（和 Skill 相关）

### 2.1 Skill 是什么

Skill 是一组给 Agent 看的说明文件（核心是 `SKILL.md`）。  
对话里只要任务匹配 `description`，Agent 应先 **Read** 该技能，再按里面的流程做事。

常见用途：UI 规范、提交规范、审查流程、专门领域工作流。

### 2.2 存放位置（配置重点）

| 类型 | 路径 | 作用范围 |
|------|------|----------|
| 项目技能 | `.cursor/skills/<skill-name>/` | 只对本仓库生效，可进 Git 共享 |
| 个人技能 | `~/.cursor/skills/<skill-name>/` | 本机所有项目可用 |
| Cursor 内置 | `~/.cursor/skills-cursor/` | 系统维护，**不要自己往这里塞第三方技能** |

本项目已安装：

```text
.cursor/skills/
├── ui-ux-pro-max/          # 来自 nextlevelbuilder/ui-ux-pro-max-skill
└── design-taste-frontend/  # 来自 Leonxlnx/taste-skill（默认 v2）
```

每个技能目录里至少有 `SKILL.md`；本项目还留了 `UPSTREAM.txt` 记录来源仓库，方便以后更新。

### 2.3 在 Cursor 里怎么「用」技能

不必单独点「运行技能」按钮。更常见的操作是：

1. 在对话里说清楚目标（例如「用 taste-skill 改首页视觉，不要动交互逻辑」）。
2. Agent 根据描述匹配技能 → 读取 `SKILL.md` → 按流程改代码 / 生成设计文档。
3. 本地 `npm run dev` 看效果；不对就继续用自然语言迭代。

和 Session 1 的 vibe coding 一样，差别是：有了 Skill，Agent 会按固定规范（反模板、配色检索、交付检查）做事，而不是每次从零猜审美。

### 2.4 本机还用到的 Cursor / 终端操作

- 打开项目根目录，用 Agent 对话安装技能、改页面。
- 终端跑 `npm run dev` 预览；若出现 `ERR_CONNECTION_REFUSED`，多半是 dev 进程已退出，重新 `npm run dev` 即可。
- 技能脚本依赖本机 **Python 3**（`ui-ux-pro-max` 的搜索脚本只读本地 CSV，不联网、不装 pip 包）。

---

## 3. 如何搜索与安装 Agent 技能

### 3.1 搜索 / 发现

本次是从 GitHub 仓库直接学习并安装：

| 技能 | 仓库 | 安装名 |
|------|------|--------|
| UI UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `ui-ux-pro-max` |
| Taste Skill（anti-slop） | https://github.com/Leonxlnx/taste-skill | `design-taste-frontend` |

搜索关键词可记：`cursor skill`、`SKILL.md`、`ui-ux-pro-max`、`taste-skill`。

也可在 Cursor 生态里找官方/社区技能；安装后仍建议落到 `.cursor/skills/` 或个人 skills 目录。

### 3.2 安装方式（本次实践）

官方 npm / CLI 安装器在环境里可能被拦。本次采用更稳妥的做法：

1. 打开技能仓库，确认目录里有 `SKILL.md`（以及可选的 `scripts/`、`data/`、`references/`）。
2. 浅克隆或下载仓库文件。
3. 拷贝到项目：

```bash
# 概念步骤（路径按实际仓库结构调整）
.cursor/skills/<skill-name>/SKILL.md
.cursor/skills/<skill-name>/...
```

4. 写 `UPSTREAM.txt` 记下源地址，方便复查。
5. 若有本地脚本，先做冒烟测试，例如：

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py \
  "physics education lab experiment" --design-system -p "Physics Lab"
```

### 3.3 两个技能各自做什么

**ui-ux-pro-max**

- 本地设计情报库 + BM25 检索（风格、配色、字体、UX、图表、Next.js 栈等）。
- 适合：新产品页、配色/排版选型、UX 审查、栈相关实现建议。
- 常用入口：

```bash
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Physics Lab"
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain ux
python3 .cursor/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack nextjs
```

**design-taste-frontend（Taste Skill）**

- Anti-slop：先读 brief，再定设计语言；避免紫渐变、模板三卡片、默认 Inter 等 AI 套路。
- 三个旋钮：`DESIGN_VARIANCE` / `MOTION_INTENSITY` / `VISUAL_DENSITY`。
- 改现有页走改造协议：先审计，再按 排版 → 间距 → 颜色 → 动效；不擅自改路由、文案、核心交互。
- 技能原文更偏落地页 / 作品集；实验工具页要克制使用，和 Pro Max 搭配。

### 3.4 冲突时怎么选

| 场景 | 更优先 |
|------|--------|
| 实验台、参数面板、图表、无障碍细则 | `ui-ux-pro-max` |
| 反模板、排版气质、交付前视觉检查 | `design-taste-frontend` |
| 两者冲突 | 产品工具界面以 Pro Max + 本页 `design-system` 为准 |

---

## 4. 尝试调用技能修改页面

### 4.1 调用方式

自然语言触发，例如：

> 先了解当前直线运动页面的布局及样式，之后进行重构调整。  
> 要求：1 不改变逻辑；2 科学实验研究背景，严谨、简洁、科学风格。

Agent 会：

1. 读取已安装技能（Pro Max / Taste）。
2. 用 Pro Max 检索并生成设计系统文档。
3. 按「保留逻辑、只改视觉」重构页面。

### 4.2 产出的设计系统文件

```text
design-system/physics-lab/
├── MASTER.md                 # 全局 token：色板、字体、间距、组件
└── pages/linear-motion.md    # 本页覆盖规则（优先于 MASTER）
```

要点摘录：

- 定位：科研实验台，不是营销落地页。
- 旋钮倾向：Variance 低、Motion 低、Density 偏标准偏紧。
- 本页字体：IBM Plex Sans + Noto Sans SC；数字用 IBM Plex Mono（覆盖 MASTER 里偏学术衬线的默认）。
- 颜色：纸面浅底 + 藏青主色；速度序列用研究金作数据编码。
- 动效：只保留物理积分动画；控件过渡短；不做装饰性大动效。

### 4.3 页面对技能调用后的变化

| 维度 | 调用前（偏演示站） | 调用后（偏实验仪器） |
|------|--------------------|----------------------|
| 背景 | 深色渐变 | 浅色纸面 |
| 卡片 | 大圆角、多层卡片 | 细线分割、小圆角（约 2px） |
| 字体 | 偏通用无衬线 | IBM Plex + 等宽数字 |
| 布局 | 多层营销式区块 | 顶栏公式/走时 + 左参右轨/图 |
| 逻辑 | — | **未改**：公式、采样、开始/暂停/重置 |

校验过：播满 5 s 仍为 \(x=45\,\mathrm{m}\)、\(v=14\,\mathrm{m/s}\)；重置回 \(t=0\)；\(a=0\) 时位置-时间退化为直线。

### 4.4 学到的调用经验

1. **先定边界**：「不改逻辑」写进需求，技能改造才不会动物理引擎。
2. **先文档后改码**：`MASTER.md` + 页面 override，比直接瞎改 class 更可复盘。
3. **技能要组合**：Pro Max 给科研配色与结构，Taste 负责去掉 slop；实验页不要硬套落地页模板。
4. **用自然语言点名技能** 更稳，例如「按 redesign preserve」「VARIANCE 低一点」。

---

## 5. 个人收获（可继续补充）

- 会从 GitHub 找 Cursor Skill，并装到 `.cursor/skills/`。
- 知道项目技能和内置 `skills-cursor` 的区别。
- 会用对话触发技能，生成设计系统并重构页面视觉。
- 理解「教学实验 UI」和「营销落地页」对同一套技能要用不同旋钮。

---

## 6. 后续可做

- 把 `.cursor/skills/`、`design-system/` 与改版后的 `app/` 一并提交到 GitHub。
- 第二个实验页（如斜抛）先写 `design-system/pages/...md`，再改 UI。
- 需要时再装 taste-skill 仓库里的其他变体（如 redesign / 极简）。

---

*本文件用于课程 / 学习证据归档，对应 Session 2。*

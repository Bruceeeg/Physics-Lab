# Session 5 学习记录

**日期**：2026-09-05  
**主题**：对照 AP 物理考纲梳理实验清单；把首页改成按课程的实验目录；未开发实验变暗并标「等待开发」  
**项目**：Physics Lab  
**相关对话**：[AP physics experiments summary](4d02e851-4ab4-4c35-8027-bea1463f4fae)、[Website interaction adjustment](81734949-38f8-4c60-8a43-bed9f2014ae2)  
**目录相关提交**：`7e360b9`（随后 Session 4 把「抛体落点」做成可进实验台）

---

## 1. 本次学了什么

1. 弄清 **College Board 并不规定必须做哪几个实验**：只要约 25% 课时做探究实验，并覆盖各单元。
2. 从官方 *Inquiry-Based Lab Investigations* 教师手册和 2024–25 CED / Syllabus Development Guide 里，整理出 **Physics 1、Physics 2、C 力学、C 电磁** 四套实验目录。
3. 把网站首页从「直接进一台实验」改成 **课程筛选 + 卡片网格**：每张卡有动态预览、实验名、核心公式。
4. 未开发实验：**预览调暗**，角标 **等待开发**，不可点进详情；已开放实验点进 `/labs/[slug]`。
5. 用 Git 提交目录改动并推送到 GitHub `main`。

---

## 2. AP 考纲里的「实验」到底指什么

### 2.1 官方要求（不是固定名单）

四门 AP Physics 都要求：约 **25% 课时**做动手 / 探究实验，学生保留实验笔记或报告（大学可能抽查）。  
审核要的是：实验能**代表各单元**，而不是全班必须做同一套指定仪器。

来源（本次对照过）：

| 文件 | 用途 |
|------|------|
| AP Physics 1 / 2 / C *Course and Exam Description*（2024–25） | 单元、科学实践、实验室课时要求 |
| *AP Physics 1 and 2 Inquiry-Based Lab Investigations: Teacher’s Manual* | 具名的 15 个探究实验范例 |
| 各科 *Syllabus Development Guide* | 样例教学大纲里的代表实验 |

线上部署站 `https://physics-lab-livid-three.vercel.app/` 当时只有斜向拉力一台实验，**并不是完整考纲目录**。真正能对照考纲的是 College Board 文档。

### 2.2 2024–25 单元变化（记这个）

- **流体**从 Physics 2 挪到 **Physics 1 Unit 8**。
- Physics 1 不再考直流电路、机械波、静电学（这些在 Physics 2）。
- 因此：手册里 Physics 2 的「孔流 / 流体动力学」应算进 Physics 1 目录。

### 2.3 官方探究实验（手册具名）

**AP Physics 1**（流体按新考纲计入）

| # | 实验 | 核心问题（简） |
|---|------|----------------|
| 1 | 一维与二维运动学 | 斜轨、水平段、平抛如何用运动学描述 |
| 2 | 牛顿第二定律 | 哪些因素影响加速度（本站斜向拉力对应这一条） |
| 3 | 圆周运动 | 如何测圆锥摆周期 |
| 4 | 机械能守恒 | 弹簧压缩量如何影响小车上斜面 |
| 5 | 冲量与动量 | 力、冲量与动量守恒 |
| 6 | 简谐运动 | 哪些因素影响单摆 |
| 7 | 滚动与转动 | 形状 / 转动惯量如何影响滚到坡底的速度 |
| 8 | 流体孔流 | 水深与出流速率（原 P2 Investigation 2） |

**AP Physics 2**

| # | 实验 | 核心问题（简） |
|---|------|----------------|
| 1 | 玻意耳定律 | 封闭气体 \(P\)–\(V\) 与做功 |
| 2 | 电阻电路 | 串并联与基尔霍夫定则 |
| 3 | RC 电路 | \(\tau = RC\) |
| 4 | 磁场 | 磁铁、载流导线、地磁 |
| 5 | 电磁感应 | 法拉第定律、楞次定律 |
| 6 | 薄透镜焦距 | \(1/f = 1/s + 1/s'\) |
| 7 | 光的粒子模型 | \(E = hf\)、光电 / LED |

Physics C 与 1 / 2 **题材大量重叠**，差别是要用微积分写 \(I=\int r^2\,\mathrm{d}m\)、变力做功、高斯定理、RL / LC、螺线管测 \(\mu_0\)。

### 2.4 首页分类怎么定

对话里曾用过「官方探究 / 本站已有」这类筛选。做成网站目录时去掉它们，只按课程：

```text
全部 · Physics 1 · Physics 2 · C 力学 · C 电磁
```

---

## 3. 首页实验目录怎么做

### 3.1 信息架构

Session 3 结束时 `/` 直接挂斜向拉力实验台。本次改成：

```text
/                          实验目录（按课程分组的卡片）
/labs/pull-friction        斜向拉力实验台
/labs/linear-motion        匀变速直线运动
/about                     关于
```

未开发实验没有详情路由；访问例如 `/labs/circular-motion` 走 `notFound()`。

### 3.2 实验注册表（单一数据源）

清单集中在 `lib/experiments/catalog.ts`：首页网格、筛选、详情 `generateStaticParams` 都读它。

每条实验包含：`slug`、标题、公式、课程、单元、预览种类、`status: "ready" | "pending"`、摘要。

测试（TDD）：四门课分组、只有 `ready` 才有详情路径、筛选、查找。

```bash
node --test --experimental-strip-types lib/experiments/catalog.test.ts
```

### 3.3 卡片与预览

| 状态 | 预览 | 交互 |
|------|------|------|
| `ready` | 真实循环演示（拉力用缩小 3D；匀变速用滑块） | `Link` 进实验台 |
| `pending` | SVG / CSS 循环示意图，`opacity` + 灰度 | 不可点；底部标「等待开发」 |

不要只靠颜色区分：调暗之外必须有文字「等待开发」（无障碍：不只靠颜色传达信息）。  
`prefers-reduced-motion` 时停预览；顶栏可「暂停预览」。视口外卡片用 Intersection Observer，避免几十张卡同时跑动画。

关键文件：

```text
lib/experiments/catalog.ts
lib/experiments/catalog.test.ts
components/catalog/catalog-home.tsx
components/catalog/experiment-card.tsx
components/catalog/site-header.tsx
components/catalog/previews/          # 拉力 3D、匀变速、其余示意图
app/page.tsx                          # 挂载 CatalogHome
app/labs/[slug]/page.tsx              # 只渲染 ready 实验台
```

### 3.4 和设计系统的关系

目录页仍是 **科研仪器站的索引**，不是营销 Hero：短顶栏、IBM Plex、纸面底、藏青筛选芯片、等宽公式。  
布局方案草稿曾记在 `evidence/catalog-layout-*.html`。

---

## 4. Git：提交并推送到远程

本次目录改动提交并推上 `origin/main`（不含 `.cursor/skills/` 里无关的技能元数据）：

```bash
git add app/ components/catalog/ lib/experiments/ ...
git commit -m "Add an AP Physics catalog homepage with looping previews."
git push origin HEAD
```

- 提交：`7e360b9`
- 远程：`https://github.com/Bruceeeg/Physics-Lab.git`

注意：推 `main` 时若工具拦「可能推到受保护分支」，需要在确认后走普通 `git push`（不要 `--force`）。

---

## 5. 本次交付现状（Session 5 目录工作结束时）

- 首页为 **AP 物理实验目录**，四门课分组。
- 当时可进实验台：斜向拉力、匀变速直线运动。
- 其余卡片动态预览 + **等待开发**。
- 注册表可测：`lib/experiments/*.test.ts`。
- 随后 Session 4 将 **抛体落点** 标为 `ready` 并做成双模式实验台（见 `evidence/session4/`）。

---

## 6. 个人收获

- 会把 CED / 探究手册整理成「按课程、可做成交互实验台」的清单，而不是照抄营销网站。
- 理解 AP 实验要求是 **课时比例 + 单元覆盖**，不是全国统一仪器名单。
- 会做实验注册表：目录、路由、预览状态共用一份数据。
- 未完成功能要同时做到：视觉变暗、文字说明、不可导航，避免假链接。
- 会把功能提交推到 GitHub `main`，并知道技能目录改动可以不跟业务提交混在一起。

---

## 7. 后续可做

- 按 Physics 1 未覆盖单元继续做实验台（能量、动量、转动、振动、流体）。
- 把正式 Vercel 生产 URL 写进关于页 / 本 README。
- 目录卡片鼠标点预览区有时只 focus 链接，键盘 Enter 可进；可再改点击命中。

---

*本文件用于课程 / 学习证据归档，对应 Session 5。*

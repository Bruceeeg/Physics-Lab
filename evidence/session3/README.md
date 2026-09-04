# Session 3 学习记录

**日期**：2026-09-04  
**主题**：2D → 3D 实验台；三维受力分析可视化；Agent Skill 深化；Vercel 部署到互联网  
**项目**：Physics Lab（斜向拉力 / 摩擦实验台）  
**相关对话**：[Linear motion page redesign / pull-friction 3D](bea70b1d-fb0f-4aad-870f-6ed22a17a6ba)  
**分支**：`feat/pull-friction-3d` → 合并入 `main`

---

## 1. 本次学了什么

1. 把平面力学演示扩展成 **三维实验台**：Next.js + React Three Fiber + drei + Three.js。
2. 在 3D 场景里做 **受力分析可视化**：力箭头、分量虚线、标签、相机跟随、轨迹。
3. 继续使用 / 安装 Cursor **Agent Skill**（`ui-ux-pro-max`、Superpowers 流程），用设计系统与单屏布局约束改造界面。
4. 了解如何把本地 Next.js 项目 **对接到 Vercel**，发布到公网可访问的 URL。
5. 完成单屏三栏「实验仪器」布局：无限计时、负拉力校验、数字输入 + 滑条、四张累计运动学曲线。

---

## 2. 从 2D 到 3D

### 2.1 为什么要从 2D 升级

Session 1 / 2 的匀变速页是 **2D 轨道 + SVG / DOM 图**：适合一维运动，但斜向拉力、竖直分量、支持力与摩擦力同时出现时，平面图很难同时看清空间关系。  
Session 3 用 3D 视口表达：

- 拉力 \(F\) 及其水平 / 竖直分量 \(F_x\)、\(F_z\)
- 重力 \(G\)、支持力 \(N\)、摩擦力 \(f\)
- 滑块在平台上的位移与速度方向

### 2.2 技术栈选型

| 层 | 选型 | 作用 |
|----|------|------|
| 框架 | Next.js App Router | 页面、字体、部署入口 |
| UI | React 19 + Tailwind 4 | 参数面板、图表、命令栏 |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` | WebGL 场景、轨道控制、网格 |
| 物理 | 自研纯 TypeScript 模型 `lib/models/pull-friction.ts` | 与课本公式对齐，不靠游戏物理引擎主求解 |
| 测试 | Node test runner | `derive` / `step` / 采样 / 力显示 |

要点：

- Three.js **只能在浏览器跑** → Canvas 与仿真循环放在 Client Component（`dynamic(..., { ssr: false })`）。
- **物理积分与渲染解耦**：`requestAnimationFrame` 里 `step()` 更新状态；R3F 只负责画力和滑块。
- 不用 Rapier / Cannon 当主求解器：它们适合堆箱子，很难和课本 \(N=mg-|F|\sin\theta\)、静 / 动摩擦分支一一对上。

### 2.3 关键的核心文件

```text
app/page.tsx                          # 挂载 PullFrictionLab
components/pull-friction-lab.tsx      # 参数、播放、单屏布局、图表
components/pull-friction-canvas.tsx   # R3F Canvas 边界
components/pull-friction-scene.tsx    # 网格、滑块、力箭头、标签、跟随相机
components/kinematic-charts.tsx       # vx / ax / ΣFx / Δx 累计曲线
components/parameter-control.tsx      # 数字输入 + 滑条
lib/models/pull-friction.ts           # 受力推导与运动积分
lib/models/force-display.ts           # 力箭头几何与侧向错位
```

---

## 3. 3D 模型与受力分析

### 3.1 物理模型（简要）

参数：\(F\)（可正可负）、\(\theta\)（相对 \(+x\) 的几何角，0°–180°）、\(m\)、\(\mu_s\)、\(\mu_k\)、\(g\)。

约定（本实验台）：

- 力的大小用 \(|F|\)，方向由 \(\theta\) 决定：  
  \(F_x = |F|\cos\theta\)，\(F_z = |F|\sin\theta\)。
- **符号与角度必须一致**，否则报错并暂停：
  - \(F>0\) → \(\theta \in [0°,90°]\)
  - \(F<0\) → \(\theta \in [90°,180°]\)
  - \(F=0\) → \(\theta\) 任意

接触分支：

1. **static**：\(|F_x| \le \mu_s N\)，静止。
2. **sliding**：动摩擦，\(a_x = (F_x + f)/m\)。
3. **airborne / liftoff**：\(N=0\)，竖直分力抬起滑块。

### 3.2 三维可视化怎么对应课本

| 视觉元素 | 物理含义 |
|----------|----------|
| 半透明方块 | 质点 / 滑块（中心为力作用点） |
| 实线箭头 | \(F, G, N, f\) |
| 虚线箭头 | 分量 \(F_x, F_z\) |
| 箭头长度 | 力的大小（主要编码） |
| 共线箭头微错位（约 0.015 m） | 避免完全重叠，仍几乎贴在一起 |
| WebGL Sprite 标签 | 与箭头同变换，避免 DOM `Html` 一帧滞后 |

### 3.3 踩过的坑（值得记）

1. **drei `Html` 标签卡顿 / 大小不一致**  
   DOM 投影与相机跟随不同步 → 改成 Canvas 光栅 + `Sprite`，与箭头同通道绘制。
2. **相机跟随优先级**  
   `useFrame(..., -1)` 先更新跟随，再画场景，避免标签用「上一帧相机」。
3. **无限计时与图表**  
   去掉 8 s 上限；曲线 x 轴随时间累积扩展；历史点压缩保留起点与最新点。
4. **单屏 1366×768**  
   三栏：左参数 / 中 3D / 右四图；≥1280×720 禁止整页纵向滚动。

---

## 4. 技能安装与调用（Session 3 深化）

Session 2 已装入项目技能；Session 3 在实现 3D 实验台时继续使用：

| 技能 | 用途 |
|------|------|
| `ui-ux-pro-max` | 科研配色、图表类型、Next/React 实现建议、单屏密度 |
| `design-taste-frontend` | 反模板、克制装饰、仪器感 |
| Superpowers（Cursor 插件） | brainstorm → 规格 → 计划 → TDD → 验证 → 收尾分支 |

安装位置回顾：

```text
.cursor/skills/
├── ui-ux-pro-max/
└── design-taste-frontend/
```

调用经验补充：

1. 大改布局前先出 **设计规格 + 实现计划**（`docs/superpowers/specs|plans/`），再写代码。
2. 物理与显示分层测：先 `lib/models/*.test.ts`，再浏览器验布局。
3. 实验仪器页：高密度、细线、IBM Plex；不要营销落地页英雄区。

产出覆盖文档示例：

```text
design-system/physics-lab/pages/pull-friction.md
docs/superpowers/specs/2026-09-04-pull-friction-3d-design.md
docs/superpowers/specs/2026-09-04-single-screen-pull-friction-lab-design.md
docs/superpowers/plans/2026-09-04-single-screen-pull-friction-lab.md
```

---

## 5. 对接 Vercel：部署到互联网

### 5.1 为什么用 Vercel

- Next.js 官方友好的托管平台：Git 推送后自动 Build / Preview / Production。
- 本项目暂无自有后端，适合边缘静态 + SSR / 默认 Next 运行时。
- 拿到公网 HTTPS 链接后，同学 / 老师无需本机 `npm run dev` 即可打开实验台。

### 5.2 推荐对接步骤

1. **代码先在 GitHub**  
   仓库：`https://github.com/Bruceeeg/Physics-Lab`  
   功能分支开发，合并 `main` 后作为生产部署源（也可对 PR 开 Preview）。

2. **在 Vercel 导入项目**  
   - 打开 [vercel.com](https://vercel.com)，用 GitHub 登录。  
   - Import `Bruceeeg/Physics-Lab`。  
   - Framework Preset：Next.js（一般自动识别）。  
   - Root Directory：仓库根目录。  
   - Build Command：`npm run build`；Output：默认即可。

3. **环境与构建注意**  
   - 依赖含 `three` / R3F：确保 `package-lock.json` 一并提交。  
   - 3D 页必须是 Client 边界，避免 SSR 访问 `window` / WebGL。  
   - 本地先跑通：`npm run build`，再推送，减少线上失败。

4. **发布与验证**  
   - Production 域名形如：`https://<project>.vercel.app`  
   - 打开后检查：开始 / 暂停 / 重置、3D 旋转、参数数字输入、四张图是否更新。  
   - 以后每次 `main` 更新，Vercel 可自动重新部署。

5. **可选进阶**  
   - 自定义域名（DNS CNAME / A 记录到 Vercel）。  
   - Preview Deployment：每个 PR 独立预览 URL，方便课上对比改版。  
   - 若只要纯静态，可再评估 `output: 'export'`；当前有动态 Client 组件时，默认 Next 部署更省事。

### 5.3 和本地开发的关系

| 环境 | 命令 / 入口 | 用途 |
|------|-------------|------|
| 本地 | `npm run dev` → `http://localhost:3000` | 快速迭代、浏览器自动化验收 |
| 生产 | Vercel URL | 分享、演示、跨设备访问 |

---

## 6. 本次交付现状（Session 3 结束时）

- 首页为 **斜向拉力实验台** 单屏三栏布局。
- 3D 受力 + 无限运行时 + \(v_x,a_x,\Sigma F_x,\Delta x\) 累计图。
- \(F \in [-50,50]\)，\(\theta \in [0°,180°]\)，方向一致性校验。
- 模型测试：`npm test`（力显示 + 拉力摩擦采样等）。
- 学习证据：`evidence/session1`、`session2`、**`session3`（本文件）**。

---

## 7. 个人收获

- 会把「课本受力分析」映射成 3D 箭头与标签，并处理渲染性能问题。
- 理解物理引擎自研公式 vs 游戏物理引擎的适用边界。
- 会用 Skill + 规格驱动大改版，而不是只靠一轮对话堆 UI。
- 知道 GitHub → Vercel 的发布链路，能把实验台放到互联网上给别人用。

---

## 8. 后续可做

- 在 Vercel 绑定自定义域名，并把正式 URL 写回本 README。
- 增加第二个 3D 实验（如斜面 / 斜抛）并写对应 `design-system/pages/...`。
- 修复仓库里遗留的 `linear-motion-lab.tsx` lint（refs during render），保证全仓 `npm run lint` 干净。
- 为 3D 场景加无障碍说明（键盘操作说明、力颜色图例强化）。

---

*本文件用于课程 / 学习证据归档，对应 Session 3。*

# Session 6 学习记录

**日期**：2026-09-05  
**主题**：抛体落点双模式实验台；闭式运动学与预测落点；目录预览「没图」与 3D 视口塌缩  
**项目**：Physics Lab（抛体落点实验台）  
**相关对话**：[抛体落点实验台](c9f0fc82-8cb5-4c36-9705-45b0c1b6ca64)  
**分支**：`feat/projectile-lab` → 快进合并入 `main`  
**对照验收**：浏览器清单与截图见 `evidence/session4/`

---

## 1. 本次学了什么

1. 对照斜向拉力实验台，新做一台 **抛体落点** 实验：同一套 3D 视口 + 四张图，顶栏用分段按钮切换两种教法。
2. 物理用 **闭式运动学**（不写 RK 积分）：\(x=v_0\cos\theta\,t\)，\(y=h+v_0\sin\theta\,t-\tfrac12 gt^2\)，落地时间用二次方程正根。
3. **B 模式预测落点**：先水平发射测 \(R\) 反推 \(v_0\)，再自己放 0.20 m 杯口打一次；揭晓前不能从界面漏出真值。
4. 走 Superpowers：**brainstorm → 规格 → 计划 → 按任务实现（TDD 模型）→ 整分支审查 → 本地合并 `main`**。
5. 修了两个「看起来像没画出来」的显示问题：目录卡预览只写在动画里、实验台 WebGL 高度为 0 把相机送到无穷远。

---

## 2. 两种教法为什么放在同一台

斜向拉力是「调参数、看受力与运动」。抛体还要练 **先测再预测**：学生不能一开始就看见 \(v_0\)。

| 模式 | 学生做什么 | 界面 |
|------|------------|------|
| A 参数实验 | 滑条改 \(v_0,\theta,h,g\)，看抛物线与 \(x,y,v_x,v_y\)–\(t\) | 左栏公式 + 四图一直开着 |
| B 预测落点 | ① 水平发射读 \(R\) ② 估算 \(v_0\)（5% 核对）③ 放杯再打 ④ 看命中 / \(\Delta x\) | 揭晓前：`|v|` 为「—」、右栏测量板、不画速度箭头 |

切换按钮在命令栏标题和读数之间。**不要**给 Canvas 加 `key={mode}`，否则切模式会拆掉 WebGL、闪一下。

架构选的是方案 1：一个 `ProjectileLab` + 两个纯模型文件。方案 2（两个完整实验台）切模式会重建画布；方案 3（先抽公共壳）要改已经上线的拉力 / 匀变速台，回归面太大。

---

## 3. 物理模型（纸面坐标，y 向上）

参数：`ProjectileParams = { v0, thetaDeg, h, g }`。three.js 本来就是 y 向上，**不再**像斜向拉力那样把 z 映射成竖直。

落地时间：

\[
t_L=\dfrac{v_0\sin\theta+\sqrt{v_0^2\sin^2\theta+2gh}}{g}
\]

水平发射时 \(t_L=\sqrt{2h/g}\)，\(R=v_0 t_L\)，反推 \(v_0=R\sqrt{g/2h}\)。  
命中：落点与杯心水平距离 \(\le 0.10\,\mathrm{m}\)（杯口宽 0.20 m）。

时钟：`requestAnimationFrame` 推进 \(t\)，位置用闭式 `sampleAt`，到 \(t_L\) 自动暂停。改任一参数先暂停并回到 \(t=0\)。

B 模式防泄漏（揭晓前）：

- 顶栏 `|v|` 显示「—」（实现里仍带着单位，写成「— m/s」）
- 右栏测量板，不画四图
- 3D 不画速度箭头
- 相机取景按 \(v_0=8.00\,\mathrm{m/s}\)（隐藏值上限），避免视野大小暗示真值

模型文件：

```text
lib/models/projectile.ts                 # 飞行时间、射程、轨迹、取景范围
lib/models/projectile-prediction.ts      # 隐藏 v0、阶段机、核对、命中
lib/models/time-series.ts                # 与拉力台共用的采样追加
lib/models/camera-fit.ts                 # 画布太小时不取景（Session 后半补）
```

测试：`npm test`（抛体 + 预测机 + 时间序列 + 目录；后半加上 `camera-fit`）。

---

## 4. 实验台怎么搭

外壳对齐斜向拉力：52px 命令栏，三栏 `260px / 1fr / 330px`，桌面 1366×768 **不要整页滚动**。

```text
components/projectile-lab.tsx              # mode、时钟、左栏切换
components/projectile-canvas.tsx           # R3F 边界（dynamic、禁 SSR）
components/projectile-scene.tsx            # 网格、尺、发射器、杯、速度箭头
components/projectile-prediction-panel.tsx # B 三步栏
components/projectile-measurement-board.tsx
components/scene-label.tsx                 # 从拉力台抽出来的 Sprite 标签
app/labs/[slug]/page.tsx                   # slug projectile-motion
lib/experiments/catalog.ts                 # status: ready
design-system/physics-lab/pages/projectile-motion.md
```

**不要改**：`pull-friction-lab.tsx`、`linear-motion-lab.tsx`、`pull-friction-scene.tsx`。图表只把 `TimeSeriesChart` 泛型化；短飞行的横轴后来加了可选 `minDuration`（默认 10 s，抛体传 `max(t_L, 1)`），否则 0.5–0.8 s 的线会缩在左边一小截。

整分支审查还改过：B 命中时不要同时画琥珀色 `x=…` 和绿色「命中」，两个标签会叠在一起。有杯子时只留杯子上的字。

---

## 5. Superpowers 流程（这次怎么走）

```text
brainstorm（澄清双模式）
  → 规格 docs/superpowers/specs/2026-09-05-projectile-lab-design.md
  → 计划 docs/superpowers/plans/2026-09-05-projectile-lab.md
  → 按任务实现 + 每任务审查
  → 整分支审查
  → 本地 merge main，删 feat/projectile-lab
```

功能分支上的主要提交（合并前）：

| 提交 | 内容 |
|------|------|
| `44081bb` | 抛体运动学模型 |
| `4582838` | 预测模式状态机 |
| `6d6d0b3` | 共享时间序列、泛型图表 |
| `611adb8` | 3D 场景 |
| `74e861c` | 预测面板与测量板 |
| `f73bd3b` | 实验台、目录、路由 |
| `6fcd510` | 设计系统页 |
| `5c96e94` | Session 4 截图与验收笔记 |
| `8f9ab56` | 命中标签错开、图表按飞行时间缩放 |
| `2bd53ea` | 目录预览静止位姿；相机拒绝 0 高画布 |

合并：`main` 对 `feat/projectile-lab` **快进**。工作区里 `.cursor/skills/` 的无关改动没有带进这些提交。

浏览器验收注意：

- 用 `localhost`，不要用 `127.0.0.1`（Next 会拦跨源 `/_next`）。
- 自动化标签里 `requestAnimationFrame` 会被节流，看起来像「卡在空中」；`Emulation.setFocusEmulationEnabled` 之后时钟才正常。
- 详细勾选表和两张图在 Session 4。

---

## 6. 两个显示 bug（合并之后修）

学生反馈：首页动态预览不转、有的卡像没图；实验台「三维轨迹与速度」是灰的。

### 6.1 目录预览停在 \((0,0)\)

小车、滚轮、抛体的位置写在 `@keyframes` 里。卡片还没进 Intersection Observer、系统开了「减少动态效果」，或点了「暂停预览」时，动画不跑，元素就停在 SVG 原点，看起来像空白。

修法：给这些元素一个 **静止位姿**（`transform` / `offset-distance: 0%`），动画加 `fill-mode: both`；`prefers-reduced-motion` 时直接 `animation: none`，靠静止位姿露出来。卡片默认当作可见，Observer 阈值放宽。拉力预览的 WebGL 外包一层 `absolute inset-0`，避免和实验台一样高度塌掉。

核对：隔 400 ms 读一次计算样式，抛体 `offset-distance` 从约 58% 走到 74%，匀变速方块和碰撞小车也在动。

### 6.2 3D 视口高度为 0

中间栏 flex 子项有时算出来高度是 0。`FitCamera` 用 `size.width / size.height` 取景，高为 0 时距离变成 `Infinity`，只剩灰底。

修法：中间画布容器 `min-h-[280px]` + `absolute inset-0` 铺满；`fitViewDistance` 在宽或高 \(< 8\,\mathrm{px}\) 时返回 `null`，等真正有尺寸再对相机。桌面 `.lab-workspace` 补 `grid-template-rows: minmax(0, 1fr)`。

核对：打开 `/labs/projectile-motion` 后能看到网格、发射器、虚线抛物线和速度箭头。

---

## 7. 本次交付现状（Session 6 结束时）

- `/labs/projectile-motion`：A / B 双模式，闭式物理，目录第三张卡可进。
- 设计系统页 + Session 4 落地 / 命中截图。
- 目录预览有静止位姿，实验台 3D 不再因高度 0 消失。
- `main` 已含抛体实验台。合并之后又提交：`2bd53ea`（目录预览静止位姿 + 相机不因 0 高塌缩）、`4f1bea9`（数字输入可超出滑条范围）。

关键入口：

```text
http://localhost:3000/                       # 目录
http://localhost:3000/labs/projectile-motion # 抛体落点
```

---

## 8. 个人收获

- 同一套视口可以服务两种课：演示参数 和 先测后预测；泄漏点要列清单（读数、图、箭头、相机取景）。
- 课本抛体用闭式解就够，不必上数值积分；时钟只负责 \(t\)，位置永远 `sampleAt`。
- 3D「没画面」先量 Canvas 的 CSS 宽高，再查相机；高为 0 时任何取景公式都会坏。
- CSS 动画如果同时承担「运动」和「初始位置」，暂停或 `animation: none` 会把图形藏没；静止位姿和动画要分开写。
- 自动化浏览器里的 rAF 节流会伪装成产品卡死，先复现再下结论。

---

## 9. 后续可做

- B 暂停时的状态文案、场景标题「三维轨迹与速度」、揭晓前「— m/s」的单位，都还是小瑕疵。
- 目录卡预览画布会抢走鼠标点击，键盘 Enter 可进；可再改点击命中。
- 按 Physics 1 未覆盖单元继续做实验台（能量、动量、转动、振动、流体）。

---

*本文件用于课程 / 学习证据归档，对应 Session 6。抛体实验台的浏览器勾选与截图见 Session 4。目录页考纲梳理见 Session 5。*

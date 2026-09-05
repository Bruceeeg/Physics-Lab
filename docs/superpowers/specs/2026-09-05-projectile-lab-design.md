# 抛体落点实验台 设计规格

**日期**：2026-09-05
**状态**：设计已确认，待写实现计划
**目录条目**：`projectile-motion`（AP Physics 1 / Unit 1 运动学），现为 `pending`，本次转为 `ready`

---

## 1. 目标

参照斜向拉力实验台的仪器外壳，做一个抛体运动实验台，包含两种模式，顶栏一个分段按钮切换：

- **A 参数实验**：随时可调 v₀、θ、h、g，看轨迹、落点和四张运动学图。
- **B 预测落点**：v₀ 对学生隐藏。先水平发射，用射程和高度反推 v₀；再改高度或角度，输入预测落点，放置标靶，发射后判定命中。

物理在 TypeScript 纯函数里算，WebGL 只负责显示。

---

## 2. 已确认决策

| 项 | 决定 |
|---|---|
| 代码结构 | 一个实验台组件 `projectile-lab.tsx` 持有 `mode`，两个纯函数模型文件，3D 场景与图表两模式共用 |
| 视口 | 3D WebGL（React Three Fiber），可拖动旋转，与斜向拉力实验台一致 |
| B 模式流程 | v₀ 隐藏；阶段 1 反推 v₀ 并核对；阶段 2 输入预测落点、放标靶、发射判定 |
| 坐标 | 模型与界面用教材约定：x 水平，y 竖直向上。three.js 默认 y 向上，直接对应，不做 z→y 映射 |
| 运行中改参 | 任何参数变化都自动重置到 t = 0 再套用新参数（闭式解下中途改参会让球瞬移） |
| 空气阻力 / 质量 / 反弹 | 不做 |
| 2D 力图小窗 | 不做 |

---

## 3. 文件

新增：

| 文件 | 职责 |
|---|---|
| `lib/models/projectile.ts` | 抛体运动学闭式解、采样、轨迹、由射程反推 v₀ |
| `lib/models/projectile.test.ts` | 模型测试 |
| `lib/models/projectile-prediction.ts` | B 模式状态机：隐藏 v₀、阶段流转、核对与命中判定 |
| `lib/models/projectile-prediction.test.ts` | 状态机测试 |
| `components/projectile-lab.tsx` | 实验台组件：顶栏、模式切换、时钟、左栏 A/B、右栏 |
| `components/projectile-scene.tsx` | R3F 场景：地面米尺、发射台、小球、轨迹、箭头、标靶、相机取景 |
| `components/projectile-canvas.tsx` | `Canvas` 包装，`dynamic` + `ssr: false` 引入 |
| `design-system/physics-lab/pages/projectile-motion.md` | 页面级设计规则 |

修改：

| 文件 | 改动 |
|---|---|
| `lib/experiments/catalog.ts` | `ReadySlug` 加 `"projectile-motion"`；条目改 `ready`，上移到 `linear-motion` 之后；更新 `summary` |
| `lib/experiments/catalog.test.ts` | ready 列表与详情路由断言包含三项 |
| `app/labs/[slug]/page.tsx` | `LAB_PAGES` 加 `"projectile-motion": ProjectileLab` |
| `app/globals.css` | 顶栏增加一个模式切换列的修饰类 |
| `components/kinematic-charts.tsx` | `TimeSeriesChart` 的 `points` / `valueKey` 泛型化为 `T extends { t: number }`，数值键；两个已有实验台行为不变 |

---

## 4. 物理模型 `lib/models/projectile.ts`

### 参数与状态

```ts
type ProjectileParams = { v0: number; thetaDeg: number; h: number; g: number };
type ProjectileSample = { t: number; x: number; y: number; vx: number; vy: number };
```

时钟状态只有 `t`。位置、速度由 `t` 和参数算出。

### 公式

- x = v₀cosθ·t
- y = h + v₀sinθ·t − ½gt²
- vₓ = v₀cosθ
- v_y = v₀sinθ − gt
- 落地时间 t_L = (v₀sinθ + √(v₀²sin²θ + 2gh)) / g
- 射程 R = v₀cosθ·t_L
- 最高点 y_max = h + (v₀sinθ)² / 2g（θ = 0 时 y_max = h）

### 函数

| 函数 | 说明 |
|---|---|
| `flightTime(params)` | t_L。h = 0 且 θ = 0 时返回 0 |
| `range(params)` | R |
| `apexHeight(params)` | y_max |
| `sampleAt(params, t)` | t 钳到 [0, t_L] 后的 `ProjectileSample` |
| `trajectory(params, n = 80)` | 0 到 t_L 均匀 n+1 个样本，画虚线预测轨迹 |
| `inferV0FromRange(R, h, g)` | 水平发射反推：R·√(g / 2h)。h ≤ 0 时返回 NaN |
| `appendSample(prev, sample, interval = 1/30)` | 与斜向拉力 `appendKinematicSample` 同样的去重、限频、压缩规则 |

### 退化情形

h = 0 且 θ = 0：t_L = 0，球在原点即落地。状态栏提示「初速度水平且高度为 0，抛体立即落地」，不算参数错误。

---

## 5. 时钟

- `requestAnimationFrame` 推进 `t`，每帧 dt 上限 0.05 s。
- t 到 t_L 时钳到 t_L 并自动暂停，状态栏「已落地，x = … m」。
- 开始 / 继续、暂停、重置三个按钮与斜向拉力实验台相同。B 模式下「开始」文字为「发射」。
- 重置：t = 0，清空轨迹、图表历史、落点标记（B 模式同时清 `lastLandingX`）。B 模式下阶段、h、θ、已填输入保留；若处于 `result`，重置等同于「再预测一次」。
- 参数变化（滑条或数字输入）：先暂停并重置，再套用新参数。

---

## 6. 预测模式状态机 `lib/models/projectile-prediction.ts`

纯函数，随机源以参数注入。

### 常量

| 名称 | 值 |
|---|---|
| `HIDDEN_V0_MIN` / `HIDDEN_V0_MAX` | 2.00 / 8.00 m/s，两位小数均匀取值 |
| `V0_TOLERANCE` | 相对误差 5% |
| `TARGET_HALF_WIDTH` | 0.10 m（标靶宽 0.20 m） |
| `PREDICTION_G` | 9.81，B 模式 g 锁定 |
| h 范围 | [0.2, 3] m（反推 v₀ 需要 h > 0） |
| θ 范围 | 阶段 1 锁 0°；阶段 2 [0, 80]° |

### 状态

```ts
type PredictionPhase = "measure" | "predict" | "result";
type PredictionState = {
  phase: PredictionPhase;
  hiddenV0: number;
  h: number;
  thetaDeg: number;
  v0Estimate: number | null;      // 学生填写的估算值
  v0Accepted: boolean;            // 核对是否通过
  xPredicted: number | null;      // 学生填写的预测落点
  targetPlaced: boolean;
  lastLandingX: number | null;    // 最近一次落地 x
  outcome: { hit: boolean; deltaX: number } | null;
};
```

### 流转

| 阶段 | 学生能改 | 学生看到 | 学生输入 | 通过条件 |
|---|---|---|---|---|
| `measure` 测初速度 | h | θ = 0° 与 g = 9.81 只读；v₀ 显示「?」；发射落地后地面标出 R | v₀ 估算值，按「核对」 | \|估算 − 真值\| / 真值 ≤ 5% → `predict`；否则提示「偏差超过 5%，重新计算」，不给方向，可反复发射 |
| `predict` 预测落点 | h、θ | v₀ 仍隐藏，显示「你的估算 ≈ 4.12 m/s」 | 预测落点 x，按「放置标靶」；未放标靶时「发射」禁用 | 落地后 \|x_L − x_pred\| ≤ 0.10 m → 命中；进入 `result` |
| `result` 结果 | 无 | 揭示真值 v₀、实际 x、预测 x、Δx、命中 / 未命中；此时才显示四张图与速度箭头 | 「再预测一次」→ `predict`，保留 v₀，清空 x_pred 与结果；「换一组数据」→ `measure`，重新生成 v₀，清空全部输入 | 无 |

### 函数

| 函数 | 说明 |
|---|---|
| `createPrediction(random)` | 生成隐藏 v₀，进入 `measure`，h = 1.0 |
| `predictionParams(state)` | 组装 `ProjectileParams`（`v0: hiddenV0, g: PREDICTION_G`） |
| `recordLanding(state, x)` | 写入 `lastLandingX`；`predict` 阶段同时计算 `outcome` 并进入 `result` |
| `submitV0Estimate(state, value)` | 按 5% 判定，通过则进入 `predict` |
| `placeTarget(state, x)` | 写入 `xPredicted`，`targetPlaced = true` |
| `setHeight` / `setTheta` | 钳到范围；θ 只在 `predict` 可改 |
| `retryPrediction(state)` | 回 `predict`，保留 v₀ |
| `newDataset(state, random)` | 重新生成 v₀，回 `measure` |

### 防泄露

阶段 `measure` 与 `predict` 期间：

- 顶栏 |v| 显示「—」。
- 右栏不显示实时图，改为「测量板」：h、θ、g、落点 R；`predict` 阶段追加预测 x、实际 x、Δx。
- 3D 场景不画速度箭头，只画重力箭头 G。
- 相机取景用 v₀ = 8.00 m/s（隐藏区间上限）算出的轨迹，不用真值。

图表历史在 B 模式下照常记录，只是不渲染。进入 `result` 后整体揭示：四张图显示本次飞行的完整历史，速度箭头出现，左栏显示真值 v₀。

学生输入框：v₀ 估算值与预测落点 x 都是数字输入，步长 0.01，按 Enter 或点按钮提交，非数字输入忽略。

隐藏 v₀ 只在事件处理里生成（切到 B、「换一组数据」），避免 SSR 水合不一致。

---

## 7. 页面布局与交互 `components/projectile-lab.tsx`

外壳沿用斜向拉力实验台：52px 顶栏，`260px / 1fr / 330px` 三栏，1366×768 无文档滚动；小屏走已有的滚动回退。字体 IBM Plex Sans + Noto Sans SC，数字 IBM Plex Mono `tabular-nums`。圆角 2px，细线边框，无阴影。

### 顶栏

从左到右：`目录 / 抛体落点实验台`（副标题 `Physics Lab / 运动学`）→ 分段按钮 **[参数实验 | 预测落点]** → 三个读数（t、|v|、x）→ 状态文案 → 开始 / 继续（B 模式为「发射」）、暂停、重置。

`globals.css` 为此加修饰类 `.lab-commandbar--modes`，列模板 `190px auto 330px minmax(0, 1fr) auto`；小屏时分段按钮与标题同列换行。

### 模式切换

- 暂停，清空 t、轨迹、图表历史。
- A 的四个参数与 B 的 `PredictionState` 分开保存，来回切换不丢。B 处于 `result` 时切走，先执行 `retryPrediction`（飞行数据已清，结果页无内容可展示），回来时停在 `predict`。
- 首次进入 B 时调用 `createPrediction`。
- 3D `Canvas` 不卸载，只换传入的 props。

### 左栏 A

| 参数 | 范围 | 步长 | 默认 |
|---|---|---|---|
| v₀ | 0.5 – 12 m/s | 0.1 | 5 |
| θ | 0 – 80° | 1 | 30 |
| h | 0 – 3 m | 0.05 | 1.0 |
| g | 1 – 20 m/s² | 0.01 | 9.81 |

每个参数数字输入 + 滑条（复用 `ParameterControl`）。公式块实时代入并显示 t_L、R、y_max。

### 左栏 B

顶部三步进度条（测初速度 → 预测落点 → 结果），当前步高亮。下面按阶段显示：

- `measure`：h 控件；θ、g、v₀ 只读行；落地后显示「落点 R = … m」；v₀ 估算输入框 + 「核对」按钮 + 反馈。
- `predict`：h、θ 控件；「你的估算 ≈ … m/s」；预测落点输入框 + 「放置标靶」按钮。
- `result`：真值 v₀、预测 x、实际 x、Δx、命中 / 未命中；「再预测一次」「换一组数据」两个按钮。

公式块只列公式不代数字：v₀ = R√(g/2h)；t_L = (v₀sinθ + √(v₀²sin²θ + 2gh))/g；x = v₀cosθ·t_L。

### 右栏

- A：四张 `TimeSeriesChart`：x–t navy `#1E3A5F`，y–t gold `#A16207`，vₓ–t blue `#2563EB`，v_y–t violet `#6D28D9`。
- B `measure` / `predict`：测量板（见第 6 节）。
- B `result`：四张图，显示本次飞行历史。

### 状态文案

| 情形 | 文案 |
|---|---|
| A，t = 0 | 「调整参数后按开始。预测射程 R = … m」 |
| 飞行中 | 「抛体在空中，t = … s」 |
| 已落地 | 「已落地，x = … m」 |
| h = 0 且 θ = 0 | 「初速度水平且高度为 0，抛体立即落地」 |
| B `measure` | 「水平发射，读出落点 R 和高度 h，反推 v₀」 |
| B `predict` 未放标靶 | 「输入预测落点并放置标靶后才能发射」 |
| B `result` | 「命中，Δx = … m」或「未命中，Δx = … m」 |

---

## 8. 3D 场景 `components/projectile-scene.tsx`

- **地面**：纸面材质，沿 +x 铺米尺，每 0.5 m 一刻度，每 1 m 一个数字标签。标签复用斜向拉力的 sprite 标签方式。
- **发射台**：x = 0 处细立柱到高度 h，顶端一段短炮管按 θ 倾斜。
- **小球**：slate `#3D5A80`，半径 `max(0.04, 0.012 × 场景宽度)`。
- **已飞轨迹**：amber `#B45309`，点距 ≥ 0.02 m 才追加，最多 400 点。
- **预测轨迹（仅 A）**：navy 虚线 + 预测落点环，随参数实时更新。
- **箭头**：v 实线 `#2563EB`；vₓ、v_y 虚线 `#60A5FA`；G 绿 `#047857`。长度按量值编码，复用 `force-display` 的箭头绘制。B 模式 `measure` / `predict` 阶段只画 G。
- **落点**：落地后 amber 落点盘 + 标签 `x = 1.83 m`。
- **标靶（仅 B）**：宽 0.20 m 小杯放在 x_pred，navy；命中变绿 `#047857` 并标「命中」，未命中变红 `#DC2626` 并标 Δx。
- **相机**：`OrbitControls` 可拖动旋转，默认侧视略俯。t = 0 且参数变化时自动取景框住整条轨迹（含 y_max 与 R）；A 用预测轨迹，B 用 v₀ = 8.00 m/s 的轨迹。运行中不动相机。
- 无世界坐标轴 helper。

---

## 9. 目录与路由

- `catalog.ts`：`ReadySlug = "pull-friction" | "linear-motion" | "projectile-motion"`；条目 `status: "ready"`，上移到 `linear-motion` 之后；`summary` 改为「平抛或斜抛：参数实验直接调 v₀、θ、h；预测模式先测初速度再预测落点。」；`formula` 保持 `x = v₀t, y = ½gt²`。
- 卡片预览沿用 `SchematicPreview` 的 `projectile` 动画，不新写预览组件。
- `page.tsx`：`LAB_PAGES["projectile-motion"] = ProjectileLab`。

---

## 10. 设计系统页面文件

`design-system/physics-lab/pages/projectile-motion.md`，与 `pull-friction.md` 同结构：意图、布局、字体、颜色（上表色值）、运动（rAF 时钟、CSS 过渡 150–200ms、`prefers-reduced-motion` 只管 CSS）、控件与图表。

---

## 11. 测试与验收

### 模型测试 `projectile.test.ts`

- 水平发射 t_L = √(2h/g)，R = v₀·t_L。
- 斜抛 `sampleAt(params, flightTime(params)).y ≈ 0`。
- `inferV0FromRange(range(p), p.h, p.g) ≈ p.v0`（θ = 0）。
- `sampleAt` 对 t < 0 与 t > t_L 钳位。
- h = 0 且 θ = 0 → t_L = 0。
- `appendSample` 去重、限频、压缩。

### 状态机测试 `projectile-prediction.test.ts`

- 注入随机源：v₀ 落在 [2.00, 8.00]，两位小数。
- 5% 边界：恰好 5% 通过，5.01% 不通过。
- 标靶边界：Δx = 0.10 命中，0.101 未命中。
- 阶段流转：`measure` → `predict` → `result`；`retryPrediction` 保留 v₀ 并清空 x_pred 与结果；`newDataset` 更换 v₀ 并回 `measure`。
- `measure` 阶段 `setTheta` 无效。

### 目录测试

- `listExperimentSlugs()` 为 `["pull-friction", "linear-motion", "projectile-motion"]`。
- Physics 1 前三项为 ready。

### 浏览器检查

- 1366×768 两种模式均无文档滚动。
- 切换模式时 Canvas 不重建（相机角度保留）。
- A：改参数 → 自动重置；落地自动暂停；四张图与读数一致。
- B：完整走一遍到命中与未命中；`measure` / `predict` 期间顶栏 |v| 为「—」、无实时图、无速度箭头；`result` 后揭示。
- 目录首页出现抛体卡片且可点进。

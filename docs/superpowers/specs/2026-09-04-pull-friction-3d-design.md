# 斜向拉力 + 摩擦 3D 实验台 — 设计规格

**日期**：2026-09-04  
**状态**：待用户确认后写实现计划  
**替换对象**：当前首页 `LinearMotionLab`（2D 匀变速直线运动）

---

## 1. 已确认决策

| 项 | 决定 |
|---|---|
| 首页 | 直接换成本实验。旧 2D 匀变速页不再作为首页，本版不保留第二路由。 |
| 夹角 θ | 仅 0°–80° 斜向上拉，不做斜向下压。 |
| 播放中改参 | 滑条始终可调。保留当前位置与速度，立刻用新参数重算力、加速度和分支告警。不自动重置时间。 |

「重置」仍把状态拉回原点静止、`t = 0`、清空轨迹。

---

## 2. 实验对象

粗糙**水平地面**上的刚体滑块（按质点 + 接触约束建模，不滚动、不形变）。从静止开始。受**大小方向恒定**的拉力 \(\vec F\)（直到用户改参数）。

坐标系：地面为 \(xy\) 平面，\(+x\) 为默认拉动方向，\(+z\) 竖直向上。本版运动发生在 \(xz\) 平面（无 \(y\) 向力）。

重力 \(\vec G = (0,0,-mg)\)。拉力与水平面夹角为 \(\theta\)：

\[
F_x = F\cos\theta,\quad F_z = F\sin\theta
\]

---

## 3. 可配置参数

| 符号 | 含义 | 单位 | 范围 | 默认 |
|---|---|---|---|---|
| \(F\) | 拉力大小 | N | 0–50 | 20 |
| \(\theta\) | 与水平夹角 | ° | 0–80 | 30 |
| \(m\) | 质量 | kg | 0.5–10 | 2 |
| \(\mu_s\) | 静摩擦系数 | — | 0–1.2 | 0.4 |
| \(\mu_k\) | 动摩擦系数 | — | 0–1.2 | 0.3 |
| \(g\) | 重力加速度 | m/s² | 1–20 | 9.81 |
| \(T\) | 观察总时长 | s | 2–20 | 8 |

约束：若用户把 \(\mu_k\) 调到大于 \(\mu_s\)，**把 \(\mu_k\) 钳到 \(\mu_s\)**，并在参数旁用一句说明「动摩擦不超过静摩擦」。

播放时钟与现页相同：真实时间推进，开始 / 暂停 / 重置。到 \(T\) 自动停。

---

## 4. 力学分支（求解器，不用 Rapier）

接触法向（贴地时）：

\[
N = mg - F\sin\theta
\]

**分支 A — 离地**：\(N \le 0\)，即 \(F\sin\theta \ge mg\)。

- 无支持力、无摩擦。
- \(a_x = F\cos\theta / m\)，\(a_z = (F\sin\theta - mg)/m\)。
- 位置用当前 \((x,z,v_x,v_z)\) 积分。落到 \(z=0\) 且 \(v_z\le 0\) 时重新进入接触判定（本版采用**无弹性落地**：\(v_z \leftarrow 0\)，再按贴地分支算水平运动）。落地瞬间若仍 \(N\le 0\) 则继续离地。

**分支 B — 贴地静止**：\(N > 0\)，且水平速度 \(|v_x| < \varepsilon\)（\(\varepsilon = 10^{-4}\,\mathrm{m/s}\)），且 \(|F_x| \le \mu_s N\)。

- \(a_x = a_z = 0\)，\(v_x = 0\)，\(z = 0\)。
- 静摩擦 \(f_s = -F_x\)（平衡水平分力）。
- 告警：**拉力无法拉动物体**。

**分支 C — 贴地滑动**：\(N > 0\) 且不满足 B。

- \(z = 0\)，\(v_z = 0\)，\(a_z = 0\)。
- 动摩擦大小 \(\mu_k N\)，方向与 \(v_x\) 相反；若刚从静止被拉动（\(|v_x|<\varepsilon\) 但 \(|F_x| > \mu_s N\)），摩擦与 \(F_x\) 相反。
- \(a_x = (F_x + f_k)/m\)，其中 \(f_k = -\mu_k N\cdot \mathrm{sgn}\)（sgn 按上一句）。
- 若滑动中速度穿过 0：先用剩余时间按静止判据再判定，避免振荡。
- 告警：**沿 +x 方向运动**（本版 \(\theta\in[0,80^\circ]\) 时 \(F_x\ge 0\)；若改参后瞬时 \(v_x<0\)，按实际速度方向提示）。

离地告警：**将被拉离地面**（判定为 A 但 \(z=0\) 尚未离开）或 **已离开地面**（\(z>0\)）。

纯函数接口（实现时锁定此形状）：

```ts
type PullParams = { F: number; thetaDeg: number; m: number; muS: number; muK: number; g: number };
type PullState = { t: number; x: number; z: number; vx: number; vz: number };
type PullForces = { Fx: number; Fz: number; N: number; f: number; G: number };
type PullMode = "static" | "sliding" | "liftoff" | "airborne";

function derive(params: PullParams, state: PullState): {
  mode: PullMode;
  forces: PullForces;
  ax: number;
  az: number;
  alert: "stuck" | "moving-plus" | "moving-minus" | "will-lift" | "airborne";
};

function step(params: PullParams, state: PullState, dt: number): PullState;
```

`step` 用固定上限的 `dt`（例如 1/240 s 追赶）。贴地用半隐式欧拉或 RK4；离地同。

**改参（live）**：只替换 `params`，不改 `state` 的 \(x,z,v,t\)。下一帧 `derive`/`step` 用新力。轨迹继续追加，不清空。若新参数使物体从滑动变为静止，速度钳到 0。

---

## 5. 架构

沿用「模型与视图分离」：

| 单元 | 路径 | 职责 |
|---|---|---|
| 模型 | `lib/models/pull-friction.ts` | `derive` / `step`，无 React、无 Three |
| 测试 | `lib/models/pull-friction.test.ts` | 拉不动、临界 F、离地、\(\theta=0,\mu=0 \Rightarrow a=F/m\)、live 改 F |
| 实验台 UI | `components/pull-friction-lab.tsx` | 参数、告警、公式、时钟、读数 |
| 3D 画布 | `components/pull-friction-scene.tsx` | R3F 地面、滑块、箭头、轨迹；`ssr: false` |
| 首页 | `app/page.tsx` | 只挂新实验台 |
| 设计覆盖 | `design-system/physics-lab/pages/pull-friction.md` | 允许 WebGL 仅用于本实验视口 |

时钟：复用现页的 `originWall` / `originTime` 真实时间循环。开始 / 暂停 / 重置。

状态：参数与读数在 React state；位姿高频写 `ref`，每帧同步读数。3D 用 `useFrame` 读 ref。

依赖：`@react-three/fiber`、`@react-three/drei`、`three`。不用 Rapier/Cannon。测试用 Node 可跑的 Vitest 或 `node:test` + `tsx`（实现计划里选定一种，不引入 Jest 除非必要）。

---

## 6. 界面

视觉继承现实验台：纸面 `#F8FAFC`、藏青 `#1E3A5F`、金 `#A16207` 只编码第二数据系列、IBM Plex、细线、2px 圆角。**本页允许 WebGL**，仅限中央实验视口；控件 CSS 仍 150–200ms，尊重 `prefers-reduced-motion`（物理时钟不停）。

桌面（≥1024px）：

1. 顶栏：标题「斜向拉力实验台」+ 本构关系短式 + 走时 + 开始/暂停/重置  
2. 告警条：当前 `alert` 的完整中文句子（不只靠颜色）  
3. 左列：六个物理滑条 + \(T\)；受力读数 \(N,f,a_x,a_z,v\)  
4. 右列主区：3D 视口  
5. 左列下或视口下：公式列表，**当前分支那一条高亮为「正在使用」**，代入数字随参数变  

&lt;1024px：视口在上，参数在下，单列。

3D 内容：水平网格地面、长方体滑块、力箭头 \(F,G,N,f\)（长度与大小成比例；\(N=0\) 或离地时不画 \(N\)；静止画静摩擦，滑动画动摩擦）、仅已走路径的轨迹。相机 `OrbitControls` 限制俯仰，默认侧前方看清 \(\theta\)。

公式（始终列出，高亮当前）：

- \(N = mg - F\sin\theta\)
- 静摩擦判据 \(|F\cos\theta| \le \mu_s N\)
- \(\sum F_x = ma_x\)（滑动：\(F\cos\theta - \mu_k N = ma_x\)）
- 离地：\(N=0\)，\(a_z = (F\sin\theta - mg)/m\)

---

## 7. 测试与验收

模型单测至少覆盖：

1. \(\theta=0,\mu_s=\mu_k=0 \Rightarrow a_x=F/m,a_z=0\)  
2. \(F\) 小于 \(\mu_s mg/(\cos\theta+\mu_s\sin\theta)\) → `stuck`  
3. \(F\sin\theta \ge mg\) → `will-lift` / `airborne`  
4. 从 stuck 把 \(F\) 加大超过阈值 → 下一 `derive` 为 sliding  
5. live 改参：state.x 不变，forces 变  

浏览器：开始跑满 \(T\)；暂停时间冻结；重置回原点；拉不动时滑块不动；离地时滑块离开地面；改 \(F\) 箭头立刻变。

---

## 8. 不做（本版）

- Rapier/Cannon 当主求解器  
- 滚动、绳弹性、斜向下压  
- 账号、后端  
- 保留旧 2D 匀变速首页或第二路由  
- GSAP、装饰性大动效  

---

## 9. 成功标准

学生能配置 \(F,\theta,m,\mu_s,\mu_k,g\)，在 3D 里看到对应受力分析、加速度和实时速度，用开始/暂停/重置反复观察；拉不动、运动方向、离地三类情况有明确文案；屏幕上的公式与当前动画分支、当前数字一致。

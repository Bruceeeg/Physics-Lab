# Session 8 学习记录

**日期**：2026-09-11  
**主题**：三条显示规范落地；把 Physics 2 与 Physics C 从「等待开发」做成可进实验台；目录示意图纠错  
**项目**：Physics Lab  
**相关对话**：[Project standardization rules](98bf6c80-624f-442f-a070-c7dfd09c25cb)、[Physics 2 experiments setup](b06fe03e-d487-4877-959f-0119415ad39d)、[Physics C and 1, 2 experiments](c42d6042-5cd8-4347-8e71-392264348675)  
**功能提交**：`b401b9e`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 把三条全项目约定写成规格，再改代码：读数两位小数、力学必须拆水平 / 竖直、静摩擦和滑动摩擦按接触状态切换。
2. Session 7 结束时 Physics 2 / C 还是目录占位。本次按同一套驾驶舱（左参数、中 3D、右四图）把 **Physics 2 十台**做成 `ready`。
3. Physics C 和 1 / 2 **重合的实验共用一张台**，首页切到 C 力学 / C 电磁就能进；考纲多出来的内容，要么加模式（滑轮惯量、弹道摆、复摆、高斯、螺线管），要么新开独立条目（\(\tau=I\alpha\)、电容、RL / LC）。
4. 目录动态示意图如果绳子断、球飞出轨道、滚动一跳一跳，那是 **CSS 几何**问题，不是物理模型坏了。
5. 物理仍用 **闭式解 / 分段解析解**，每台模型配 Node 测试。本次结束后 **173** 项通过。

流体仍只挂在 Physics 1。光学和近代物理不进 C 电磁。

---

## 2. 三条显示规范（对学生看见的界面）

规格：`docs/superpowers/specs/2026-09-11-lab-display-conventions.md`。  
Cursor 规则：`.cursor/rules/numeric-display.mdc`、`mechanics-xy-decomposition.mdc`、`friction-mode-display.mdc`。

| # | 规则 | 落地 |
|---|------|------|
| 1 | 计算保留两位小数 | 唯一入口 `formatLabNumber`（`lib/models/lab-format.ts`）。内部求解全精度，显示 `0.00`；近零 \(\lvert x\rvert<0.005\) 写成 `0.00`；非有限值写成 `—`。分量用 `formatLabSigned`（`+1.20` / `-0.30`）。很小的物理常数走 `formatLabSci`。 |
| 2 | 力学必须给水平和竖直 | 对学生：x 水平、y 竖直向上。斜向力用 `ForceWithXY`：实线合力，虚线水平 / 竖直投影。一维实验也写 \(y=0.00\)、\(v_y=0.00\)。斜向拉力场景内部竖直轴仍是模型里的 `z`，标签改成 \(F_y\)。斜面既保留沿面公式，也画实验室坐标的 \(N_x,N_y\)、\(a_x,a_y\)。 |
| 3 | 静 / 动摩擦按状态切换 | 模型导出 `frictionKind: "static" \| "kinetic" \| "none"`。静止展示 \(f_s\) 和 \(f_{s,\max}=\mu_s N\)；滑动展示 \(f_k=\mu_k N\)；无接触 \(f=0.00\)。无滑滚动是静摩擦，不是滑动摩擦。阿特伍德改进型补了 \(\mu_s\) 和真正的静止判定。 |

不要再在各个 lab 里手写平行的 `toFixed(2)`。参数滑条仍按 `step` 位数，那不是计算结果。

---

## 3. Physics 2：十台可进实验

对照 Session 5 的探究手册 + 2024–25 CED Unit 9–15，全部标成 `ready`：

| slug | 标题 | 核心关系 | 模式 |
|------|------|----------|------|
| `boyles-law` | 玻意耳定律 | 等温 \(PV=nRT\)；压缩功 \(nRT\ln(V_0/V_f)\) | 注射器等温压缩 |
| `thermal-conductivity` | 热导率 | \(H=kA\Delta T/L\) | 单棒 / 两种材料对照 |
| `electric-field` | 电场与电势 | \(E=kQ/r^2\)，\(\oint E\cdot dA=Q/\varepsilon_0\) | 点电荷 / 偶极 / 高斯球面 / 悬挂库仑 / 等势线 |
| `resistor-circuits` | 电阻电路 | \(\sum V=0\)，\(\sum I=0\) | 串联 / 并联 |
| `rc-circuits` | RC 电路 | \(\tau=RC\)；\(dQ/dt+Q/RC=\varepsilon/R\) | 充电 / 放电 |
| `magnetism` | 磁场 | \(B=\mu_0 I/(2\pi r)\) | 长直导线 / 条形磁铁 / 螺线管 |
| `electromagnetic-induction` | 电磁感应 | \(\varepsilon=-N\,d\Phi_B/dt\) | 磁铁穿线圈 / 滑动导轨 \(\varepsilon=B\ell v\) |
| `geometric-optics` | 薄透镜焦距 | \(1/f=1/s+1/s'\) | 凸透镜 / 凹透镜 |
| `waves-optics` | 波与物理光学 | \(v=f\lambda\) | 弦驻波 \(\lambda=2L/n\) / 双缝 \(\Delta y=\lambda L/d\) |
| `particle-model-of-light` | 光的粒子模型 | \(E=hf\) | LED 阈值 \(eV=hf\) / 光电效应 \(K_{\max}=hf-\varphi\) |

新文件落在 `components/p2/` 和 `lib/models/<name>.ts`。电路零件抽到 `circuit-parts.tsx`，避免每台复制电阻、电容、电表。

电路、光学、热学只遵守规则 1（两位小数），不强制 xy 分离和摩擦切换。

---

## 4. Physics C：重合实验怎么开，缺什么补什么

College Board 的 C 力学 / C 电磁和 1 / 2 **题材大量重叠**，差别是微积分写法（\(I=\int r^2\,\mathrm{d}m\)、变力做功、高斯定理、RL / LC）。

做法：目录条目可以属于多门课（`courses: ["p1","c-mech"]`）。同一 slug 进同一张实验台；切筛选只改单元标题。

**C 力学与 P1 共用**：匀变速、抛体、拉力、斜面、阿特伍德、圆周、能量、冲量、力矩、滚动、角动量、简谐。流体不进 C。

**C 电磁与 P2 共用**：电场、电阻电路、RC、磁场、电磁感应。几何光学、波动光学、近代物理不进 C。

按考纲在已有台上加的模式：

| 实验台 | 新模式 / 写法 | 对应 C 的增量 |
|--------|----------------|----------------|
| 阿特伍德 | 滑轮惯量 \(I=\tfrac12 MR^2\) | 两侧张力不同，分母加 \(I/R^2\) |
| 机械能守恒 | \(W=\int kx\,\mathrm{d}x=\tfrac12 kA^2\) | 变力做功 |
| 滚动 / 角动量 | \(I=\int r^2\,\mathrm{d}m=\kappa mr^2\) | 用积分定义转动惯量 |
| 冲量 | 弹道摆 \(mv=(M+m)V\) | 非弹性碰撞后用高度反推 \(v\) |
| 简谐 | 复摆 \(T=2\pi\sqrt{I/mgd}\) | \(I=I_{\mathrm{cm}}+md^2\) |
| 电场 | 高斯球面、悬挂库仑、等势线 | \(\oint E\cdot dA\)，\(E=-\nabla V\) |
| 磁场 | 螺线管 \(B=\mu_0 nI\) | 由 \(B\)–\(nI\) 斜率测 \(\mu_0\) |
| RC | 写成微分方程 | 初态近似短路，稳态近似断路 |

C 独有目录条目（有的仍复用上面那张台，只是卡片分开）：

| slug | 标题 | 实现 |
|------|------|------|
| `rotational-inertia` | 转动惯量测定 | 与 `rotation-n2` 共用 \(\tau=I\alpha\) 台 |
| `rotation-n2` | 转动的牛顿第二定律 | 新台 `components/p1/rotation-n2-*.tsx` |
| `ballistic-pendulum` | 弹道摆 | 复用冲量台的 ballistic 模式 |
| `physical-pendulum` | 复摆 | 复用简谐台的 physical 模式 |
| `equipotential` / `coulombs-law` | 等势线 / 库仑定律 | 复用电场台 |
| `capacitance` | 电容与电介质 | \(C=\kappa\varepsilon_0 A/d\)，\(U=\tfrac12 CV^2\) |
| `rl-circuits` | RL / LC | \(\tau=L/R\)，\(\omega=1/\sqrt{LC}\) |
| `solenoid` | 螺线管测定 \(\mu_0\) | 复用磁场台 |

`app/labs/[slug]/page.tsx` 用 `LAB_PAGES[experiment.slug]` 映射；同一组件可以挂多个 slug（`key={experiment.slug}` 避免切条目时状态串台）。

---

## 5. 目录示意图：看起来像物理错了，其实是动画几何

用户反馈：圆锥摆绳子断了、球飞出轨道、滚动一跳一跳、上坡卡住。

原因不是 `sampleAt` 算错，是预览 SVG 的变换中心、路径和球半径对不齐：

- **绳子断**：摆线绕一个原点转，球绕另一个原点转，看起来绳头离开球。修法：绳和球放进同一个 `transform-origin` 的组。
- **球飞起来 / 一跳一跳**：`offset-path` 是轨道中心线，球有半径，视觉上陷入或离开路面。滚动还叠了自转，路径拐角处半径方向突变。修法：路径贴着路面偏置；自转和质心位移绑在同一组。
- **上坡卡住**：预览周期和路径长度不匹配，或关键帧在坡脚速度不连续。改成整段路径上匀视觉速度，而不是按真实物理时间播（和 Session 7 机械能预览同一教训）。

新课预览（注射器活塞、电荷相斥、双缝、光子）写在 `schematic-preview.tsx` + `globals.css`。暂停或 `prefers-reduced-motion` 时仍靠静止位姿露出来（Session 6 的规则）。

---

## 6. 个人收获

- 显示规范和物理模型要分开：两位小数、xy 分解、摩擦标签是 **给学生看的契约**；求解器继续用全精度。
- 斜面只写 \(a=g(\sin\theta-\mu_k\cos\theta)\) 不够上课。实验室坐标里 \(G\) 竖直向下，\(N\) 和 \(f\) 才是斜的，必须再拆 \(N_x,N_y\)。
- 静摩擦不是「\(\mu_s N\) 一直作用」，静止时 \(f_s\) 等于驱动力，上限才是 \(\mu_s N\)。阿特伍德桌上滑车没有 \(\mu_s\) 就无法演示这条。
- AP 1 / 2 / C 大量共用装置。先共用实验台再加模式，比复制三份 3D 场景便宜，也避免同一公式三套 bug。
- 目录卡是广告片，不是仿真：视觉周期、绳连着球、球压在路上，比「时间按物理走」更重要。
- 很小的 \(\varepsilon_0\)、\(\mu_0\)、\(h\) 用普通两位小数会变成 `0.00`，所以才单独做 `formatLabSci`。

---

## 7. 本次交付现状

- 目录 **33** 个 `ready` slug（无 pending 卡）。
- Physics 1：14 台（含流体）。
- Physics 2：10 台。
- C 力学：与 P1 共用 12 台 + 转动惯量 / \(\tau=I\alpha\) / 弹道摆 / 复摆。
- C 电磁：与 P2 共用 5 台 + 等势线 / 库仑 / 电容 / RL / 螺线管。
- 力学台：两位小数、xy 虚线分力、摩擦按 `frictionKind` 切标签。
- 关于页按四门课的 CED 单元写了覆盖与缺口。
- 测试：`npm test` → **173** 通过。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/boyles-law
http://localhost:3000/labs/rotation-n2
http://localhost:3000/labs/pull-friction
http://localhost:3000/about
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 8. 后续可做

- 仍缺：二维碰撞、完整环轨道、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程。这些模拟器盖不住，实验设计 / 误差分析仍靠课堂。
- 斜向拉力对内仍用 \(F_z\) 当竖直，对外已经标 \(F_y\)；以后新实验不要再引入第三套轴名。
- 部分 C 独有卡片复用 P1 / P2 组件，切 slug 时要确认默认模式对（弹道摆不要停在对心碰撞）。

---

*本文件用于课程 / 学习证据归档，对应 Session 8。目录考纲见 Session 5。Physics 1 其余实验台见 Session 7。抛体双模式见 Session 6。*

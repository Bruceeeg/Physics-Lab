# Session 9 学习记录

**日期**：2026-09-12  
**主题**：把运动学 / 力与平动几张高频实验台改成上课能对照的 3D 仪器：目录四列卡片、能量与受力、圆周拆成三台  
**项目**：Physics Lab  
**相关对话**：[这些东西需要改进一下](edfc06b4-9dbe-4fa7-ac5f-fb6be46bedfa)  
**功能提交**：`338e86d`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 目录卡片是入口广告：四列网格、悬停 3D 倾斜，和实验台驾驶舱是两层；`prefers-reduced-motion` 时关掉倾斜。
2. 匀变速的「位置-时间」和「位移-时间」对学生是同一条曲线。留一条 \(x(t)\)，轨道改成 3D，才和后面几台仪器一致。
3. 抛体预估不能再藏 \(v_0\)、分三步测速。学生自己设 \(v_0\)、\(\theta\)、预估落点 \(x\)；测量板对照，相对误差 \(\le 1\%\) 才算对。机械能 \(E=K+U\) 要画出来。
4. 斜面只写 \(a=g(\sin\theta-\mu_k\cos\theta)\) 不够。重力要分解成 \(mg_\parallel\)、\(mg_\perp\)；摩擦力从斜面的 \(\mu_k mg\cos\theta\) 变到平面的 \(\mu_k mg\)；摩擦做功让 \(E\) 下降。
5. 阿特伍德在 3D 里说「左 / 右」会反。物体用颜色和 **A / B** 标记。行程变长时绳子和滑轮高度必须跟着变，轻物不能飞出滑轮。仪表针对 **轻物**，方程 \(T-mg=ma\)（向上为正）。
6. 「圆周运动」一张台三种模式，上课会串题。拆成圆锥摆、水平圆周、竖直圆周。竖直圆周过不了顶不能冻在空中，要按摆的方程荡回来。

---

## 2. 目录：四列 + 卡片 3D

`components/catalog/catalog-home.tsx`：`lg:grid-cols-4`。  
`components/catalog/experiment-card.tsx` + `app/globals.css`：指针位置写成 `--rx/--ry/--tz`，卡片绕中心轻轻转。

浏览器：1920 宽下 Unit 2 第一排四张卡并排；Unit 1 只有两台，所以只占两格，网格仍是四列。

---

## 3. 匀变速与抛体

匀变速：删掉重复的位移-时间图；新增 `components/linear-motion-scene.tsx`（导轨、小车、刻度）。右侧三条图：位置、速度、加速度。

抛体（改 Session 6 的预估规则）：

| 旧 | 新 |
|----|----|
| 隐藏 \(v_0\)，分「测初速度 / 预测落点 / 结果」 | 学生设定 \(v_0\)、\(\theta\)、\(h\)、预估 \(x\) |
| 命中看 \(v_0\) 5% 或靶宽 | 相对误差 \(\lvert R-\hat x\rvert/\hat x\le 0.01\) |
| 几乎不看能量 | \(K=\tfrac12 mv^2\)，\(U=mgy\)，\(E=K+U\) |

公式：落地时间

\[
t_L=\frac{v_0\sin\theta+\sqrt{v_0^2\sin^2\theta+2gh}}{g},\qquad R=v_0\cos\theta\cdot t_L
\]

浏览器：默认 \(v_0=5\,\mathrm{m/s}\)、\(\theta=30^\circ\)、\(h=1\,\mathrm{m}\)，理论 \(R=3.35\,\mathrm{m}\)。填预估 3.35 再发射，测量板绿字「正确」，相对误差 0.04%。步骤条已去掉。

```text
lib/models/projectile.ts
lib/models/projectile-prediction.ts
components/projectile-lab.tsx
components/projectile-prediction-panel.tsx
components/projectile-measurement-board.tsx
```

---

## 4. 斜面摩擦：重力分解、摩擦变换、能量

斜面上：

\[
mg_\parallel=mg\sin\theta,\quad mg_\perp=mg\cos\theta,\quad f_k=\mu_k mg\cos\theta
\]

平面上：\(N=mg\)，\(f_k=\mu_k mg\)。虚线画 \(mg_\parallel\)、\(mg_\perp\)；标签随 `frictionKind` 在 \(f_s\) / \(f_k\) 之间切。

能量：\(K=\tfrac12 mv^2\)，\(U=mgy\)，\(W_f<0\) 时机械能减少。浏览器里滑块在平面停下后 \(K=0\)、\(E=0\)，\(W_f=-3.53\,\mathrm{J}\)，与出发时的重力势能对上。

```text
lib/models/incline-friction.ts
components/p1/incline-friction-lab.tsx
components/p1/incline-friction-scene.tsx
```

---

## 5. 阿特伍德：绳子、A/B、轻物仪表

几何随行程缩放：`hang0`、`pulleyY` 随 `travel` 变，上升端停在滑轮下方。桌上滑车的 A 从 \(x=-(s_{\max}+0.4)\) 驶向滑轮，不会开过桌边。

标记：A 深蓝 \(m_1\)，B 金色 \(m_2\)。轻物由 \(m_A\le m_B\) 决定。右侧位移、速度、加速度、张力都针对轻物；经典双吊写

\[
T-mg=ma
\]

（向上为正）。不再用「左侧 / 右侧」。

浏览器：行程调到 \(1.20\,\mathrm{m}\) 后开始，轻物 A 升到 \(1.20\,\mathrm{m}\) 停下，B 仍在绳下，没有飞出滑轮。大行程时镜头偏近轻物，整根绳子不如默认行程看得全。

```text
lib/models/atwood-machine.ts
components/p1/atwood-machine-lab.tsx
components/p1/atwood-machine-scene.tsx
```

---

## 6. 圆周拆成三台

目录去掉 `circular-motion`，改成：

| slug | 标题 | 学生要看的关系 |
|------|------|----------------|
| `conical-pendulum` | 圆锥摆 | 可设水平切向 \(v_0\)；平衡 \(v_{\mathrm{eq}}=\sqrt{gL\sin^2\theta/\cos\theta}\)；对照 \(T\sin\theta\) 与 \(mv^2/r\) |
| `horizontal-circular` | 水平圆周 | 逐步 \(F_c=mv^2/r\)，\(T_{\text{绳}}=F_c\)，\(T=2\pi r/v\) |
| `vertical-circular` | 竖直圆周 | 过顶 \(v_0\ge\sqrt{5gR}\)；过不了则 \(\ddot\varphi=-(g/R)\sin\varphi\) 摆荡 |

竖直圆周旧模型能量不够会冻在空中。现在当刚性约束在圆周上积分，会荡回来。3D 上标「摆荡」或「过顶」，受力 \(T\) 指向圆心、\(mg\) 竖直向下。

浏览器：三张独立页、无模式切换条；圆锥摆默认 \(v_0=v_{\mathrm{eq}}=1.52\,\mathrm{m/s}\)；竖直圆周 \(v_0=2.80<\sqrt{5gR}=5.19\)，播到 \(t=8.55\,\mathrm{s}\) 仍在摆，\(x(t)\) 来回，没有停在半空。

```text
lib/models/circular-motion.ts
lib/experiments/catalog.ts
components/p1/circular-motion-lab.tsx
app/labs/[slug]/page.tsx
```

---

## 7. 个人收获

- 3D 里「左 / 右」会随相机反转，质量必须用 **A/B 或颜色**。
- 预估实验的判定要说清分母：相对误差用学生的 \(\hat x\)，不要和靶的几何宽度混在一起。
- 竖直圆周「绳子」和「杆」不是一回事。过不了顶还要连在圆上，用的是杆约束；绳子会在 \(T=0\) 离开圆。课上要说清楚。
- 圆锥摆固定 \(\theta\) 再设 \(v_0\)，只有 \(v_0=v_{\mathrm{eq}}\) 才真正平衡。界面要把 \(T\sin\theta\) 和 \(mv^2/r\) 并排，学生才能看见不平衡。
- 行程加大却看不见绳子变长，多半是 **几何常数写死**（旧悬挂长度 0.45 m），不是积分步长错了。

---

## 8. 本次交付现状

- 目录 `ready` slug：**35**（圆周拆成三台，旧 `circular-motion` 不再出现在目录）。
- Physics 1 力与平动：斜面、阿特伍德、圆锥摆、水平圆周、竖直圆周均可进。
- 测试：`npm test` → **174** 通过，0 失败。
- 浏览器已点：目录四列、匀变速 3D 轨道、抛体预估命中、斜面能量、阿特伍德 A/B 与长行程、三张圆周页。开发时 Next 水合提示条曾出现，功能页仍可操作。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/linear-motion
http://localhost:3000/labs/projectile-motion
http://localhost:3000/labs/incline-friction
http://localhost:3000/labs/atwood-machine
http://localhost:3000/labs/conical-pendulum
http://localhost:3000/labs/horizontal-circular
http://localhost:3000/labs/vertical-circular
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 9. 后续可做

- Session 8 仍缺：二维碰撞、完整环轨道、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程。
- 阿特伍德大行程时镜头跟着轻物，整机绳子不够一目了然；相机可以改钉在滑轮。
- 竖直圆周过顶那组默认 \(v_0\) 仍低于 \(\sqrt{5gR}\)，要演示过顶需自己把底端速率拉上去。
- 部分 C 独有卡片仍复用 P1 / P2 组件，切 slug 时要确认默认模式。

---

*本文件用于课程 / 学习证据归档，对应 Session 9。目录考纲见 Session 5。抛体双模式见 Session 6。Physics 1 其余实验台见 Session 7。显示规范与 Physics 2 / C 见 Session 8。*

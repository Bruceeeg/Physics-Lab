# Session 13 学习记录

**日期**：2026-10-21
**主题**：每台实验都能加零件、改力，并用考纲英文核对 169 道简答的数值
**项目**：Physics Lab
**相关对话**：[可改零件的实验台](c6ac59ca-0cdd-4a38-917b-0adb7b1b0000)、[AP题目实验调试](a35e7563-a61b-4d5c-bb66-4534f3e3dd99)
**功能提交**：`b9a1706`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 试验台上的数和「另一套公式」一致，只说明两条算法没有互相矛盾。它不能代替评分细则。两条路如果写错了同一种物理，核对仍会通过。所以抽查必须用一份事先知道的闭式结果，例如实心圆柱滚下后的落点。
2. 考纲问数值时用 **Calculate** 或 **Determine**。量名用 rotational inertia、equivalent resistance、motional emf、coefficient of static friction，不用中文直译。已知量用 \(\theta\)、\(\mu_s\)、\(\mu_k\)、\(\varepsilon\)、\(m_1\)。
3. 自定义力只有碰到物体才改变加速度。同号电荷相斥；透镜不推滑块。没添加零件时，标准模型保持原来的预设。
4. 简答题按实验台分组。水平圆周、圆锥摆、竖直圆周共用轨道题，因为 `circular-motion` 只是页面别名，不在目录 slug 里。
5. 实验设计、读图题没有把试卷原文抄进来。台上算的是这道题要测的那个量，例如 \(\mu_s=\tan\theta\)、\(\rho=RA/L\)。图上读不准的系数写在题里，2021 Set 2 桌面摩擦用的是 \(\mu=0.12\)。

---

## 2. 简答数值和独立公式

压缩包里 Physics 1、Physics 2、C 力学、C 电磁的 Section II，2015–2019 与 2021–2025（没有 2020），共 **169** 道：Physics 1 为 49，Physics 2 为 40，C 力学为 43，C 电磁为 37。数值题取 \(g=9.8\,\mathrm{m/s^2}\)。

`solve` 调现有实验模型。`oracle` 用另一套代数，不引用 `solve`。相对差不超过 \(10^{-4}\) 乘以尺度、再加 \(10^{-8}\)，才算一致。

实心圆柱 \(\kappa=\tfrac12\)。2017 C 力学第 3 题：\(m=0.50\,\mathrm{kg}\)，\(R=0.10\,\mathrm{m}\)，斜面竖直高度 \(h=0.50\,\mathrm{m}\)，桌高 \(H=0.75\,\mathrm{m}\)。模型用滚下速率算动能，独立公式用损失的重力势能：

\[
K=mgh=2.45\,\mathrm{J},\qquad v=\sqrt{\frac{2gh}{1+\kappa}}=2.56\,\mathrm{m/s}
\]

\[
\omega=\frac{v}{R}=25.56\,\mathrm{rad/s},\qquad D=v\sqrt{\frac{2H}{g}}=1.00\,\mathrm{m}
\]

界面显示 total kinetic energy \(2.45\,\mathrm{J}\)、speed \(2.56\,\mathrm{m/s}\)、angular speed \(25.56\,\mathrm{rad/s}\)、horizontal distance \(1.00\,\mathrm{m}\)。

火箭 \(a=K-Lt^2\)，燃烧 \(6.0\,\mathrm{s}\)，\(K=9.0\)，\(L=0.25\)，\(m=0.50\,\mathrm{kg}\)：

\[
v=Kt-\frac{Lt^3}{3}=36\,\mathrm{m/s}
\]

冲量 \(J=mv=18\,\mathrm{N\cdot s}\)，动能 \(324\,\mathrm{J}\)，高度 \(135\,\mathrm{m}\)。燃烧结束前不用 \(g\) 往下减，和台上的 `rocketVelocity` 一致。

```text
lib/problems/bank.ts
lib/problems/solve.ts
lib/problems/oracle.ts
lib/problems/check.ts
components/problems/problem-panel.tsx
```

左侧页签是 **FRQ**。题头用 AP Physics 1、AP Physics 2、AP Physics C: Mechanics、AP Physics C: Electricity and Magnetism。一致时写 Agrees with the independent expression.

---

## 3. 零件和自定义力

每台 ready 实验都包在 `FreeformLab` 里。参数、零件、FRQ 三个页签共用同一套播放时钟：加零件或改力时时间停住，标准滑条仍把 \(t\) 拉回 0。

力的分量沿实验室坐标。力臂不为零就有力矩。自定义力会改加速度并继续积分。世界坐标里的力如果没有碰到物体，物体不动。零件搜索覆盖全目录；空搜索先给本主题最相关的几件。

目录内容宽度从 \(1400\,\mathrm{px}\) 改到 \(1600\,\mathrm{px}\)，中等屏左右留白从 `md:px-10` 收到 `md:px-6`，侧栏和卡片同一行时少被挤。

```text
components/freeform/freeform-lab.tsx
components/freeform/parts-panel.tsx
lib/freeform/forces.ts
lib/freeform/catalog.ts
components/lab-frame.tsx
components/use-lab-clock.ts
```

---

## 4. 个人收获

- 核对程序要和被测程序走不同的代数。圆柱动能一边用 \(\tfrac12(1+\kappa)mv^2\)，另一边用 \(mgh\)，一致才说明能量没有在接口上丢掉。
- 考纲动词决定句子怎么开头。算出一个数用 Calculate；从伸长或临界角反推系数用 Determine。
- 别名页面不能拿来当目录 slug。题挂在真正有路由的台上，同一族再互相看见。
- 零件页的「能搜到」和「会改变运动」是两件事。透镜可以放上实验台，但不应该对滑块出力。

---

## 5. 本次交付现状

- 目录 `ready` slug 仍是 **40**。没有新开二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台，或管道连续方程。
- 测试：本次功能提交前 `npm test` → **227** 通过，0 失败（Session 12 记录是 217）。其中 169 道简答全部和独立公式一致，题面和结果标签没有中文。
- 浏览器查了电阻电路、滚动与转动、水平圆周。电阻电路 Physics 1 2015 Question 2：equivalent resistance \(60.00\,\Omega\)，current \(0.20\,\mathrm{A}\)。滚动台 C 力学 2017 Question 3 为上面的 \(2.45\,\mathrm{J}\) 与 \(1.00\,\mathrm{m}\)。水平圆周 Physics 1 2018 Question 1：gravitational force \(6893.70\,\mathrm{N}\)，orbital speed \(7654.83\,\mathrm{m/s}\)。切回参数页后滑条仍在。没有把 169 道逐一点开，也没有手机实机。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/rotational-motion
http://localhost:3000/labs/resistor-circuits
http://localhost:3000/labs/horizontal-circular
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。线上站 `https://physics-lab-livid-three.vercel.app/` 随 `main` 更新。

---

## 6. 后续可做

- Session 12 仍缺：二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程、阿特伍德大行程镜头、目录滚动轻网格、变步长积分和课堂对照数据。
- 竖直圆周默认底端速率仍低于 \(\sqrt{5gR}\)。过顶仍要自己把 \(v_0\) 拉过门槛。
- 简答没有覆盖评分细则里的作图、解释和实验设计句子。读图题里写明的试探系数，不等于原卷图上的读数。
- 参数页和零件页仍是中文；只有 FRQ 页按考纲改成英文。

---

*本文件用于课程 / 学习证据归档，对应 Session 13。目录考纲见 Session 5。抛体见 Session 6。Physics 1 其余台见 Session 7。显示规范与 Physics 2 / C 开课见 Session 8。运动学与力的 3D 改版见 Session 9。目录真实预览与 C 力学五台见 Session 10。首页两屏见 Session 11。绳约束、图表和窄屏见 Session 12。*

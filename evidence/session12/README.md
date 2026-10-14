# Session 12 学习记录

**日期**：2026-10-14
**主题**：按作品检查把绳约束、圆锥摆、时间图和窄屏改成同一套可复查的物理关系，并写出项目报告
**项目**：Physics Lab
**相关对话**：[Physics lab project document](050abd04-db18-4148-b597-b2f0d19d187f)
**功能提交**：`e1b62b3`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 绳子只能提供拉力。竖直圆周算出 \(T<0\) 时，不能继续把小球留在圆上；\(T=0\) 是约束失效的事件，之后方程要换成抛体。
2. 圆锥摆滑条上的张角和切向速度只是初始条件。只有 \(v_0\) 恰好等于平衡速度时，\(\theta\) 才保持不变；偏离后要用球摆方程积分 \(\theta(t)\) 与 \(\phi(t)\)。
3. 时间图把 0 硬包进纵轴，会把恒定正加速度贴到上沿。纵轴应只看窗口里的数据，两端留一点 padding；横轴只留最近一段时间，并保留窗口左边界前的一个采样，折线才不会断。
4. 窄屏不是把桌面三栏等比缩小。小于 640 px 时考纲改成一单元一块；小于 768 px 时实验台顺序改成场景、参数、图表，画布给一个最小高度。
5. 目录小卡和实验台不是同一密度。完整受力数字属于实验台；缩略图只留装置和运动。

---

## 2. 绳松弛与动态圆锥摆

审查里 \(R=0.55\,\mathrm{m}\)、\(v_0=4.80\,\mathrm{m/s}\) 时，过顶门槛是

\[
v_0 \ge \sqrt{5gR} = 5.19\,\mathrm{m/s}
\]

张力已经是 \(-0.64\,\mathrm{N}\)，小球却还在圆周上。这次把竖直圆周做成状态机：绳拉紧时

\[
\ddot{\varphi}=-\frac{g}{R}\sin\varphi,\qquad T=m\left(\frac{v^2}{R}+g\cos\varphi\right)
\]

\(T\) 从正值降到 0，记下脱轨时刻与当时的位置、速度，之后

\[
x=x_d+v_{x,d}(t-t_d),\qquad y=y_d+v_{y,d}(t-t_d)-\frac12 g(t-t_d)^2
\]

张力显示 0，场景不再画绳。低速仍在圆弧上往返；\(v_0\) 达到门槛后保持约束过顶。默认 \(v_0=2.80\,\mathrm{m/s}\) 仍低于门槛，Session 11 说的「要自己把速率拉上去才能看过顶」还在；区别是中间速度现在会脱轨，而不是画出负张力。

圆锥摆改用

\[
\ddot{\theta}=\sin\theta\cos\theta\,\dot{\phi}^2-\frac{g}{L}\sin\theta,\qquad \ddot{\phi}=-2\cot\theta\,\dot{\theta}\dot{\phi}
\]

\[
T=mL\left(\dot{\theta}^2+\sin^2\theta\,\dot{\phi}^2\right)+mg\cos\theta
\]

```text
lib/models/pendulum-dynamics.ts
lib/models/circular-motion.ts
components/p1/circular-motion-lab.tsx
components/p1/circular-motion-scene.tsx
```

---

## 3. 图、标注、孔流和窄屏

孔流公式没有改。\(H=0.80\,\mathrm{m}\)、\(y_{\text{孔}}=0.25\,\mathrm{m}\) 时仍是 \(v=\sqrt{2gh}=3.28\,\mathrm{m/s}\)、\(R=0.74\,\mathrm{m}\)。画面补上水体、液面、孔口、蓝色水舌、落点和射程线。

受力箭头尖端可以外接短引线。斜面、竖直圆周和阿特伍德的 \(mg\)、\(N\)、\(T\)、\(f\) 放到物体外面；目录预览隐藏完整受力层。

匀变速直线的图在 \(t=15\,\mathrm{s}\) 时显示约 \(5\)–\(15\,\mathrm{s}\)，不再把 \(0\)–\(15\,\mathrm{s}\) 全挤进一格。播放到 \(t=60\,\mathrm{s}\) 自动暂停。常量加速度围绕自己的值上下留白，不再贴着图顶。

```text
lib/models/chart-range.ts
lib/models/force-label-layout.ts
components/kinematic-charts.tsx
components/p1/fluid-dynamics-scene.tsx
components/lab-frame.tsx
app/about/page.tsx
docs/physics-lab-project-report.md
```

审查原文和 7 张修复前截图放在 `docs/reviews/`，判断文字没有改写。项目介绍、架构和限制写在报告里；关于页只放摘要，并链到报告与仓库。

---

## 4. 个人收获

- 负的张力不是「再画一个向下的箭头」，而是模型该换方程的信号。画面、页头和底栏必须读同一次 sample。
- 滑条上的角度不一定是运动常量。先问它是约束、平衡解，还是初始条件。
- 图表范围、标签偏移和预览预算都可以先做成纯函数再测，不必一上来改 WebGL。
- 作品检查里「公式对、看不见」和「画面在动、公式已经不成立」是两类错，修法不能混。

---

## 5. 本次交付现状

- 目录 `ready` slug 仍是 **40**。没有新开二维碰撞、功率或管道实验台。
- 测试：本次提交前 `npm test` → **217** 通过，0 失败（Session 11 记录是 199）。同一次交付里 `npm run lint` 与 `npm run build` 也通过，静态生成含 40 个实验路径。
- 浏览器：375×667、400×900、768×1024、1440×900。查了首页、关于页、竖直圆周、圆锥摆、孔流、斜面、阿特伍德、匀变速直线。竖直圆周在 \(v_0=4.20\,\mathrm{m/s}\) 时于 \(t=0.36\,\mathrm{s}\) 张力归零并进入抛体；非平衡圆锥摆张角离开初始 \(25.00^\circ\)；\(t=15\,\mathrm{s}\) 的直线图窗口是 \(5.00\)–\(15.00\,\mathrm{s}\)，播放停在 \(60.00\,\mathrm{s}\)。窄屏没有考纲中英文叠字，实验场景出现在参数前面。
- 没有手机实机触控，也没有 Performance 面板的帧时间。768 px 目录里只有部分卡片在播真实预览，其余是灰底占位，这是预览数量上限，不是实验台算错。

入口：

```text
http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/labs/vertical-circular
http://localhost:3000/labs/conical-pendulum
http://localhost:3000/labs/fluid-dynamics
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 6. 后续可做

- Session 8 / 9 / 10 / 11 仍缺：二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程。
- 阿特伍德大行程镜头仍偏跟轻物；滑轮钉死相机还没做。
- 竖直圆周默认底端速率仍低于 \(\sqrt{5gR}\)。脱轨已经做了，过顶演示仍要自己把 \(v_0\) 拉过门槛。
- 目录滚动的轻网格还没做。本次只把同时播放的预览数量按视口封顶。
- 数值积分仍是固定步长，没有空气、弹性绳或测量误差；也没有课堂对照数据。

---

*本文件用于课程 / 学习证据归档，对应 Session 12。目录考纲见 Session 5。抛体见 Session 6。Physics 1 其余台见 Session 7。显示规范与 Physics 2 / C 开课见 Session 8。运动学与力的 3D 改版见 Session 9。目录真实预览与 C 力学五台见 Session 10。首页两屏见 Session 11。*

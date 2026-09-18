# Session 10 学习记录

**日期**：2026-09-18
**主题**：目录卡片改成真实实验台 3D 循环预览，并补上 C 力学里还缺的变力、阻力、圆环、非均匀杆与扭摆
**项目**：Physics Lab
**相关对话**：[3D dynamic presentation adjustment](161a6ffd-ff58-46b8-b15f-373bb74aff24)、[Physics experiment modifications](8ab85827-0d09-49dd-83b1-cede95028ce6)
**功能提交**：`eef311b`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 首页卡片不能每张开一个 WebGL。浏览器大约只能撑十来个上下文，五十张卡会直接黑掉。正确做法是 **一块全屏 Canvas + 多扇剪刀窗口**（drei `View`），预览和实验台共用同一套场景组件。
2. 卡片是小视口。实验室默认相机是给整张台看的，搬到卡片上会变成「全是网格、物体像蚂蚁」。要按卡片单独 `dolly`，不能所有预览共用一个缩放。
3. 卡片 3D 要对齐滚动中的 DOM 矩形，所以滚动时 WebGL **不能不画**。能省的是：停动画、`setState`，以及把像素比从 2 降到 1。抗锯齿写在 WebGL 上下文上，中途开关等于重建画布，会更卡。
4. C 力学相对 Physics 1 多出来的不是「同一台换个标题」，而是微积分题型：\(W=\int F\,\mathrm{d}x\)、\(m\dot v=mg-bv\)、圆环过顶 \(h_{\min}\)、\(I=\int x^2\lambda(x)\,\mathrm{d}x\)、扭摆 \(T=2\pi\sqrt{I/\kappa}\)。

---

## 2. 目录预览：同一套实验台，不是玩具缩略图

旧卡片是 2D SVG / 示意循环。学生点进去看到的是斜向拉力那种网格 + 半透明物块 + 力箭头，预览却是另一套风格，入口会骗人。

这次预览挂真实 `*Scene`，外包 `LabPreviewMode`（关掉轨道拖转）。共享层：

```text
components/catalog/previews/preview-3d.tsx   全屏 Canvas + View.Port
components/catalog/previews/preview-scenes.tsx  每张卡的相机与 sampleAt
```

循环时钟：播 **5 s**，把一段物理过程映射进去（短过程会变慢），再 **停 1 s**，然后重来。静止时 `dpr={2}`（约 3840×2160）。过远的卡（拉力、圆周、碰撞、摆、电磁感应等）单独拉近；直线运动、抛体、电路、透镜已经铺满，没有再挤。

浏览器（`http://localhost:3000/`）：首屏卡片能看清 \(F\)、\(v_x\)、\(T\)；抛体飞完会在落点停约 1 s 再重置。没有截独立「5.00 s」计时器，是用连续截图对位置。

---

## 3. 滚动为什么卡，以及这次动了哪两刀

卡片在滚，固定叠层上的 3D 必须按新的 `getBoundingClientRect` 重画剪刀，否则画面会和卡片错位。`frameloop="always"` 不能在滚动时关掉。

本次只做计划里的 1 和 2：

| 滚动中 | 停稳约 0.12 s 后 |
|--------|------------------|
| `running=false`，动画冻住 | 继续 5 s + 1 s 循环 |
| 画布 `dpr=1`（1920×1080） | `dpr=2`（3840×2160） |
| 进屏才挂 View，离开再留 0.4 s | 真正离屏才卸载 |

卡片默认 `held=false`，避免一进首页五十个场景同时初始化。

浏览器用脚本对照：静止 `canvas.width=3840`；触发滚动后 `1920`；停稳后又回到 `3840`。滚到 Unit 4 / 5 后 3D 仍贴在卡片里。没有开 Performance 面板报帧时间。轻场景（去掉无限网格）按约定没做。

```text
components/catalog/experiment-card.tsx
components/catalog/previews/preview-3d.tsx
```

---

## 4. C 力学：五台新仪器与公式

Session 8 / 9 把重合实验共用了，缺口在 FRQ 常考的微积分台。本次标 `ready`：

| slug | 学生要看的关系 |
|------|----------------|
| `variable-force` | \(W=\int F\,\mathrm{d}x\)，\(J=\int F\,\mathrm{d}t\)；含 \(F(t)=\alpha t^2+\beta t\)、火箭 \(a=K-Lt^2\) |
| `drag-force` | \(m\dot v=mg-bv\) 或 \(cv^2\)；收尾 \(v_t=mg/b\) 或 \(\sqrt{mg/c}\) |
| `loop-track` | 过顶最小高度 \(h_{\min}=2R+\tfrac12 R(1+\kappa)\)，并检查法向力是否离轨 |
| `nonuniform-rod` | \(I=\int x^2\lambda(x)\,\mathrm{d}x\)（\(\lambda\propto x\) 或 \(x^2\)） |
| `torsional-pendulum` | \(T=2\pi\sqrt{I/\kappa}\)，多层圆盘 \(I=N\cdot\tfrac12 mR^2\) |

已有台上也加了上课会用到的模式：阿特伍德斜面悬挂、冲量 \(F(t)\)、滚动后平抛、杆撞小球、并联弹簧。变力里没有闭式解的段落走 `lib/models/rk4.ts`。

这些台的浏览器细点主要在另一段对话里做模型和实验台；本次归档时用 `npm test` 锁公式，目录预览里能看到对应 3D 卡。

```text
lib/models/variable-force.ts
lib/models/drag-force.ts
lib/models/loop-track.ts
lib/models/nonuniform-rod.ts
components/p1/*-lab.tsx
```

---

## 5. 个人收获

- 缩略图 3D 的瓶颈是 **WebGL 上下文个数**，不是「会不会做场景」。共享 Canvas + 剪刀是目录这种五十张卡的本分结构。
- 滚动卡顿要先问：这一帧 **能不能省掉 WebGL**。对齐剪刀就不能省，只能降像素、停 React 状态。
- 卡片取景和实验台取景不是同一台相机。把实验室 `position` 原样塞进 160 px 高的卡，一定空。
- C 力学「开课」= 把积分符号对应到一台能改参数的仪器，而不是在 P1 页面上加一句 \(I=\int r^2\mathrm{d}m\)。

---

## 6. 本次交付现状

- 目录 `ready` slug：**40**（Session 9 的 35 台 + 上面五台 C 独有）。
- 测试：`npm test` → **196** 通过，0 失败。
- 浏览器已查：首页 3D 预览、取景、5 s 循环停顿、滚动时画布从 2x 降到 1x 再恢复。未用性能面板定量帧时间；未在本段对话里逐台点开五张新 C 实验台的驾驶舱。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/variable-force
http://localhost:3000/labs/drag-force
http://localhost:3000/labs/loop-track
http://localhost:3000/labs/nonuniform-rod
http://localhost:3000/labs/torsional-pendulum
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 7. 后续可做

- Session 8 / 9 仍缺：二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程。
- 阿特伍德大行程镜头仍偏跟轻物；滑轮钉死相机还没做。
- 竖直圆周默认 \(v_0\) 仍低于 \(\sqrt{5gR}\)，演示过顶要自己把底端速率拉上去。
- 目录滚动若仍觉得顿，下一刀才是预览专用轻网格（本次按约定没做）。

---

*本文件用于课程 / 学习证据归档，对应 Session 10。目录考纲见 Session 5。抛体见 Session 6。Physics 1 其余台见 Session 7。显示规范与 Physics 2 / C 开课见 Session 8。运动学与力的 3D 改版见 Session 9。*

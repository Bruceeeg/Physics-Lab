# Session 11 学习记录

**日期**：2026-09-18
**主题**：首页改成锁滚动的四门课概览，下滑进入实验列表；重点实验用独立镜头，进出用同一套滑动
**项目**：Physics Lab
**相关对话**：[Physics experiment design](c61e31a4-7ae6-48ff-b635-a8a073387221)、[首页向下切换](0ed864d6-9374-4d8e-bfd8-0b01c20bd961)、[Homepage display optimization](5bab62c5-fe10-42e7-804e-95db23d123d8)、[Academic research skills installation](6420ff29-b4ad-4be2-aaab-4d20d2537bea)
**功能提交**：`13e6a91`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 目录页和落地页不是同一份滚动文档。第一屏要「先看这门课再进实验室」，页面本身必须 `overflow: hidden` + `100dvh`。用锚点滚到卡片区，学生会半途停在标题和卡片之间，等于没有落地页。
2. Session 10 的卡片相机是给约 160 px 高的格子用的。首页「重点实验」是 \(16:10\) 大窗：同一套 `dolly` 要么裁掉水槽顶 / 圆环，要么装置缩在空地板里。大窗要单独的 `heroFrame`（相机、看点、\(fov\)）。
3. 进出必须对称。进去是 hero `translateY(-100%)`；回来若把 hero 卸掉再挂，开头会空大约 280 ms。正确做法是目录页把首页停在屏幕外，回程直接从上方滑下来盖住列表。
4. 矮窗口上考纲表可以在卡片里滚，但页面仍锁死。滚轮只有在内部已经到底之后，再累计超过阈值，才算「大幅度下滑进第二屏」。内部滚动和进场手势要拆开。

---

## 2. 两屏：锁死概览，再滑进目录

旧首页是：标题 + 课程 chips + 五十张 3D 卡连在一起滚。学生还没弄清四门课的差别，就已经在刷卡片。

这次拆成 `hero` / `catalog` 两档，状态在 `useCatalogStage`：

| 动作 | 条件 | 结果 |
|------|------|------|
| 点底部圆圈箭头、滚轮累计约 240 px、上滑触控约 120 px、`PageDown` / `End` | 第一屏 | hero 上滑离开，露出实验列表 |
| 点顶栏 Physics Lab / 实验、列表顶再上滚、`PageUp` / `Home` | 已在列表且 `scrollY ≈ 0` | hero 从上方滑回盖住列表 |
| `prefers-reduced-motion: reduce` | 任意 | 瞬时切档，不做 520 ms 位移 |

时长和曲线进出共用：\(520\,\mathrm{ms}\)、`cubic-bezier(0.16, 1, 0.3, 1)`。目录态把 hero 留成 `position: fixed` 的 overlay（`translateY(-100%)`），`inert` + `aria-hidden`，避免回程重新挂载。

第二屏不再用顶部课程 chips。四门课按 CED 单元排成一棵树，侧栏（桌面）/ 顶栏（窄屏）TOC 跳到 `course-*` / `course-*-unit-*`。列表仍是 Session 10 那套真实实验台预览。

```text
components/catalog/use-catalog-stage.ts
components/catalog/catalog-home.tsx
components/catalog/catalog-toc.tsx
app/globals.css
```

---

## 3. 课程概览与重点实验镜头

概览数据进目录，不写死在 JSX 里：`COURSE_OVERVIEWS`、`SITE_LEDE`、`COURSE_SUMMARIES`。每门课四台已 `ready` 的重点实验，播完一段预览再停 \(0.5\,\mathrm{s}\) 切下一台，四台走完换下一门：

\[
t_{\mathrm{clip}} = 5\,\mathrm{s} + 0.5\,\mathrm{s} = 5.5\,\mathrm{s}
\]

指针停在预览上会暂停自动切台；「暂停预览」仍冻住 3D。

| 课 | 重点实验（学生先看到的关系） |
|----|------------------------------|
| Physics 1 | 机械能 \(\tfrac12 kx^2+mgy+\tfrac12 mv^2=E\)；抛体；竖直圆周；孔流 \(v=\sqrt{2gh}\) |
| Physics 2 | 电场 \(E=kq/r^2\)；RC \(\tau=RC\)；薄透镜；玻意耳 \(PV=\) 常数 |
| C 力学 | \(W=\int F\,\mathrm{d}x\)；圆环 \(h_{\min}\)；\(I=\int x^2\lambda(x)\,\mathrm{d}x\)；\(m\dot v=mg-bv\) |
| C 电磁 | 电场 / 高斯；\(C=\kappa\varepsilon_0 A/d\)；\(B=\mu_0 nI\)；RL \(\tau=L/R\) |

卡片预览继续用 Session 10 的 `dolly`。重点实验走 `PreviewHeroContext`：只在 `hero={true}` 时换 `heroFrame`，目录小卡不变。裁切的（流体、圆环、阻力圆筒）镜头往后、看点抬高；空的（机械能、竖直圆周、电容等）镜头拉近。标签在大窗里从 `1.5` 降到 `1.15`，避免字比仪器还大。

```text
lib/experiments/catalog.ts
lib/experiments/preview-timing.ts
components/catalog/course-overview.tsx
components/catalog/previews/preview-scenes.tsx
```

---

## 4. 个人收获

- 「不能滚」不是把 `overflow` 关掉就完了。内部还有一张比视口高的考纲表时，要先问：这次滚轮是在填表，还是学生已经看完、要进实验室。
- 3D 取景跟视口长宽比绑定。卡片相机和 hero 相机不能共用一个 `dolly` 常数。
- 反向过渡的对手是挂载成本，不是 CSS 会不会写 `translateY(100%)`。组件不在树上，动画再对称也会先空一帧。
- 四门课的差别（P1 有流体、C 力学没有；P2 有光学、C 电磁没有）适合放在进目录之前，而不是靠 chips 临时过滤五十张卡。

---

## 5. 本次交付现状

- 目录 `ready` slug 仍是 **40**（本次没开新实验台）。
- 测试：`npm test` → **199** 通过，0 失败（相对 Session 10 多 3 条：四门概览与重点实验、\(5.5\,\mathrm{s}\) 切台、跨课 wrap）。
- 浏览器（相关对话里，不是本段上传）：第一屏锁滚动、圆圈箭头 / 大幅下滑进列表、矮窗口先滚考纲再进场、重点实验 16:10 取景、回首页 520 ms 下滑覆盖。本段对话没有再开浏览器复验；没有手机实机触控；没有 Performance 面板报帧时间。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/conservation-of-energy
http://localhost:3000/labs/variable-force
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 6. 后续可做

- Session 8 / 9 / 10 仍缺：二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程。
- 阿特伍德大行程镜头仍偏跟轻物；滑轮钉死相机还没做。
- 竖直圆周默认 \(v_0\) 仍低于 \(\sqrt{5gR}\)，演示过顶要自己把底端速率拉上去。
- 目录滚动若仍觉得顿，下一刀才是预览专用轻网格（Session 10 按约定没做，本次也没做）。

---

*本文件用于课程 / 学习证据归档，对应 Session 11。目录考纲见 Session 5。抛体见 Session 6。Physics 1 其余台见 Session 7。显示规范与 Physics 2 / C 开课见 Session 8。运动学与力的 3D 改版见 Session 9。目录真实预览与 C 力学五台见 Session 10。*

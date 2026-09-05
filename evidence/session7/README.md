# Session 7 学习记录

**日期**：2026-09-05  
**主题**：把剩下的 AP Physics 1 实验台做成可进的 3D 仪器；对照近年 FRQ 加模式；目录示意图与 3D 视口排错  
**项目**：Physics Lab  
**相关对话**：[P1 labs and energy modes](821f8970-450c-4598-bf76-54834d3207d3)  
**功能提交**：`506f1d1`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 对照 Session 5 的 Physics 1 目录，把原先「等待开发」的 **9 台实验**做成和抛体 / 拉力同一套驾驶舱：左参数、中 3D、右四图。
2. 物理用 **闭式解 / 分段解析解**，不用游戏引擎当主求解器；每台模型配 Node 测试。
3. 对照 [AP Physics 1 往年真题](https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions)，给多台实验加 **第二种（或第三种）模式**，让装置能搭出常见 FRQ 情景，而不是只能演示一个默认例子。
4. 机械能守恒要分清 **弹簧松开弹射** 和 **弹簧一直连着**：后者才会把小车拉回来。
5. 目录动态示意图、3D 空白、侧视 2D 被挡住，都是 **显示层**问题：周期太快、CSS 和车子不同步、画布高度为 0、WebGL 合成层盖住 HTML。

匀变速直线仍保持 **2D 轨道**（按产品约定不改成 3D）。Physics 2 / C 的 pending 卡没有做。

---

## 2. 从「目录卡片」到「能上课的实验台」

Session 5 结束时，Physics 1 只有拉力、匀变速可进；Session 6 加上抛体。本次把手册里剩下的探究题材全部标成 `ready`：

| slug | 标题 | 核心关系 |
|------|------|----------|
| `circular-motion` | 圆周运动 | 圆锥摆 \(T=2\pi\sqrt{L\cos\theta/g}\) |
| `conservation-of-energy` | 机械能守恒 | 弹射：\(\tfrac12 kA^2=mgy_{\max}\) |
| `impulse-momentum` | 冲量与动量 | \(J=\Delta p\) |
| `harmonic-motion` | 简谐运动 | 单摆 \(T=2\pi\sqrt{L/g}\) |
| `rotational-motion` | 滚动与转动 | \(v=\sqrt{2mgh/(m+I/r^2)}\) |
| `fluid-dynamics` | 流体孔流 | Torricelli \(v=\sqrt{2gh}\) |
| `atwood-machine` | 阿特伍德机 | \(a=g\Delta m/(m_1+m_2)\) |
| `angular-momentum` | 角动量守恒 | \(I_1\omega_1=I_2\omega_2\) |
| `archimedes` | 阿基米德原理 | \(F_b=\rho V g\) |

共用壳，避免每台复制一份命令栏：

```text
components/lab-frame.tsx      # 命令栏、参数栏、场景栏、图表栏；可选 modes
components/lab-canvas.tsx     # R3F Canvas（dynamic、禁 SSR）
components/lab-3d.tsx         # 网格、轨道相机、质量块、轨迹、LabLine
components/use-lab-clock.ts   # rAF 时钟 + 采样序列 + 轨迹
lib/models/<name>.ts          # 纯函数模型
lib/models/<name>.test.ts
components/p1/<slug>-lab.tsx
components/p1/<slug>-scene.tsx
app/labs/[slug]/page.tsx      # ReadySlug → 实验台组件
```

测试：`npm test`（本次结束后 **105** 通过）。

---

## 3. 机械能守恒：为什么要两种模式

用户反馈：弹射上坡后小车「飞出去不回来」。  
弹射模式在 \(s=0\) **松开弹簧**，斜面上 \(U_s=0\)，用 \(\tfrac12 kA^2=mgy_{\max}\) 对能量。视觉上弹簧停在接合处，看起来像冲走了。

**弹簧连接**模式：自然长度在 \(s=0\)，全程 \(-ks\)；斜面上再加 \(-mg\sin\theta\)。平衡点在斜面下方，所以总会被拉回。令 \(\omega=\sqrt{k/m}\)，\(\delta=mg\sin\theta/k\)：

\[
s_{\max}=\sqrt{A^2+\delta^2}-\delta
\]

比弹射的最高点低（弹簧还在拉）。机械能始终 \(\tfrac12 kA^2\)。

命令栏分段按钮对齐抛体：`弹射上坡` / `弹簧连接`。切模式回到 \(t=0\)。

---

## 4. 对照 FRQ 加了哪些模式

真题页本身多是 PDF。归纳常见装置后，在已有台上加模式（不整段抄 College Board 题面）：

| 实验台 | 模式 | 对应常见题设 |
|--------|------|----------------|
| 匀变速直线 | 单段加速 / 两段运动 | \(x\)–\(t\)、\(v\)–\(t\)；先加速再匀速 |
| 阿特伍德机 | 经典双吊 / 桌上滑车（可加 \(\mu\)） | 改进阿特伍德 |
| 简谐运动 | 单摆 / 水平弹簧振子 | 弹簧小车求 \(k\) |
| 圆周运动 | 圆锥摆 / 水平圆周 / 竖直圆周 | 绳力；过顶 \(v_0\ge\sqrt{5gR}\) |
| 滚动与转动 | 无滑滚动 / 无摩擦滑动 | 滚动 vs 滑动能量 |
| 冲量与动量 | 对心碰撞 / 爆炸分离 | \(\sum p=0\) |
| 角动量 | 落物粘盘 / 收臂加速 | \(I\) 变小、\(\omega\) 变大 |
| 机械能守恒 | 弹射上坡 / 弹簧连接 | 松开 vs 始终连接 |

抛体、拉力摩擦、孔流、浮力本次没有改模式，原功能已能覆盖对应装置。

模拟器复现的是 **装置和公式**，盖不住：实验设计题（步骤、误差、线性化）、环轨道、静力矩米尺、二维斜碰、带质量滑轮、斜面摩擦、变截面管 Bernoulli。

---

## 5. 显示层三次返工（值得单独记）

### 5.1 目录示意图「不动了」

机械能守恒预览一度改成按真实物理时间播。连接模式周期大约 \(0.3\,\mathrm{s}\)，一帧就绕完，肉眼像卡住。匀变速预览也离开了其它卡片共用的 CSS 循环。

后来改回约 **3.2 s** 一圈的视觉时间，物理时间按比例映射到 `sampleAt`。

### 5.2 弹簧和车子不同步

用 CSS `scaleX` 原地伸缩弹簧、小车用 `offset-path` 上坡，两条动画只是「时长碰巧相同」，几何上并不相连。

正确做法：弹簧折线从墙 **沿轨道画到车尾**，和车子共用同一个 \(s\)。

### 5.3 3D 空白，以及拉力台「同台展示」消失

- 加了模式开关后顶栏变高，工作区高度仍按「整屏减 70px」估，中间栏有时高度为 0，WebGL 量不到尺寸。
- 斜向拉力的「侧视 2D」还在 DOM 里，但 WebGL canvas 会单独一层合成，把后面的 HTML 盖住。

修法：大屏 `lab-shell` 改成 `auto + 1fr` 吃掉顶栏真实高度；画布 `absolute inset-0`；`.scene-pip` 提高 `z-index` 并 `translateZ(0)`，让小窗成为自己的层。

---

## 6. 个人收获

- 同一套实验台可以服务两种课：演示一个公式，和 **复现 FRQ 装置**（再加一个模式往往比新开一台便宜）。
- 弹簧「松开」和「连着」能量账不同；\(s_{\max}=\sqrt{A^2+\delta^2}-\delta\) 是连接模式还回得来的原因。
- 目录预览不要直接拿仿真时钟；要 **视觉周期**，几何上弹簧必须连着车。
- 3D「没东西」先量 CSS 宽高，再查相机；HTML 小窗被挡住时，查的是合成层 / `z-index`，不是组件是不是删了。
- AP 题不是都能做成滑条：实验设计、误差、作图说理，模拟器只能当装置，不能当整张答题纸。

---

## 7. 本次交付现状

- Physics 1：**12** 台 `ready`（含原有拉力、匀变速、抛体）。
- 目录卡片：机械能守恒预览为连接弹簧循环；匀变速为 CSS 水平运动。
- 斜向拉力右上角 **侧视 2D** 应叠在 3D 之上。
- C 力学 `c-atwood` / `c-angular-momentum` 等仍为等待开发。

入口：

```text
http://localhost:3000/
http://localhost:3000/labs/conservation-of-energy
http://localhost:3000/labs/pull-friction
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 8. 后续可做

- 环轨道、力矩米尺、斜面摩擦，若要上课再开新台或新模式。
- Physics 2 / C 仍是目录占位。
- 浏览器自动化验收这次经常连不上 MCP，主要靠本地刷新和 `npm test`。

---

*本文件用于课程 / 学习证据归档，对应 Session 7。目录考纲见 Session 5。抛体双模式见 Session 6。*

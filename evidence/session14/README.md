# Session 14 学习记录

**日期**：2026-10-29
**主题**：用已核对的读数重写项目报告，并把采样、测试数目和学习成效分开
**项目**：Physics Lab
**相关对话**：[项目报告](12fb124b-a9c5-463c-9f90-66aa31615919)
**功能提交**：`10a04e1`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. 报告里的数只能来自学习记录、模型、设计系统色值和已经核对过的读数。作品检查里的 \(-0.64\,\mathrm{N}\) 是修订前的页面，当前测试要求脱轨后显示张力为 0。
2. `npm test` 的通过数核对的是代码。227 项通过不能写成学习成效；169 道简答与另一套代数一致，也不能代替评分细则。
3. 播放中的 sample 由浏览器按参数和时间现算。仓库里没有 Neon 客户端，不能把采样写成已经入库。

---

## 2. 报告里保住的核对

竖直圆周：Session 12 在 \(v_0=4.20\,\mathrm{m/s}\) 时于 \(t=0.36\,\mathrm{s}\) 进入抛体。模型测试用 \(R=0.55\,\mathrm{m}\)、\(v_0=4.80\,\mathrm{m/s}\)，断言 \(t=0.80\,\mathrm{s}\) 为抛体且显示张力为 0。过顶门槛仍是作品检查里的 \(5.19\,\mathrm{m/s}\)。

圆锥摆：作品检查的平衡读数是摆长 \(1.20\,\mathrm{m}\)、\(25^\circ\)、\(1.52\,\mathrm{m/s}\)、张力 \(4.33\,\mathrm{N}\)、水平分力 \(1.83\,\mathrm{N}\)。Session 12 看到非平衡张角离开 \(25.00^\circ\)。

孔流、斜面、匀变速：\(H=0.80\,\mathrm{m}\)、孔高 \(0.25\,\mathrm{m}\) 时 \(v=3.28\,\mathrm{m/s}\)、\(R=0.74\,\mathrm{m}\)、飞行 \(0.23\,\mathrm{s}\)；\(\theta=30^\circ\)、\(\mu_s=0.90\) 时加速度 0、静摩擦 \(3.92\,\mathrm{N}\)；\(t=15.00\,\mathrm{s}\) 的时间窗是 \(5.00\)–\(15.00\,\mathrm{s}\)，播放停在 \(60.00\,\mathrm{s}\)。

```text
docs/physics-lab-project-report.md
lib/models/circular-motion.ts
lib/models/pendulum-dynamics.ts
lib/models/fluid-dynamics.ts
lib/models/incline-friction.ts
lib/models/linear-motion.ts
lib/models/force-display.ts
```

---

## 3. 个人收获

- 修订前的负张力和修订后的脱轨时刻要分两句写，不能并成“现在仍显示 \(-0.64\,\mathrm{N}\)”。
- 默认圆锥摆速率 \(2.80\,\mathrm{m/s}\) 和作品检查里的平衡速率 \(1.52\,\mathrm{m/s}\) 不是同一次设置。
- 斜面 \(3.92\,\mathrm{N}\) 来自检查时 \(\mu_s=0.90\)。模型默认 \(\mu_s=0.40\)，\(\tan 30^\circ\) 更大，默认会下滑。

---

## 4. 本次交付现状

- 目录 `ready` slug 仍是 **40**。没有新开实验台。
- 测试：提交报告前 `npm test` → **227** 通过，0 失败，与 Session 13 的记录相同。这次没有重跑 lint、build，也没有重新打开浏览器逐页点实验台。
- 报告路径：`docs/physics-lab-project-report.md`。

入口：

```text
http://localhost:3000/
http://localhost:3000/about
http://localhost:3000/labs/vertical-circular
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。线上站 `https://physics-lab-livid-three.vercel.app/` 随 `main` 更新。

---

## 5. 后续可做

- Session 13 仍缺：二维碰撞、单独的 \(W=Fd\) / \(P=Fv\) 台、管道连续方程、阿特伍德大行程镜头、目录滚动轻网格、变步长积分和课堂对照数据。
- 竖直圆周默认底端速率仍低于 \(\sqrt{5gR}\)。过顶仍要自己把 \(v_0\) 拉过门槛。
- 简答没有覆盖评分细则里的作图、解释和实验设计句子。参数页和零件页仍是中文。

---

*本文件用于课程 / 学习证据归档，对应 Session 14。目录考纲见 Session 5。抛体见 Session 6。Physics 1 其余台见 Session 7。显示规范与 Physics 2 / C 开课见 Session 8。运动学与力的 3D 改版见 Session 9。目录真实预览与 C 力学五台见 Session 10。首页两屏见 Session 11。绳约束、图表和窄屏见 Session 12。零件与简答核对见 Session 13。*

# Physics Lab

Physics Lab 是一个面向 AP 物理学习的可交互实验网站。项目按 AP Physics 1、AP Physics 2、AP Physics C: Mechanics 和 AP Physics C: Electricity and Magnetism 的单元组织实验，通过可调参数、三维场景、受力标注、实时读数与时间图，把公式和运动过程放在同一个实验台中。

[在线访问](https://physics-lab-livid-three.vercel.app/) | [完整项目报告](docs/physics-lab-project-report.md) | [2026-10-14 作品检查](docs/reviews/2026-10-14-physics-lab-site-review.md)

## 项目内容

- 40 个可进入的独立实验条目
- 四门 AP 物理课程与对应考纲单元
- 力学、流体、热学、电磁、光学、波动和近代物理模型
- Three.js 三维装置、运动轨迹与受力图
- 参数控制、公式代入、当前读数和时间序列图
- 桌面三栏实验台与窄屏场景优先布局

同一个基础实验可以在多门课程中复用。例如匀变速、抛体和圆周运动同时服务 Physics 1 与 C 力学，但目录会按每门课程自己的单元结构展示。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 6
- React Three Fiber、Drei、Three.js
- Tailwind CSS 4
- Node.js 原生 test runner

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 验证

```bash
npm test
npm run lint
npm run build
```

模型测试位于 `lib/models/*.test.ts`，目录与预览预算测试位于 `lib/experiments/*.test.ts`。

## 目录结构

```text
app/                    页面、路由与全局样式
components/             实验台、目录、三维场景与图表
lib/models/             物理模型、数值积分与单元测试
lib/experiments/        实验目录、课程映射与预览预算
design-system/          项目视觉规范
docs/                   设计规格、实施计划、审查与项目报告
evidence/               分阶段学习记录与截图证据
```

## 设计原则

1. 模型与显示分离。内部计算保持全精度，学生可见读数统一保留两位小数。
2. 同一时刻的场景、页头、底栏和图表使用同一模型 sample。
3. 物理约束可以改变状态。例如竖直圆周的绳张力降到 0 后，模型会转入抛体阶段。
4. 视觉服务于物理关系。颜色、引线和轨迹用于区分力与运动，不增加无意义装饰。
5. 桌面与移动端都应先看到实验本体，再阅读参数与图表。

## 文档

完整的项目背景、目标、架构、物理建模、交互设计、验证方法、限制与后续方向见 [《Physics Lab：面向 AP 物理学习的交互式可视化实验平台设计与实现》](docs/physics-lab-project-report.md)。

# Session 1 学习记录

**日期**：2026-08-24  
**主题**：Cursor + GitHub 环境搭建，以及用 vibe coding 搭建力学可视化网站  
**项目**：Physics Lab（匀变速直线运动演示）

---

## 1. 本次学了什么

1. 用 Homebrew 安装 Git、Node，为本地开发做准备。
2. 把空的 GitHub 仓库克隆到本机，并在 Cursor 里打开。
3. 梳理力学建模可视化网站的技术方案（Next.js + 数值模型 + 动画）。
4. 用 Cursor「边聊边写」的方式，从零搭出可交互的匀变速直线运动页面。
5. 迭代功能：播放 / 暂停 / 重置、运动轨迹、只显示已走过的路径。

---

## 2. Cursor 与 GitHub 环境搭建

### 2.1 工具安装

| 工具 | 作用 | 本机安装方式 |
|------|------|--------------|
| Git | 版本管理、从 GitHub 拉代码 | 系统自带 Apple Git，或 `brew install git` |
| Node.js / npm | 跑 Next.js、装依赖 | `brew install node` |
| Cursor | AI 辅助写代码的编辑器 | 本机已安装 |
| Homebrew | macOS 包管理器 | 用于装 Node / Git |

注意：`brew install` 时若长时间停在 Auto-updating，可用：

```bash
HOMEBREW_NO_AUTO_UPDATE=1 brew install <包名>
```

### 2.2 克隆 GitHub 仓库

仓库地址：

```text
https://github.com/Bruceeeg/Physics-Lab.git
```

在本地空目录执行：

```bash
git clone https://github.com/Bruceeeg/Physics-Lab.git .
```

当时远程仓库是**空仓库**（没有提交），所以克隆后本地只有 `.git`。后续在 Cursor 里新建 Next.js 项目文件，再 push 即可。

### 2.3 在 Cursor 里开发

1. 用 Cursor 打开本地项目目录（如 `physics lab`）。
2. 用对话描述需求，让 Agent 写代码、改页面、起本地服务。
3. 终端里跑：

```bash
npm run dev
```

浏览器打开本地地址（本次为 `http://localhost:3001`）查看效果。

---

## 3. Vibe Coding：用 Cursor 搭可视化网站

### 3.1 什么是 vibe coding

不先手写全部代码，而是：

1. 用自然语言说明目标（例如「先搭匀变速直线运动」）。
2. 让 Cursor 生成 / 修改代码。
3. 本地跑起来看效果。
4. 根据截图和反馈继续改（动画、轨迹、开始暂停重置等）。

适合学习项目和原型：把精力放在「要什么效果」和「物理对不对」，具体脚手架和 UI 细节交给 AI 辅助完成。

### 3.2 技术方案（简要）

- **框架**：Next.js + TypeScript + Tailwind
- **页面**：`app/page.tsx` 客户端组件，参数滑条 + 运动示意 + 曲线
- **物理公式**：
  - \(x = x_0 + v_0 t + \frac{1}{2} a t^2\)
  - \(v = v_0 + a t\)
- **动画**：`requestAnimationFrame` + 真实时间驱动，支持开始 / 暂停 / 重置
- **轨迹**：只绘制小球已经走过的路径，未到达处不提前画线

### 3.3 本次迭代过程

| 步骤 | 内容 |
|------|------|
| 1 | 环境：装 Node，克隆空仓库 |
| 2 | 方案：梳理 Next.js 力学可视化技术栈 |
| 3 | 脚手架：因目录名含空格，手动搭 Next.js 结构 |
| 4 | 功能：匀变速参数面板、公式代入、x(t)/v(t) 图 |
| 5 | 动画：运动示意支持开始、暂停、重置 |
| 6 | 轨迹：留下已走过路径；未走过的位置不显示轨迹 |

### 3.4 常用命令

```bash
# 安装依赖（首次）
npm install

# 本地开发
npm run dev

# 检查与构建
npm run lint
npm run build
```

---

## 4. 项目现状（Session 1 结束时）

- 仓库根目录已有可运行的 Next.js 应用。
- 首页为「匀变速直线运动」演示。
- 可调：`x0`、`v0`、`a`、总时长 `T`。
- 可播放动画，并只显示已走过的轨迹。

后续可做：斜抛、简谐振动、实验路由拆分、推送到 GitHub 远程仓库。

---

## 5. 个人收获（可继续补充）

- 学会了本地 Git + Node + Cursor 联调流程。
- 体会到用对话迭代 UI / 动画比一次写完整页更高效。
- 可视化实验要分清「预览整条曲线」和「只显示已走过轨迹」的教学差异。

---

*本文件用于课程 / 学习证据归档，对应 Session 1。*

# Session 4 学习记录

**日期**：2026-09-05  
**主题**：抛体落点实验台设计系统页面；全量测试 / 类型检查 / 构建；浏览器验收与截图存证  
**项目**：Physics Lab（抛体落点实验台）  
**分支**：`feat/projectile-lab`  
**HEAD at verification**：`f73bd3b`（提交本记录前）

---

## 1. 本次做了什么

1. 写入页面覆盖规则 `design-system/physics-lab/pages/projectile-motion.md`（覆盖 `MASTER.md`）。
2. 停掉 `npm run dev` 后跑全量检查：`npm test`、`tsc`、`eslint`、`npm run build`。
3. 重启开发服务器，按计划用 cursor-ide-browser 做 Mode A / Mode B / 目录 / 回归验收，并在 1366×768 截图。
4. 浏览器 MCP 标签无法保持存活（与 Task 6 同类故障）。未伪造截图。用 HTTP 对 SSR HTML 做了目录与路由的替补检查。

---

## 2. 设计系统页面

产出：

```text
design-system/physics-lab/pages/projectile-motion.md
```

要点：双模式 3D 实验台；命令栏分段模式开关；A 模式参数滑条 + 四图；B 模式三步栏 + 揭晓前测量板与 `|v| = —`；`>=1280×720` 无整页滚动。

---

## 3. 命令检查结果

在停止 `npm run dev` 后执行：

```bash
npm test 2>&1 | tail -12 && npx tsc --noEmit -p tsconfig.json && npx eslint app components lib && npm run build 2>&1 | tail -15
```

| 检查 | 结果 |
|------|------|
| `npm test` | `ℹ tests 67` / `ℹ pass 67` / `ℹ fail 0`（约 4.9 s） |
| `npx tsc --noEmit -p tsconfig.json` | 退出码 0，无诊断输出 |
| `npx eslint app components lib` | 退出码 0；1 条既有 warning：`components/catalog/experiment-card.tsx` 中 `article` + `aria-disabled`（`jsx-a11y/role-supports-aria-props`）。本任务未改该文件。 |
| `npm run build` | 成功；静态路由含 `/labs/projectile-motion` |

测试摘要尾部：

```text
ℹ tests 67
ℹ suites 0
ℹ pass 67
ℹ fail 0
ℹ duration_ms 4901.754459
```

构建路由表：

```text
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
└   /labs/[slug]
  ├ ● /labs/pull-friction
  ├ ● /labs/linear-motion
  └ ● /labs/projectile-motion
```

---

## 4. 浏览器验收清单

计划工具：cursor-ide-browser MCP（`browser_tabs` → `browser_navigate` → `browser_lock` → 交互 → `browser_take_screenshot` → unlock）。

### 4.1 MCP 尝试（均失败）

| 尝试 | 操作 | 结果 |
|------|------|------|
| 1 | `browser_navigate` → `http://localhost:3000/labs/projectile-motion` | `No browser tab available. Please navigate to a page first.` |
| 2 | `browser_tabs` `new`，得到 `viewId` `718c9e`，立刻 `browser_lock` | `No browser tab available. Please navigate to a page first.` |
| 3 | 对 `718c9e` `browser_navigate` | `Browser view not found: 718c9e` |
| 4 | `browser_navigate` `newTab: true` | `No browser tab available. Please navigate to a page first.` |
| 5 | `browser_tabs` `new` + `position: active`（`da764f`）再 navigate | `Browser view not found` |
| 6 | `browser_tabs` `new` + `position: side`（`dd1369`）再 lock | `No browser tab available` |
| 7 | 创建后等待再 `browser_tabs` `list` | `Open tabs:`（空） |
| 8 | `newTab: true` + `position: active` | `No browser tab available` |
| 9 | `127.0.0.1` + `newTab` + `position: side` | `No browser tab available` |

结论：标签创建后立刻从 MCP 会话消失，无法 lock、无法交互、无法截图。未写入假 PNG。

### 4.2 计划检查项与结果

| # | 检查 | 结果 |
|---|------|------|
| 1 | Mode A：开始 → 落地 → 1366×768 截图 `projectile-a-landed.png` | **未完成**（MCP 标签不可用） |
| 2 | Mode A：改滑条后回到 `t = 0` | **未完成**（需交互） |
| 3 | 1366×768 下 `document.documentElement.scrollHeight <= window.innerHeight` | **未完成**（需运行时视口） |
| 4 | Mode B：测量发射 → 填 v₀ → 核对 → 放置标靶 → 发射 → 结果截图 | **未完成**（需交互） |
| 5 | Mode B 揭晓前命令栏 `|v|` 为「—」 | **未完成**（需交互） |
| 6 | 目录 `/`：AP Physics 1 第三张卡「抛体落点」，无「等待开发」，可点进实验台 | **部分完成**（见 4.3 SSR HTML） |
| 7 | `/labs/pull-friction` 开始 / 暂停 / 重置，图表更新 | **未完成**（需交互） |
| 8 | `/labs/linear-motion` 开始 / 暂停 / 重置，图表更新 | **未完成**（需交互） |

### 4.3 HTTP / SSR 替补（`npm run dev` 已恢复后）

`curl` 状态码：

| URL | HTTP |
|-----|------|
| `/` | 200 |
| `/labs/projectile-motion` | 200 |
| `/labs/pull-friction` | 200 |
| `/labs/linear-motion` | 200 |

首页 SSR HTML：AP Physics 1 区块在「匀变速直线运动」之后是「抛体落点」卡片，含 `href="/labs/projectile-motion"` 的可点 `Link`，该卡片内无「等待开发」角标（下一项才是 `aria-disabled` 的未开发卡）。实验台 HTML 含「抛体落点实验台」「参数实验」「预测落点」「开始」。

这不能代替开始 / 落地 / 核对 / 发射，也不能代替 1366×768 截图。

---

## 5. 截图

计划路径（本次未能生成）：

```text
evidence/session4/projectile-a-landed.png
evidence/session4/projectile-b-result.png
```

原因：cursor-ide-browser MCP 无法维持标签；按任务要求不伪造截图。

---

## 6. 个人收获

- 设计系统单页文件应与实现对照：模式开关 class、揭晓前 `|v|`、测量板 vs 四图。
- 浏览器验收依赖 MCP 标签生命周期；标签即建即失时，只能记录精确错误并改用 HTTP 做静态替补。
- 全量门禁里 eslint warning 仍算退出码 0，但与「无输出」的期望不完全一致，需在报告里写明。

---

*本文件用于课程 / 学习证据归档，对应 Session 4。截图待 MCP 浏览器可用后补入同目录。*

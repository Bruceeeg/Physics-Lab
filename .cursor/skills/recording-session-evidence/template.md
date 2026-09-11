# Session README template

Copy this shape. Replace angle-bracket slots. Keep the numbered section titles in 中文. Add or drop middle sections to match the work; keep **1 / 个人收获 / 本次交付现状 / 后续可做**.

```markdown
# Session N 学习记录

**日期**：YYYY-MM-DD
**主题**：<一句话：做了什么 + 为什么值得记>
**项目**：Physics Lab
**相关对话**：[<对话标题>](<uuid>)
**功能提交**：`<short-hash>`（随后本文件记入学习证据）

---

## 1. 本次学了什么

1. <可复查的事实，不是过程流水>
2. …
3. …

---

## 2. <本次主线 1，例如规范 / 新实验台 / 显示 bug>

<对照表、公式、关键文件路径>

```text
lib/models/<name>.ts
components/…
```

---

## 3. <本次主线 2，如有>

---

## 4. 个人收获

- <以后还能用的判断，不是“学会了用 Cursor”>

---

## 5. 本次交付现状

- <ready 台数 / 测试条数 / 仍 pending 的课>
- 入口：

```text
http://localhost:3000/
http://localhost:3000/labs/<slug>
```

远程：`https://github.com/Bruceeeg/Physics-Lab.git` 的 `main`。

---

## 6. 后续可做

- <上一份 session 里没做完、本次仍缺的>

---

*本文件用于课程 / 学习证据归档，对应 Session N。<指向更早 session 的一句。>*
```

## Voice

- 学生课程证据，不是 changelog。
- 公式写纸面关系，并点出界面上学生会看错的地方。
- 测试写本次结束后的通过数，例如 `npm test` → **173** 通过。
- 多段对话合成一次 session 时，相关对话可以列多个，主题写成总括句。

## Header examples (real)

```text
Session 7 | 506f1d1 | 把剩下的 AP Physics 1 实验台做成可进的 3D 仪器
Session 8 | b401b9e | 三条显示规范落地；Physics 2 与 C 从等待开发做成可进实验台
```

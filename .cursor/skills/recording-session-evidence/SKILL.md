---
name: recording-session-evidence
description: Use when the user asks to 上传代码, 推送到远程, 撰写evidence, 加上一个session, archive a learning session, or record Physics Lab course evidence after finishing work.
---

# Recording Session Evidence

把已完成的实验台工作提交、推到 GitHub，并由 agent **自己写**下一份 `evidence/sessionN` 学习记录。不要让学生起草 README。

**Core principle:** 先功能提交，再用该 hash 写证据，再提交证据，最后一次推送。

## Checklist

```
- [ ] 1. Read last session + git state
- [ ] 2. Verify tests
- [ ] 3. Feature commit (no evidence file)
- [ ] 4. Agent writes evidence/sessionN/README.md
- [ ] 5. Evidence commit
- [ ] 6. Push origin HEAD
- [ ] 7. Confirm clean tree tracking origin
```

## Step 1 — Context

Read `evidence/session*/README.md`. Next N = max existing + 1.

In parallel:

```powershell
git status
git diff --stat
git log -15 --oneline
git remote -v
git branch -vv
```

Learn: uncommitted files, last commit style, whether `main` tracks `origin/main`.

Collect related chat ids with SearchConversations / agent transcripts. Link as `[title](uuid)` — uuid **without** `.jsonl`.

## Step 2 — Verify

Run the project test command and read the full summary.

```powershell
npm test
```

Do not commit or write “测试通过” unless this run’s output shows **fail 0**.

If tests fail: stop, fix, re-run. Do not archive a broken tree.

## Step 3 — Feature commit

Stage **this session’s product files**. Include specs/plans and `.cursor/rules` when they were part of the work.

Leave out:

- `.env*`, credentials, secrets
- Unrelated vendor skill dumps under `.cursor/skills/`
- The new `evidence/sessionN` file (it does not exist yet)

Commit message: one English imperative sentence, same voice as `git log` (`Add…`, `Open…`, `Record…`). Focus on why.

**Never** `git config`. If Git says author identity unknown, copy the last commit and pass env vars for that command only:

```powershell
git log -1 --format="name=%an%nemail=%ae"
$env:GIT_AUTHOR_NAME='…'
$env:GIT_AUTHOR_EMAIL='…'
$env:GIT_COMMITTER_NAME='…'
$env:GIT_COMMITTER_EMAIL='…'
```

PowerShell commit (no `&&`, no bash heredoc unless bash is actually available):

```powershell
git commit -m @"
Open Physics 2 and C labs and share two-decimal xy/friction display.

"@
```

Record the feature hash (`git log -1 --format=%h`).

**Already committed, nothing to stage:** skip this step; use that hash as 功能提交.

## Step 4 — Write the session (agent, not the user)

Create `evidence/sessionN/README.md` from [template.md](template.md).

Must:

- 中文学习记录，不是聊天流水账
- 写「学了什么 / 为什么」，公式与对照表用 KaTeX `\( \)`
- Header 里填 **功能提交** 为 Step 3 的短 hash
- 列出本次相关对话
- 对照上一份 session 的「后续可做」，写清本次实际交付和仍缺什么
- 脚注指向更早的 session（目录考纲 Session 5，抛体 Session 6，P1 其余台 Session 7，…）

Do not paste transcripts. Do not invent screenshots. If browser verification happened, say what was checked and what could not be checked.

## Step 5 — Evidence commit

```powershell
git add evidence/sessionN/README.md
git commit -m @"
Record Session N evidence for <short topic>.

"@
```

Same author-env rule as Step 3.

## Step 6 — Push

User saying 上传 / 推送到远程 is enough. Do **not** force-push.

```powershell
git push origin HEAD
```

Remote is `https://github.com/Bruceeeg/Physics-Lab.git`, branch usually `main`.

## Step 7 — Confirm

```powershell
git status
git log -3 --oneline
```

Need: `up to date with 'origin/main'` and `working tree clean`.

Reply to the user with: remote URL, two hashes, session path, 2–4 sentence 学习摘要.

## Conditionals

| State | Action |
|---|---|
| Uncommitted feature work | Steps 2 → 7 |
| Feature already committed, not pushed, no session file | Steps 4 → 7 |
| Already pushed, user only wants a session | Steps 4–5 then 6–7 |
| On a feature branch the user did not ask to merge | Push that branch; do not merge `main` unless asked |
| User did not ask to push | Stop after Step 5 |

## Red flags

- One commit that mixes product files and `evidence/sessionN` (evidence cannot cite its own hash)
- Asking Bruce to write or outline the README
- `git config`, `--force`, `--no-verify`
- Claiming tests passed from an old run
- English-only evidence (this repo’s sessions are 中文)
- Skipping the previous session’s numbering

## Common mistakes

| Excuse | Reality |
|---|---|
| 「先问学生写什么」 | 自己撰写。对照 diff + 对话 + 上一份 session |
| 「功能和证据放一个 commit 更干净」 | 证据要引用功能 hash，必须两笔 |
| 「PowerShell 用 &&」 | 旧版会解析失败；分号或分开跑 |
| 「没有 user.name 就 git config」 | 禁止改 config；用环境变量 |
| 「.cursor 一律不提交」 | 无关 skills 不交；本次写的 `.cursor/rules` 要交 |

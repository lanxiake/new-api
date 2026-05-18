---
title: "5 Tips to Cut Claude Code Token Usage by 30%"
published: false
tags: claudecode, ai, productivity, tips
---

I've been using Claude Code daily for the past few months. The output quality is great, but the API bill at the end of the month was painful. After some experimentation, I found a few habits that consistently cut my token consumption by 25–35% without sacrificing code quality.

Sharing them here in case anyone else is in the same boat.

---

## 1. Put a `CLAUDE.md` at the project root

Claude Code reads `CLAUDE.md` automatically on startup and treats it as durable context. Without it, Claude has to re-discover your project structure on every session — that's a lot of file-reading tokens.

A minimal template that works for me:

```markdown
# Project: <name>

## Stack
- Language: Go 1.22 / TypeScript 5
- Framework: Gin / React 19
- DB: PostgreSQL via GORM

## Layout
- `controller/` — HTTP handlers
- `service/`    — business logic
- `model/`      — DB models

## Conventions
- Use `common.Marshal` instead of `encoding/json`
- All new code must compile under `go vet`
```

Keep it under 200 lines. Anything longer and Claude will start spending tokens summarizing the file itself.

---

## 2. Scope each session to a single task

If you start a session with "let's refactor the auth layer and also add OAuth and also fix the rate limiter," Claude keeps all three goals in context the whole time. Every subsequent message pays for that context.

Habit: **one task per session, then `/clear`**. You'll see token usage drop noticeably on the second message of each session.

---

## 3. Use Prompt Caching aggressively

Both Anthropic's API and most relays support prompt caching. The way it works: stable prefixes (system prompt, file contents, project context) are cached for 5 minutes at a small one-time write cost, then reads are ~10% of normal price.

What this means in practice:
- Don't change `CLAUDE.md` mid-session — it invalidates the cache
- When asking follow-up questions, append rather than rewrite the prompt
- For long files, paste once and refer back to "the file above" instead of re-pasting

For a 200K-token project context, my cache hit rate is around 70%, which roughly cuts input cost from $0.60 to $0.18 per session.

---

## 4. Prefer `Read` tool over pasting code into the prompt

Two ways to give Claude a file:

```
A) "Here's the content: <paste 5000 lines>"
B) "Read src/foo.go"
```

Both work, but (B) is cheaper because Claude only reads the file when it actually needs to. Often it'll read a 50-line slice instead of the whole file. With (A), you've already paid for all 5000 lines whether they were needed or not.

---

## 5. Use a smaller model for routine tasks

You don't need Opus for "write a unit test for this function." Switch to Sonnet (or Haiku for trivial edits) when the task is mechanical:

- Boilerplate generation
- Adding logging
- Renaming variables across a file
- Simple test cases

Claude Code lets you swap models per session. For me, Sonnet handles ~70% of daily edits, and I save Opus for hard reasoning (architecture decisions, bug investigation, complex refactors).

Rough cost difference per million output tokens:
- Opus 4.7: $75
- Sonnet 4.5: $15
- Haiku 4: $5

A 5x–15x saving on the 70% of routine work adds up fast.

---

## What didn't work for me

- **"Compress" the prompt manually** — too much effort, marginal savings, and Claude often misses context you compressed away
- **Using ultra-cheap third-party "Opus" relays** — twice I found out the model was actually a Chinese open-source model in disguise. Quality dropped immediately. If price looks 5x too good to be true, it usually is
- **Disabling Prompt Caching to "stay on the latest context"** — caching is invalidated automatically when context changes, so you don't gain anything by disabling it

---

## TL;DR

| Habit | Saving |
|-------|--------|
| `CLAUDE.md` at project root | 20–30% on first messages |
| One task per session + `/clear` | 10–20% on long sessions |
| Use Prompt Caching | 30–60% on follow-ups |
| Use `Read` tool, don't paste | 10–30% on file-heavy tasks |
| Sonnet/Haiku for routine work | 5–15× on those tasks |

Combined effect on my monthly bill: roughly a third of what I was paying before.

If you have other tips that worked for you, I'd love to hear them in the comments.

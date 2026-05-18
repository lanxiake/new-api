# How I Cut My Claude Code API Bill By One-Third

*A pragmatic playbook from someone who watched their token usage triple in two months.*

---

I hit the same wall most Claude Code users eventually hit: the tool was so good at doing real work that I started using it for everything, and the monthly invoice from my API provider tripled in two months. Not because Claude got more expensive — because I got lazier about how I prompted it.

After a few weekends of measuring what actually moved the needle, I landed on five habits that consistently shave 25–35% off my bill without giving up output quality. None of them require a different model, a different IDE, or any kind of "prompt engineering" gymnastics.

Here they are, in order of impact.

---

## 1. Put a `CLAUDE.md` at the project root

Claude Code reads `CLAUDE.md` automatically on startup and treats it as durable, sticky context. Without it, every fresh session forces Claude to re-discover the project — opening files just to figure out the layout, re-confirming which language version you're on, etc. That re-discovery is pure token waste.

A minimal version that worked for me on a 200K-line Go monorepo:

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

**Real impact**: my first-message token count dropped from ~8K to ~3K once Claude stopped doing exploratory reads on every session.

Keep it under 200 lines. Anything longer and Claude starts spending tokens *summarizing the file itself*, which defeats the purpose.

---

## 2. One task per session, then `/clear`

If you start a session with "let's refactor the auth layer and also add OAuth and also fix the rate limiter," Claude keeps all three goals in context for the rest of the session. Every subsequent message pays for that triple-context.

Switching to **one task per session** then running `/clear` was the single biggest behavioral change I made. The token consumption curve flattened almost immediately — no more "why did message #20 cost as much as messages #1–10 combined?" surprises.

If you absolutely need cross-task continuity, a 3-line summary in `CLAUDE.md` is cheaper than carrying the full prior context.

---

## 3. Use Prompt Caching aggressively

Most Anthropic-compatible APIs support prompt caching: stable prefixes (system prompt, file contents, project context) get cached for 5 minutes at a small one-time write cost. Subsequent reads cost roughly 10% of normal price.

Three rules that made caching actually work for me:

- **Don't change `CLAUDE.md` mid-session** — every edit invalidates the cache.
- **Append, don't rewrite** when iterating on a prompt. "Now also handle X" is cache-friendly; restating the entire prompt isn't.
- **Paste long files once, then reference back** ("the file above" / "the function I showed earlier") instead of re-pasting.

For my 200K-token project context, sustained cache-hit rate is around 70%, which roughly cuts input cost from $0.60 per session down to $0.18.

---

## 4. Prefer the `Read` tool over pasting code into the prompt

Two ways to give Claude a file:

```
A) "Here's the content: <paste 5000 lines>"
B) "Read src/foo.go"
```

Both work. (B) is cheaper because Claude only reads the file when it actually needs to — and it usually reads a 50-line slice instead of the whole thing. With (A), you've already paid for all 5000 lines whether they were needed or not.

The mental shift is small: stop being "helpful" by pre-pasting context. Let Claude pull it on demand.

---

## 5. Use a smaller model for routine tasks

You don't need Opus for "write a unit test for this function." When the task is mechanical, swap down:

- Boilerplate generation
- Adding logging
- Renaming variables across a file
- Simple test cases

Claude Code lets you swap models per session. For me, **Sonnet handles ~70% of daily edits**, and I save Opus for the things it's actually good at — architecture decisions, bug investigation, complex refactors.

Rough cost difference per million output tokens at the time of writing:

- Opus 4.7: $75
- Sonnet 4.5: $15
- Haiku 4: $5

A 5–15× saving on the 70% of routine work is where the *real* monthly bill reduction comes from.

---

## What didn't work for me

I tried a bunch of clever-sounding optimizations that turned out to be dead ends:

- **Manual prompt "compression"** — too much effort, marginal savings, and Claude often misses context I'd compressed away. The model is a better judge of what to read than I am.
- **Ultra-cheap third-party "Opus" relays** — twice I found out the model was a Chinese open-source model wearing an Opus name tag. Code quality dropped instantly. Rule of thumb: if the price looks 5× too good to be true, it is.
- **Disabling prompt caching to "stay current"** — caching invalidates automatically when context changes. Disabling it just makes everything more expensive, full stop.

---

## The summary table

| Habit | Saving |
|-------|--------|
| `CLAUDE.md` at project root | 20–30% on first messages |
| One task per session + `/clear` | 10–20% on long sessions |
| Use Prompt Caching | 30–60% on follow-ups |
| Use `Read` tool, don't paste | 10–30% on file-heavy tasks |
| Sonnet/Haiku for routine work | 5–15× on those tasks |

Combined effect on my monthly bill: **roughly a third of what I was paying before**, for the same volume of output and noticeably better Claude behavior (less context-overload confusion).

---

If you've found other things that worked — or if any of these *didn't* work for your stack — I'd genuinely love to hear about it. Best optimization tip wins a beer next time we cross paths.

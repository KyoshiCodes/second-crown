# SECOND CROWN — Launch Runbook

Exact steps to start the project and run the Claude Code vs Gemini head-to-head test.
Written for Windows PowerShell, since that's your machine. Everything here is free.

**Two version-sensitive notes.** Install commands change; if one fails, check the official
docs — [Claude Code setup](https://code.claude.com/docs/en/setup) and
[Gemini CLI installation](https://geminicli.com/docs/get-started/installation/) — rather than
guessing. And run each agent in its **own folder**, or they will overwrite each other's work
during the bake-off.

---

## Step 0 — Verify your toolchain

Open PowerShell and run these one at a time:

```powershell
node -v
npm -v
git --version
```

You want Node 20 or newer. If any command errors, install that tool before continuing.

Set your git identity if you've never done it (this is what shows on commits):

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

---

## Step 1 — Create the GitHub repository

In your browser:

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `second-crown`
3. Description: `Idle kingdom-builder and grand-war hybrid`
4. Visibility: **Private**
5. Do **not** add a README, .gitignore, or license — the agent creates those
6. Click **Create repository**
7. Leave the page open; you'll want the URL

**Why private and no license:** an MIT license on a game you might sell later gives it away.
Decide licensing before you ever make it public. The prompt tells agents to ask you first.

---

## Step 2 — Set up the two bake-off folders

You're running two agents against the same brief, so they each get their own workspace.

```powershell
cd $HOME
mkdir second-crown-bakeoff
cd second-crown-bakeoff
mkdir claude
mkdir gemini
```

In **each** folder, create a `docs` subfolder and place these two files:

- `docs/CONCEPT-BIBLE.md` — the concept bible I gave you
- `docs/MASTER-PROMPT.md` — the master build prompt

```powershell
cd $HOME\second-crown-bakeoff\claude
mkdir docs
# copy the two .md files into .\docs\ using File Explorer, then:
cd ..\gemini
mkdir docs
# copy the same two files into .\docs\ here as well
```

Then initialize git in each so the agents have version control from the first commit:

```powershell
cd $HOME\second-crown-bakeoff\claude
git init
git add .
git commit -m "docs: add concept bible and master build prompt"

cd $HOME\second-crown-bakeoff\gemini
git init
git add .
git commit -m "docs: add concept bible and master build prompt"
```

Don't connect either one to GitHub yet. You'll push only the winner.

---

## Step 3 — Claude Code

### Install

```powershell
npm install -g @anthropic-ai/claude-code
```

Alternative if npm gives you trouble ([per the docs](https://code.claude.com/docs/en/setup)):

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Launch

```powershell
cd $HOME\second-crown-bakeoff\claude
claude
```

First run will walk you through signing in with your Claude Pro account in the browser.

### First session, in order

1. **Run `/init`.** This generates a starter `CLAUDE.md` context file. You'll tell it to
   slim that down to a pointer later.

2. **Paste the Claude Code adapter preamble**, then the entire master prompt, in one
   message. It's long — that's fine and intended.

   Instead of pasting the prompt body, you can send this, which is cheaper on context:

   ```
   Read docs/MASTER-PROMPT.md and docs/CONCEPT-BIBLE.md, then follow the master prompt
   exactly, beginning with Phase A. The prompt is your standing instructions for this
   project.
   ```

   Paste the adapter preamble regardless — it's the Claude-specific behavior.

3. **Expect only Phase A.** Stack confirmation or challenge, three predicted failure points,
   underspecified areas, at most three questions, then a stop. **If it starts writing code,
   stop it and say: "Return to the Phase A gate. No code yet."** Enforcing the gates in the
   first two phases is what makes them hold for the next fifty.

4. **Answer its questions, or reply "use your defaults."** Then approve Phase B.

5. **Stop after Phase B.** Both agents get exactly Phase A and Phase B for a fair comparison.

### Guardrails worth knowing

| Situation | What to do |
|---|---|
| It asks permission to run a command | Read it. Approve reads, builds, installs, and git adds. Pause on anything that deletes |
| Change touching 3+ files | Ask it to use plan mode first |
| Reply is getting enormous | Say "stop, summarize, and give me the phase gate" |
| Context filling up | `/compact` to condense, `/clear` only after a HANDOFF refresh |
| Near a usage limit | "Refresh docs/HANDOFF.md and give me the pickup prompt for the next agent" |

**Never `/clear` before refreshing `HANDOFF.md`.** That's how you lose a session's context.

---

## Step 4 — Gemini

You have two options and the choice matters for the fairness of your test.

**Gemini CLI (recommended for the bake-off).** Terminal agent with filesystem access, so it
competes on equal footing with Claude Code.

```powershell
npm install -g @google/gemini-cli
cd $HOME\second-crown-bakeoff\gemini
gemini
```

It will prompt you to sign in with your Google account on first run.

**Google AI Studio in the browser.** No filesystem access — it hands you file contents to
save manually. Fine for long-context whole-repo reviews later, poor for a fair head-to-head.
If you use it anyway, use the AI Studio adapter preamble so it outputs whole files with paths.

### First session, in order

Same as Claude:

1. Paste the **Gemini CLI adapter preamble**, then either the full master prompt or:

   ```
   Read docs/MASTER-PROMPT.md and docs/CONCEPT-BIBLE.md, then follow the master prompt
   exactly, beginning with Phase A.
   ```

2. Ask it to create `GEMINI.md` as a short pointer to `AGENTS.md` once `AGENTS.md` exists.
3. Phase A only. Stop it if it writes code.
4. Approve Phase B. Stop there.

---

## Step 5 — Score the two

Fill this in honestly. The temptation is to reward the one that produced more text; resist it.

| Criterion | Why it matters | Claude | Gemini |
|---|---|---|---|
| **Read the bible, or pattern-matched a generic idle game?** | Tells you whether it will follow your design at all | | |
| **Quality of the three predicted failure points** | Did it find real risks, or restate the obvious? | | |
| **Caught the determinism vs interactive-battle collision?** | The sharpest trap in this design. Bonus points if unprompted | | |
| **Caught the offline-settlement performance problem?** | Millions of ticks on load. A serious agent flags this | | |
| **Challenged the stack with a real argument** | Or did it just agree to be agreeable? | | |
| **Would a stranger understand its ARCHITECTURE.md?** | This is your handoff insurance | | |
| **Is its save schema and migration hook actually specified?** | Vague here means pain at 0.4.0 | | |
| **Were its questions to you smart or generic?** | Reveals whether it understood the design | | |
| **Did it respect the phase gates without being told twice?** | Predicts every future session | | |
| **Did it fabricate anything?** | Made-up library, API, or version = a trust problem | | |

The three rows that predict the rest of the project: whether it caught the determinism
collision, whether it respected the gates, and whether its `ARCHITECTURE.md` is legible to
someone who wasn't there.

---

## Step 6 — Promote the winner

Push the winning folder to GitHub:

```powershell
cd $HOME\second-crown-bakeoff\claude   # or \gemini
git remote add origin https://github.com/YOUR-USERNAME/second-crown.git
git branch -M main
git push -u origin main
```

Then rename the folder to `second-crown` and move it somewhere permanent. Keep the losing
folder for a week — steal its best architecture ideas and any risk it caught that the winner
missed, then delete it.

Before you continue building: paste the loser's best insights into the winner as
`docs/DECISIONS.md` entries. Two independent architectural opinions is a luxury; don't waste
half of it.

---

## Step 7 — Install the free-tier architect

Once the winner is chosen and Phase B is committed:

1. Open ChatGPT free (or Grok free).
2. Paste the **condensed prompt** from Part 3 of the build prompt doc, plus the concept bible.
3. Paste the winner's `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`.
4. Ask: *"Write the implementation brief for Phase C, version 0.1.0."*
5. Take that brief to your Pro agent and have it execute.

That's the standing loop from here on:

```
ChatGPT free writes the spec
      ↓
Pro agent implements, commits, bumps version, refreshes HANDOFF.md
      ↓
ChatGPT free writes patch notes, changelog, progress log, balance tuning
      ↓
You playtest against the manual checklist
      ↓
repeat
```

**Balance tuning stays on the free tier.** It's arithmetic over harness output, not
engineering, and this project will need an enormous amount of it. That routing alone protects
most of your Pro usage.

---

## Step 8 — The two rituals

**End of every session, without exception:**

> "Refresh docs/HANDOFF.md now, commit everything, and give me the pickup prompt for the
> next agent."

Save that pickup prompt in an Obsidian daily note. This single habit is the difference
between a project that survives usage limits and one that dies at them.

**When you hit a usage limit mid-task:**

1. Don't panic and don't switch agents blind.
2. Open the repo, read `docs/HANDOFF.md` section 12.
3. Paste that section into the other agent, along with its adapter preamble.
4. Ask it to verify the build is healthy using section 10 before changing anything.

If section 12 isn't good enough to resume from, that's a bug in your process, not bad luck.
Tell whichever agent wrote it to do better next time.

---

## Step 9 — Open the docs in Obsidian

1. Open Obsidian → **Open folder as vault**
2. Select the repo's `docs` folder
3. Turn on graph view

The prompt requires agents to cross-link docs with `[[wiki-links]]`, so the graph becomes real
navigation rather than decoration. This is also the fastest way to spot a doc that's gone
stale and orphaned.

---

## What "going well" looks like after week one

- A private GitHub repo tagged `v0.1.0`
- An app that runs locally, shows one resource ticking up, and survives a reload
- `docs/` containing an architecture doc, a roadmap, a handoff state, and a decisions log
- A passing CI run on GitHub Actions
- The offline-equals-online test green
- You understanding roughly what each package does, because the agent explained it

If you have all of that and the game is boring, you are exactly on schedule. Boring at 0.1.0
is correct. The verdict comes at 0.2.0.

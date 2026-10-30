from pathlib import Path
p = Path("packages/app/src/JoinHoldCard.tsx")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
idx = next(i for i, ln in enumerate(lines) if ln.startswith("export function JoinHoldCard"))
helper = [
    "export type IntentEntry = { realmId: string; line: string };\n",
    "/** Newest first, capped at 3, filtered to the active hold. Empty when there is no hold. */\n",
    "export function resolveHoldIntentLines(realmId: string | null, entries: IntentEntry[]): string[] {\n",
    "  if (realmId === null) return [];\n",
    "  return entries\n",
    "    .filter((e) => e.realmId === realmId)\n",
    "    .map((e) => e.line)\n",
    "    .slice(-3)\n",
    "    .reverse();\n",
    "}\n",
]
lines[idx:idx] = helper
for i, ln in enumerate(lines):
    if ln.startswith("export function JoinHoldCard({ signedIn }"):
        lines[i] = "export function JoinHoldCard({\n"
        lines.insert(i + 1, "  signedIn,\n")
        lines.insert(i + 2, "  intentLines,\n")
        lines.insert(i + 3, "  intentPulseKey,\n")
        lines.insert(i + 4, "}: {\n")
        lines.insert(i + 5, "  signedIn: boolean;\n")
        lines.insert(i + 6, "  intentLines?: string[];\n")
        lines.insert(i + 7, "  intentPulseKey?: number;\n")
        lines.insert(i + 8, "}) {\n")
        break
for i, ln in enumerate(lines):
    if "const lastIntents = realmId === null ? [] : recentIntents(realmId, 3);" in ln:
        lines[i] = "  const lastIntents = intentLines ?? (realmId === null ? [] : recentIntents(realmId, 3));\n"
        break
for i, ln in enumerate(lines):
    if ln.startswith("import { joinRealm"):
        lines.insert(i + 1, 'import { IntentPip } from "./hud/IntentPip";\n')
        break
text = "".join(lines)
old = "      {lastIntents.length > 0 ? (\n        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }} aria-label=\"Last intents\">\n          {lastIntents.map((line, i) => <div key={i}>{line}</div>)}\n        </div>\n      ) : null}"
new = "      {lastIntents.length > 0 ? (\n        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8, display: \"flex\", alignItems: \"flex-start\", gap: 6 }} aria-label=\"Last intents\">\n          <IntentPip pulse={intentPulseKey !== undefined} pulseKey={intentPulseKey} />\n          <div className=\"sc-intent-log-lines\">\n            {lastIntents.map((line, i) => <div key={i}>{line}</div>)}\n          </div>\n        </div>\n      ) : null}"
if old not in text:
    raise SystemExit("intent-log block not found")
text = text.replace(old, new, 1)
p.write_text(text, encoding="utf-8")
print("patched")

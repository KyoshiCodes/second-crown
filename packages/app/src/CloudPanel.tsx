import React from "react";
import {
  absorbHashSession,
  cloudName,
  cloudToken,
  cloudUrl,
  createGuest,
  defaultCloudUrl,
  discordLoginUrl,
  health,
  openWatch,
  pullSave,
  pushSave,
  restoreToken,
  setCloudUrl,
} from "./net/cloud";
import { loadFromIndexedDb, saveToIndexedDb } from "./save/indexedDb";
import { getTesterName } from "./TesterBar";

export function CloudPanel() {
  const [url, setUrl] = React.useState(() => cloudUrl() || defaultCloudUrl());
  const [status, setStatus] = React.useState("");
  const [discord, setDiscord] = React.useState(false);
  const [name, setName] = React.useState(cloudName);
  const [kind, setKind] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [watchUrl, setWatchUrl] = React.useState("");

  async function refreshMe() {
    const token = cloudToken();
    if (!token) {
      setName("");
      setKind("");
      return;
    }
    try {
      const res = await fetch(`${cloudUrl()}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const me = await res.json();
      setName(me.name);
      setKind(me.kind || "");
    } catch {
      /* ignore */
    }
  }

  async function autoPush() {
    if (!cloudToken()) return;
    const raw = await loadFromIndexedDb();
    if (!raw) return;
    try {
      await pushSave(raw);
    } catch {
      /* ignore */
    }
  }

  React.useEffect(() => {
    const fromHash = absorbHashSession();
    setName(cloudName());
    if (!localStorage.getItem("sc-cloud-url")) {
      setCloudUrl(defaultCloudUrl());
      setUrl(defaultCloudUrl());
    }
    if (fromHash) setStatus("Discord login saved on this browser.");
    health()
      .then((h) => {
        setDiscord(h.discord);
        if (!fromHash) setStatus(h.ok ? "Cloud reachable. Auto-save is on." : "Cloud down.");
      })
      .catch(() => setStatus("Cloud unreachable — check the URL."));
    void refreshMe();
    const id = window.setInterval(() => void autoPush(), 120_000);
    const onHide = () => {
      if (document.visibilityState === "hidden") void autoPush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => void autoPush());
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const token = cloudToken();
  const summary = name
    ? kind === "discord"
      ? `Cloud · Discord ${name}`
      : `Cloud · guest ${name}`
    : "Cloud · not signed in";

  return (
    <details style={{ maxWidth: 760, margin: "8px auto 0", padding: "8px 12px", background: "#16100c", borderRadius: 8 }}>
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>{summary}</summary>
      <div style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 8px" }}>
        Signed-in saves auto-push. Share a watch link so a friend can spectate (read-only).
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} onBlur={() => setCloudUrl(url)} placeholder={defaultCloudUrl()} style={{ minWidth: 220, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }} />
        <button type="button" onClick={async () => {
          setCloudUrl(url);
          try {
            const g = await createGuest(getTesterName() || "Guest");
            setName(g.name);
            setKind("guest");
            setStatus(`Guest session ${g.id}.`);
            setShowCode(true);
          } catch { setStatus("Could not create guest."); }
        }}>Guest session</button>
        <button type="button" disabled={!discord} onClick={() => { setCloudUrl(url); window.location.href = discordLoginUrl(); }}>Log in with Discord</button>
        <button type="button" disabled={!token} onClick={async () => {
          const raw = await loadFromIndexedDb();
          if (!raw) { setStatus("No local save to push."); return; }
          try { await pushSave(raw); setStatus("Pushed local save to cloud."); } catch { setStatus("Push failed."); }
        }}>Push save</button>
        <button type="button" disabled={!token} onClick={async () => {
          try {
            const raw = await pullSave();
            await saveToIndexedDb(raw);
            setStatus("Pulled cloud save. Reload the page to play it.");
          } catch { setStatus("No cloud save yet."); }
        }}>Pull save</button>
        <button type="button" disabled={!token} onClick={async () => {
          try {
            const raw = await loadFromIndexedDb();
            if (raw) await pushSave(raw);
            const w = await openWatch();
            setWatchUrl(w.url);
            setStatus("Watch link ready.");
            void navigator.clipboard.writeText(w.url);
          } catch { setStatus("Could not open a watch room. Sign in first."); }
        }}>Share watch link</button>
      </div>
      {watchUrl ? <div style={{ fontSize: 12, marginTop: 8 }}>Watch: <code>{watchUrl}</code></div> : null}
      {token ? (
        <div style={{ fontSize: 12, marginTop: 8 }}>
          <button type="button" onClick={() => setShowCode((v) => !v)}>{showCode ? "Hide recovery code" : "Show recovery code"}</button>
          {showCode ? <div style={{ marginTop: 6 }}><code style={{ wordBreak: "break-all" }}>{token}</code></div> : null}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste recovery code" style={{ minWidth: 220, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }} />
        <button type="button" onClick={async () => {
          setCloudUrl(url);
          try {
            const me = await restoreToken(code);
            setName(me.name);
            setKind(me.kind || "guest");
            setCode("");
            setStatus(`Restored ${me.name}.`);
          } catch { setStatus("That recovery code is not valid on this server."); }
        }}>Restore code</button>
      </div>
      <div style={{ fontSize: 12, marginTop: 6, opacity: 0.8 }}>{status}</div>
    </details>
  );
}

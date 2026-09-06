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
        if (!fromHash) setStatus(h.ok ? "Cloud reachable." : "Cloud down.");
      })
      .catch(() => setStatus("Cloud unreachable — check the URL."));
    void refreshMe();
  }, []);

  const token = cloudToken();

  return (
    <div style={{ maxWidth: 760, margin: "8px auto 0", padding: "10px 12px", background: "#16100c", borderRadius: 8 }}>
      <strong>Cloud playtest</strong>
      <div style={{ fontSize: 12, opacity: 0.75, margin: "4px 0 8px" }}>
        Guest session creates a private save. Copy your recovery code if you switch browsers.
        Name alone cannot open someone else’s file.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setCloudUrl(url)}
          placeholder={defaultCloudUrl()}
          style={{ minWidth: 220, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }}
        />
        <button
          type="button"
          onClick={async () => {
            setCloudUrl(url);
            try {
              const g = await createGuest(getTesterName() || "Guest");
              setName(g.name);
              setKind("guest");
              setStatus(`Guest session ${g.id}. Copy your recovery code below.`);
              setShowCode(true);
            } catch {
              setStatus("Could not create guest.");
            }
          }}
        >
          Guest session
        </button>
        <button
          type="button"
          disabled={!discord}
          onClick={() => {
            setCloudUrl(url);
            window.location.href = discordLoginUrl();
          }}
        >
          Log in with Discord
        </button>
        <button
          type="button"
          disabled={!token}
          onClick={async () => {
            const raw = await loadFromIndexedDb();
            if (!raw) {
              setStatus("No local save to push.");
              return;
            }
            try {
              await pushSave(raw);
              setStatus("Pushed local save to cloud.");
            } catch {
              setStatus("Push failed.");
            }
          }}
        >
          Push save
        </button>
        <button
          type="button"
          disabled={!token}
          onClick={async () => {
            try {
              const raw = await pullSave();
              await saveToIndexedDb(raw);
              setStatus("Pulled cloud save. Reload the page to play it.");
            } catch {
              setStatus("No cloud save yet.");
            }
          }}
        >
          Pull save
        </button>
      </div>
      {token ? (
        <div style={{ fontSize: 12, marginTop: 8 }}>
          <button type="button" onClick={() => setShowCode((v) => !v)}>
            {showCode ? "Hide recovery code" : "Show recovery code"}
          </button>
          {showCode ? (
            <div style={{ marginTop: 6 }}>
              <code style={{ wordBreak: "break-all" }}>{token}</code>{" "}
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(token);
                  setStatus("Recovery code copied.");
                }}
              >
                Copy
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste recovery code"
          style={{ minWidth: 220, background: "#1a1410", color: "#e8dcc8", border: "1px solid #3a3228" }}
        />
        <button
          type="button"
          onClick={async () => {
            setCloudUrl(url);
            try {
              const me = await restoreToken(code);
              setName(me.name);
              setKind(me.kind || "guest");
              setCode("");
              setStatus(`Restored ${me.name}. Pull save if you need the cloud file.`);
            } catch {
              setStatus("That recovery code is not valid on this server.");
            }
          }}
        >
          Restore code
        </button>
      </div>
      <div style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
        {name
          ? kind === "discord"
            ? `Signed in with Discord as ${name}`
            : `Signed in as guest ${name}`
          : "Not signed in."}
      </div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>{status}</div>
    </div>
  );
}

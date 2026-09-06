import React from "react";
import { crestFor } from "./crests";

export function Crest(props: { realmId: string; size?: number }) {
  const c = crestFor(props.realmId);
  const size = props.size ?? 28;
  return (
    <span
      title={c.label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 6,
        background: c.color,
        color: "#fff",
        fontSize: size * 0.55,
        fontWeight: 700,
        marginRight: 6,
        verticalAlign: "middle",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)",
      }}
    >
      {c.glyph}
    </span>
  );
}

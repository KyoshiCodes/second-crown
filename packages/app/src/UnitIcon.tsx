import React from "react";

const SIZE = 48;

function Svg(props: { title: string; children: React.ReactNode; bg: string }) {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 48 48" aria-label={props.title} role="img">
      <rect width="48" height="48" rx="8" fill={props.bg} />
      {props.children}
    </svg>
  );
}

export function UnitIcon(props: { typeId: string; size?: number }) {
  const typeId = props.typeId;
  const wrap = (node: React.ReactNode) => (
    <span style={{ display: "inline-block", width: props.size ?? SIZE, height: props.size ?? SIZE }}>
      {node}
    </span>
  );

  if (typeId === "archer") {
    return wrap(
      <Svg title="Archer" bg="#1e3d32">
        <path d="M14 24 L34 14" stroke="#c4a574" strokeWidth="2" fill="none" />
        <path d="M32 10 Q40 24 32 38" stroke="#8b5a2b" strokeWidth="2.5" fill="none" />
        <circle cx="18" cy="14" r="4" fill="#e6d2b0" />
        <rect x="16" y="18" width="5" height="14" rx="2" fill="#2f6f4e" />
        <rect x="12" y="22" width="4" height="10" fill="#6b3f1d" />
      </Svg>
    );
  }
  if (typeId === "spearman") {
    return wrap(
      <Svg title="Spearman" bg="#1a2a40">
        <circle cx="22" cy="13" r="4" fill="#e6d2b0" />
        <rect x="18" y="17" width="8" height="16" rx="2" fill="#3d5a80" />
        <line x1="30" y1="6" x2="30" y2="40" stroke="#c0c8d0" strokeWidth="2" />
        <polygon points="30,4 27,10 33,10" fill="#d8dee6" />
        <rect x="16" y="33" width="12" height="4" fill="#2a3340" />
      </Svg>
    );
  }
  if (typeId === "knight") {
    return wrap(
      <Svg title="Knight" bg="#3a2a10">
        <rect x="18" y="8" width="12" height="10" rx="3" fill="#c9b37a" />
        <rect x="16" y="18" width="16" height="14" rx="2" fill="#6e5a2c" />
        <circle cx="14" cy="28" r="5" fill="#4a3a1c" />
        <circle cx="34" cy="28" r="5" fill="#4a3a1c" />
        <rect x="32" y="10" width="3" height="16" fill="#c0c8d0" />
        <circle cx="24" cy="12" r="2" fill="#1a140c" />
      </Svg>
    );
  }
  return wrap(
    <Svg title="Militia" bg="#2a3328">
      <circle cx="24" cy="14" r="4" fill="#e6d2b0" />
      <rect x="18" y="18" width="12" height="14" rx="2" fill="#6b7a5e" />
      <circle cx="16" cy="26" r="6" fill="#8a8f7a" />
      <line x1="34" y1="10" x2="34" y2="36" stroke="#8b6914" strokeWidth="2" />
    </Svg>
  );
}

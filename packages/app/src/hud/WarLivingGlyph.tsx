import React from "react";
import type { ForceTone } from "./ForceCard";
import "./war-living.css";

export interface WarLivingGlyphProps {
  tone: ForceTone;
  riskTone?: string;
  moving?: boolean;
  loaded?: boolean;
  empty?: boolean;
}

/**
 * Ambient background living glyph underlay that sits beneath the card's text and chrome.
 * Completely pointer-events: none, subtle opacity, pulse/drift/glow animations.
 */
export function WarLivingUnderlay(props: {
  tone: ForceTone;
  riskTone?: string;
  moving?: boolean;
}) {
  const { tone, riskTone, moving } = props;
  const isDanger = riskTone === "danger" || tone === "hostile";
  const movingClass = moving ? "is-moving" : "";
  const dangerClass = isDanger ? "is-danger" : "";

  return (
    <div
      className={`sc-war-living-underlay is-${tone} ${movingClass} ${dangerClass}`}
      aria-hidden="true"
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === "hostile" && (
          <g>
            {/* Crossed broadswords */}
            <line x1="12" y1="12" x2="52" y2="52" strokeWidth="2.5" />
            <line x1="52" y1="12" x2="12" y2="52" strokeWidth="2.5" />
            {/* Crossguards */}
            <line x1="18" y1="26" x2="26" y2="18" strokeWidth="2" />
            <line x1="38" y1="46" x2="46" y2="38" strokeWidth="2" />
            {/* Clash sparks & diamond core */}
            <circle cx="32" cy="32" r="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
            <polygon points="32,24 34,30 40,32 34,34 32,40 30,34 24,32 30,30" fill="currentColor" />
          </g>
        )}
        {tone === "scout" && (
          <g>
            {/* Outrider compass & horizon eye */}
            <circle cx="32" cy="32" r="22" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="32" cy="32" r="14" strokeWidth="1.8" />
            <circle cx="32" cy="32" r="5" fill="currentColor" fillOpacity="0.35" />
            {/* 4 cardinal beacon rays */}
            <line x1="32" y1="4" x2="32" y2="12" strokeWidth="2" />
            <line x1="32" y1="52" x2="32" y2="60" strokeWidth="2" />
            <line x1="4" y1="32" x2="12" y2="32" strokeWidth="2" />
            <line x1="52" y1="32" x2="60" y2="32" strokeWidth="2" />
          </g>
        )}
        {tone === "gather" && (
          <g>
            {/* Provision cart wheel & harvest sheaf */}
            <circle cx="32" cy="32" r="20" strokeWidth="2" />
            <circle cx="32" cy="32" r="6" fill="currentColor" fillOpacity="0.4" />
            {/* Spokes */}
            <line x1="32" y1="12" x2="32" y2="52" />
            <line x1="12" y1="32" x2="52" y2="32" />
            <line x1="18" y1="18" x2="46" y2="46" />
            <line x1="18" y1="46" x2="46" y2="18" />
            {/* Grain ear aureole */}
            <path d="M22 10 Q32 4 42 10" strokeWidth="1.5" />
          </g>
        )}
        {tone === "garrison" && (
          <g>
            {/* Fortified bulwark shield & tower merlons */}
            <path
              d="M16 14 H48 V34 Q48 50 32 58 Q16 50 16 34 Z"
              strokeWidth="2"
              fill="currentColor"
              fillOpacity="0.1"
            />
            {/* Crenellations */}
            <line x1="22" y1="10" x2="22" y2="14" strokeWidth="2" />
            <line x1="32" y1="8" x2="32" y2="14" strokeWidth="2.5" />
            <line x1="42" y1="10" x2="42" y2="14" strokeWidth="2" />
            {/* Inner chevron ward */}
            <path d="M24 26 L32 34 L40 26" strokeWidth="2" />
            <line x1="32" y1="34" x2="32" y2="46" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Living war glyph rendered beneath the status rows.
 * High clarity, delicate animated heraldry with pulse, drift, and glow.
 */
export function WarLivingGlyph(props: WarLivingGlyphProps) {
  const { tone, riskTone, moving, loaded, empty } = props;
  const isDanger = riskTone === "danger" || tone === "hostile";
  const movingClass = moving ? "is-moving" : "";
  const dangerClass = isDanger ? "is-danger" : "";

  return (
    <div
      className={`sc-war-status-glyph is-${tone} ${movingClass} ${dangerClass}`}
      aria-hidden="true"
    >
      <span className="sc-war-glyph-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {tone === "hostile" && (
            <g>
              {/* Crossed blades */}
              <line x1="3" y1="3" x2="17" y2="17" />
              <line x1="17" y1="3" x2="3" y2="17" />
              {/* Guards */}
              <line x1="5" y1="8" x2="8" y2="5" />
              <line x1="12" y1="15" x2="15" y2="12" />
              {/* Central clash spark */}
              <circle cx="10" cy="10" r="1.5" fill="currentColor" className="sc-war-glyph-sparkle" />
            </g>
          )}

          {tone === "scout" && (
            <g>
              {/* Recon eye & horizon compass */}
              <circle cx="10" cy="10" r="7.5" strokeDasharray="2 2" opacity="0.6" />
              <circle cx="10" cy="10" r="3" fill="currentColor" fillOpacity="0.4" />
              {/* Cardinal pointer ticks */}
              <line x1="10" y1="1" x2="10" y2="4" strokeWidth="2" />
              <line x1="10" y1="16" x2="10" y2="19" strokeWidth="2" />
              <line x1="1" y1="10" x2="4" y2="10" strokeWidth="2" />
              <line x1="16" y1="10" x2="19" y2="10" strokeWidth="2" />
            </g>
          )}

          {tone === "gather" && (
            <g>
              {/* Harvest sheaf & cart wheel */}
              <circle cx="10" cy="10" r="6.5" strokeWidth="1.5" />
              <circle cx="10" cy="10" r="2" fill="currentColor" />
              <line x1="10" y1="3.5" x2="10" y2="16.5" />
              <line x1="3.5" y1="10" x2="16.5" y2="10" />
              {/* Top sheaf grain ears */}
              <path
                d="M7 3.5 Q10 1.5 13 3.5"
                strokeWidth="1.4"
                className={loaded ? "sc-war-glyph-sparkle" : undefined}
              />
            </g>
          )}

          {tone === "garrison" && (
            <g>
              {/* Fortress shield with crenellations */}
              <path
                d="M4.5 4.5 H15.5 V11 Q15.5 16 10 18.5 Q4.5 16 4.5 11 Z"
                strokeWidth="1.5"
                fill="currentColor"
                fillOpacity="0.15"
              />
              <line x1="7" y1="2.5" x2="7" y2="4.5" strokeWidth="1.8" />
              <line x1="10" y1="1.8" x2="10" y2="4.5" strokeWidth="2.2" />
              <line x1="13" y1="2.5" x2="13" y2="4.5" strokeWidth="1.8" />
              <path d="M7.5 8.5 L10 11 L12.5 8.5" strokeWidth="1.4" />
            </g>
          )}
        </svg>
      </span>
      <span className="sc-war-glyph-flair">
        {tone === "hostile" && (isDanger ? "Hostile march" : "Hostile")}
        {tone === "scout" && (moving ? "Vanguard sweep" : "Scout beacon")}
        {tone === "gather" && (loaded ? "Harvest laden" : empty ? "Empty haul" : "Supply party")}
        {tone === "garrison" && (isDanger ? "Ward breach alert" : "Bulwark ward")}
      </span>
    </div>
  );
}

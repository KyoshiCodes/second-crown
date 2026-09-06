import React from "react";
import { crestFor, type CrestMeta } from "./crests";

function RealmCharge(props: { realmId: string; meta: CrestMeta }) {
  const { realmId, meta: c } = props;

  switch (realmId) {
    case "player":
      // Imperial Solar Crown: triple-peaked crown with radiant sunburst and jewels
      return (
        <g id="charge-player">
          {/* Solar sunburst rays */}
          <path
            d="M32 14 V8 M23 17 L18 12 M41 17 L46 12 M15 26 L9 24 M49 26 L55 24"
            stroke={c.accent}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Base headband */}
          <rect x="20" y="44" width="24" height="5" rx="1" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          <circle cx="24" cy="46.5" r="1.1" fill={c.accent} />
          <circle cx="32" cy="46.5" r="1.3" fill="#ef4444" />
          <circle cx="40" cy="46.5" r="1.1" fill={c.accent} />
          {/* Crown peaks */}
          <path
            d="M20 44 L20 33 L25 38 L32 23 L39 38 L44 33 L44 44 Z"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Apex jewels */}
          <circle cx="32" cy="22" r="2.2" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
          <circle cx="20" cy="32" r="1.6" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
          <circle cx="44" cy="32" r="1.6" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
        </g>
      );

    case "rival":
      // Crossed Greatswords & Iron Keep
      return (
        <g id="charge-rival">
          {/* Crossed swords */}
          <path d="M18 18 L46 50" stroke={c.ink} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M43 45 L49 49" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          <circle cx="48" cy="51" r="1.4" fill={c.accent} />
          <path d="M46 18 L18 50" stroke={c.ink} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M21 45 L15 49" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="51" r="1.4" fill={c.accent} />
          {/* Fortified iron keep */}
          <path
            d="M25 30 H28 V33 H30 V30 H34 V33 H36 V30 H39 V52 H25 Z"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          {/* Arrow slit & gate */}
          <path d="M31 36 H33 V43 H31 Z M29 39 H35" stroke="#1a1008" strokeWidth="1" />
          <rect x="29.5" y="47" width="5" height="5" fill="#1a1008" />
        </g>
      );

    case "k_silk":
      // Gilded Caravel & Balance Scales
      return (
        <g id="charge-silk">
          {/* Ocean breakers */}
          <path d="M15 50 Q23 46 32 50 Q41 54 49 50" stroke={c.accent} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M18 54 Q25 51 32 54 Q39 57 46 54" stroke={c.accent} strokeWidth="1.2" fill="none" opacity="0.75" />
          {/* Hull */}
          <path d="M19 42 C23 48 41 48 45 42 L43 46 C37 49 27 49 21 46 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          {/* Masts */}
          <path d="M32 18 V42 M24 25 H40 M22 34 H42" stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          {/* Billowing sails */}
          <path d="M25 25 Q32 29 39 25 L38 31 Q32 34 26 31 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          <path d="M23 34 Q32 39 41 34 L40 41 Q32 45 24 41 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          {/* Pennant */}
          <path d="M32 18 L38 20 L32 22 Z" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
        </g>
      );

    case "k_ash":
      // Horned Steppe Skull & Recurve Bow
      return (
        <g id="charge-ash">
          {/* Composite recurve bow */}
          <path d="M16 22 Q23 27 32 24 Q41 27 48 22" stroke={c.accent} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M16 22 L32 32 L48 22" stroke="#e5e5e5" strokeWidth="0.7" strokeDasharray="1.5,1.5" />
          {/* Ram horns */}
          <path
            d="M29 32 C21 24 15 28 16 35 C17 39 21 38 21 35 C20 30 24 28 29 31"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          <path
            d="M35 32 C43 24 49 28 48 35 C47 39 43 38 43 35 C44 30 40 28 35 31"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          {/* Skull and snout */}
          <path d="M28 30 H36 L37 38 L34 47 L32 50 L30 47 L27 38 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          <ellipse cx="30" cy="37" rx="1.5" ry="2" fill="#1a1008" />
          <ellipse cx="34" cy="37" rx="1.5" ry="2" fill="#1a1008" />
          <polygon points="32,42 31,45 33,45" fill="#1a1008" />
        </g>
      );

    case "k_veil":
      // Radiant Eye of Providence & Eightfold Star
      return (
        <g id="charge-veil">
          {/* Eight radiant rays */}
          <path d="M32 16 V24 M32 48 V56 M16 36 H24 M40 36 H48" stroke={c.accent} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M21 25 L26 30 M38 42 L43 47 M43 25 L38 30 M21 47 L26 42" stroke={c.accent} strokeWidth="1.4" strokeLinecap="round" />
          {/* Sacred almond eyelid */}
          <path d="M19 36 C24 27 40 27 45 36 C40 45 24 45 19 36 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          {/* Iris and pupil */}
          <circle cx="32" cy="36" r="5" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
          <circle cx="32" cy="36" r="2.4" fill="#1a1008" />
          <circle cx="33.2" cy="34.8" r="0.8" fill="#ffffff" />
        </g>
      );

    case "k_glass":
      // Faceted Astrolabe & Prism Spire
      return (
        <g id="charge-glass">
          {/* Armillary orbit ring */}
          <ellipse cx="32" cy="36" rx="14" ry="7" fill="none" stroke={c.accent} strokeWidth="1.4" strokeDasharray="3,1.5" />
          {/* Multifaceted diamond prism */}
          <polygon points="32,18 46,36 32,54 18,36" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          {/* Internal refraction lines */}
          <path d="M32 18 L32 54 M18 36 L46 36 M25 27 L39 45 M25 45 L39 27" stroke={c.accent} strokeWidth="1" opacity="0.85" />
          <polygon points="32,28 37,36 32,44 27,36" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
          {/* Diamond corner spark points */}
          <circle cx="32" cy="18" r="1.3" fill="#ffffff" />
          <circle cx="46" cy="36" r="1.3" fill="#ffffff" />
          <circle cx="18" cy="36" r="1.3" fill="#ffffff" />
          <circle cx="32" cy="54" r="1.3" fill="#ffffff" />
        </g>
      );

    case "k_frost":
      // Twin Bearded Waraxes & Runic Stag
      return (
        <g id="charge-frost">
          {/* Crossed hafts */}
          <path d="M19 51 L45 21" stroke="#8a6138" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M45 51 L19 21" stroke="#8a6138" strokeWidth="2.2" strokeLinecap="round" />
          {/* Bearded axe blades */}
          <path d="M21 23 L15 19 C13 25 15 31 20 33 L23 29 L21 23 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          <path d="M43 23 L49 19 C51 25 49 31 44 33 L41 29 L43 23 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          {/* Central runic snowflake / stag antlers */}
          <path d="M32 27 V43 M24 35 H40 M26 29 L38 41 M38 29 L26 41" stroke={c.accent} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M32 27 L30 24 M32 27 L34 24 M32 43 L30 46 M32 43 L34 46" stroke={c.accent} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );

    case "k_tide":
      // Abyssal Trident & Breaker Waves
      return (
        <g id="charge-tide">
          {/* Ocean breakers */}
          <path d="M16 50 Q24 45 32 50 Q40 55 48 50" stroke={c.accent} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M18 55 Q25 51 32 55 Q39 59 46 55" stroke={c.accent} strokeWidth="1.2" fill="none" opacity="0.8" />
          {/* Coiling leviathan tentacle */}
          <path
            d="M24 40 C22 36 25 33 28 35 C31 37 33 39 37 38 C40 37 42 34 40 31"
            stroke={c.accent}
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Barbed sea trident */}
          <path d="M32 17 V49" stroke={c.ink} strokeWidth="2" strokeLinecap="round" />
          <polygon points="32,16 35,24 29,24" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          <path d="M32 28 C26 28 24 24 25 19 L27 22 C26 24 28 26 32 27" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          <path d="M32 28 C38 28 40 24 39 19 L37 22 C38 24 36 26 32 27" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
        </g>
      );

    case "k_ember":
      // Rising Fire-Phoenix & Arcane Flame
      return (
        <g id="charge-ember">
          {/* Brazier base */}
          <polygon points="26,48 38,48 36,53 28,53" fill={c.accent} stroke="#1a1008" strokeWidth="1" />
          {/* Flame core */}
          <path d="M32 36 C35 41 35 46 32 49 C29 46 29 41 32 36 Z" fill={c.accent} stroke="#1a1008" strokeWidth="0.8" />
          {/* Phoenix head */}
          <path d="M32 22 C33 20 35 22 34 24 L32 27 L30 24 C29 22 31 20 32 22 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1" />
          <path d="M32 20 V16" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" />
          {/* Wings */}
          <path
            d="M30 26 C22 22 17 28 15 34 C19 33 23 35 27 38 C21 39 18 43 19 47 C23 43 27 43 29 41"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          <path
            d="M34 26 C42 22 47 28 49 34 C45 33 41 35 37 38 C43 39 46 43 45 47 C41 43 37 43 35 41"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          {/* Orbiting sparks */}
          <circle cx="21" cy="20" r="1.2" fill={c.accent} />
          <circle cx="43" cy="20" r="1.2" fill={c.accent} />
        </g>
      );

    case "k_bronze":
      // Corinthian Hoplite Helm & Laurel Wreath
      return (
        <g id="charge-bronze">
          {/* Laurel wreath branches */}
          <path d="M19 44 C18 36 20 28 24 23" stroke={c.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <circle cx="18" cy="38" r="1.2" fill={c.accent} />
          <circle cx="20" cy="30" r="1.2" fill={c.accent} />
          <circle cx="23" cy="24" r="1.2" fill={c.accent} />
          <path d="M45 44 C46 36 44 28 40 23" stroke={c.accent} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <circle cx="46" cy="38" r="1.2" fill={c.accent} />
          <circle cx="44" cy="30" r="1.2" fill={c.accent} />
          <circle cx="41" cy="24" r="1.2" fill={c.accent} />
          {/* Helmet crest plume */}
          <path d="M23 23 C27 17 37 17 41 23 L39 25 C35 20 29 20 25 25 Z" fill={c.accent} stroke="#1a1008" strokeWidth="1" />
          {/* Helmet dome & cheekguards */}
          <path
            d="M25 31 C25 22 39 22 39 31 L39 44 C39 48 37 49 35 49 L34 45 L32 47 L30 45 L29 49 C27 49 25 48 25 44 Z"
            fill={c.ink}
            stroke="#1a1008"
            strokeWidth="1.2"
          />
          {/* Eye apertures and nose guard */}
          <polygon points="27,35 30,37 28,37" fill="#1a1008" />
          <polygon points="37,35 34,37 36,37" fill="#1a1008" />
          <rect x="31" y="34" width="2" height="8" fill="#1a1008" />
        </g>
      );

    default:
      // Fallback: heraldic chevron & star
      return (
        <g id="charge-fallback">
          <path d="M20 38 L32 26 L44 38 L40 42 L32 34 L24 42 Z" fill={c.ink} stroke="#1a1008" strokeWidth="1.2" />
          <circle cx="32" cy="22" r="2.5" fill={c.accent} />
        </g>
      );
  }
}

export function Crest(props: { realmId: string; size?: number; showTitle?: boolean }) {
  const c = crestFor(props.realmId);
  const size = props.size ?? 28;
  const gradientId = `rim-${props.realmId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const fieldGradId = `field-${props.realmId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <span
      title={`${c.label}: ${c.chargeName} — ${c.chargeDesc}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        marginRight: 6,
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size * 1.125} viewBox="0 0 64 72" aria-hidden="true">
        <defs>
          {/* Rim metallic gradient */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c.rim.from} />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor={c.rim.to} />
          </linearGradient>
          {/* Field gradient with physical heater shield curvature */}
          <linearGradient id={fieldGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.color} />
            <stop offset="100%" stopColor={c.fieldAccent} />
          </linearGradient>
        </defs>

        {/* Outer shield body with metallic rim */}
        <path
          d="M32 4 L56 12 V34 C56 52 44 64 32 70 C20 64 8 52 8 34 V12 Z"
          fill={`url(#${gradientId})`}
          stroke="#100b06"
          strokeWidth="1.6"
        />

        {/* Inner field surface */}
        <path
          d="M32 8 L52 14 V34 C52 49 42 59 32 64 C22 59 12 49 12 34 V14 Z"
          fill={`url(#${fieldGradId})`}
          stroke="#181109"
          strokeWidth="1"
        />

        {/* Distinctive heraldic charge */}
        <RealmCharge realmId={props.realmId} meta={c} />
      </svg>
    </span>
  );
}


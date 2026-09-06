import React from "react";
import type { HolidayId } from "./holidays";
import type { SeasonName } from "../music";

/** Full-viewport holiday stage only. Everyday seasons keep tab CSS. */
export function ThemeStage(props: { season: SeasonName; holiday: HolidayId }) {
  const { holiday } = props;
  if (holiday === "none") return null;
  return (
    <div className="sc-theme-stage" aria-hidden="true">
      {holiday === "halloween" ? <HalloweenScene /> : null}
      {holiday === "midwinter" ? <MidwinterScene /> : null}
      {holiday === "easter" ? <EasterScene /> : null}
      {holiday === "harvest" ? <HarvestScene /> : null}
      {holiday === "midsummer" ? <MidsummerScene /> : null}
    </div>
  );
}

function HalloweenScene() {
  return (
    <svg className="sc-theme-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="h-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#180924" />
          <stop offset="55%" stopColor="#291030" />
          <stop offset="100%" stopColor="#100608" />
        </linearGradient>
        <radialGradient id="h-moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#ea580c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#180924" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Sky & Giant Harvest Moon */}
      <rect width="1200" height="700" fill="url(#h-sky)" />
      <circle cx="980" cy="110" r="120" fill="url(#h-moon-glow)" />
      <circle cx="980" cy="110" r="68" fill="#fef3c7" opacity="0.9" />
      <circle cx="1008" cy="94" r="54" fill="#180924" />

      {/* Spooky Rolling Knolls and Gnarled Trees */}
      <path d="M0 520 L80 480 L140 530 L220 470 L300 540 L420 460 L520 530 L640 450 L760 540 L880 470 L980 530 L1100 460 L1200 520 L1200 700 L0 700 Z" fill="#12080e" />
      {/* Gnarled twisted bare tree silhouettes */}
      <path d="M80 700 L110 420 L95 380 L110 420 L135 370 L110 420 L160 700 Z" fill="#0b0708" stroke="#0b0708" strokeWidth="2" />
      <path d="M980 700 L1020 380 L1000 340 L1020 380 L1045 330 L1020 380 L1070 700 Z" fill="#0b0708" stroke="#0b0708" strokeWidth="2" />

      {/* Haunted Keep Silhouette with Glowing Gothic Windows */}
      <rect x="500" y="420" width="95" height="120" fill="#180d12" />
      <polygon points="490,420 547,355 605,420" fill="#241018" />
      <rect x="535" y="475" width="24" height="65" fill="#38180c" />
      {/* Glowing Amber Windows with flicker */}
      <circle cx="547" cy="405" r="7" fill="#fef08a" opacity="0.85" />
      <rect x="515" y="440" width="8" height="14" rx="3" fill="#fef08a" opacity="0.8" />
      <rect x="572" y="440" width="8" height="14" rx="3" fill="#fef08a" opacity="0.8" />

      {/* Rolling Low Mist across the Graveyard Knolls */}
      <ellipse cx="600" cy="560" rx="420" ry="30" fill="#3b1f4a" opacity="0.22" />
      <ellipse cx="300" cy="580" rx="260" ry="25" fill="#2d1538" opacity="0.2" />

      {/* Carved Jack-o'-Lantern 1 with Flickering Witchfire Eyes */}
      <ellipse cx="220" cy="565" rx="38" ry="28" fill="#e85d04" />
      <polygon points="220,525 230,550 210,550" fill="#2f6f1e" />
      <polygon points="208,552 216,562 204,562" fill="#fef08a" />
      <polygon points="232,552 236,562 224,562" fill="#fef08a" />
      <polygon points="210,572 230,572 220,580" fill="#fef08a" />

      {/* Carved Jack-o'-Lantern 2 */}
      <ellipse cx="820" cy="585" rx="32" ry="24" fill="#fb923c" />
      <polygon points="820,552 828,572 812,572" fill="#3f7a1a" />
      <circle cx="812" cy="578" r="2.5" fill="#fef08a" />
      <circle cx="828" cy="578" r="2.5" fill="#fef08a" />
      <rect x="815" y="588" width="10" height="3" fill="#fef08a" rx="1" />

      {/* Ancient Starlight */}
      <circle cx="200" cy="180" r="3" fill="#fde68a" opacity="0.75" />
      <circle cx="340" cy="120" r="2" fill="#fde68a" opacity="0.85" />
      <circle cx="700" cy="80" r="2.5" fill="#fde68a" opacity="0.9" />
      <circle cx="840" cy="190" r="2" fill="#fde68a" opacity="0.7" />
    </svg>
  );
}

function MidwinterScene() {
  return (
    <svg className="sc-theme-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <rect width="1200" height="700" fill="#0b1c2c" />
      <circle cx="180" cy="90" r="50" fill="#e0f2fe" />
      <path d="M0 560 L200 500 L400 580 L600 490 L800 570 L1000 500 L1200 560 L1200 700 L0 700 Z" fill="#e8f4ff" />
      <polygon points="260,560 310,380 360,560" fill="#14532d" />
      <polygon points="280,480 310,360 340,480" fill="#166534" />
      <polygon points="900,570 960,360 1020,570" fill="#14532d" />
      <rect x="560" y="420" width="80" height="120" fill="#7f1d1d" />
      <polygon points="550,420 600,360 650,420" fill="#991b1b" />
      <circle cx="400" cy="160" r="2" fill="#fff" />
      <circle cx="640" cy="80" r="2" fill="#fff" />
      <circle cx="880" cy="140" r="2" fill="#fff" />
    </svg>
  );
}

function EasterScene() {
  return (
    <svg className="sc-theme-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <rect width="1200" height="700" fill="#2a1838" />
      <rect y="420" width="1200" height="280" fill="#14532d" />
      <circle cx="980" cy="120" r="80" fill="#fde68a" opacity="0.7" />
      <ellipse cx="200" cy="520" rx="28" ry="36" fill="#f9a8d4" />
      <ellipse cx="280" cy="530" rx="24" ry="32" fill="#c4b5fd" />
      <ellipse cx="900" cy="540" rx="30" ry="38" fill="#fde047" />
    </svg>
  );
}

function HarvestScene() {
  return (
    <svg className="sc-theme-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <rect width="1200" height="700" fill="#3b1c0a" />
      <circle cx="1000" cy="140" r="90" fill="#f59e0b" />
      <rect y="480" width="1200" height="220" fill="#854d0e" />
      <rect x="80" y="500" width="18" height="80" fill="#ca8a04" />
      <rect x="110" y="490" width="18" height="90" fill="#eab308" />
      <rect x="140" y="510" width="18" height="70" fill="#ca8a04" />
    </svg>
  );
}

function MidsummerScene() {
  return (
    <svg className="sc-theme-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
      <rect width="1200" height="700" fill="#1e3a5f" />
      <circle cx="600" cy="520" r="160" fill="#fb923c" opacity="0.55" />
      <circle cx="600" cy="520" r="90" fill="#facc15" />
      <rect y="560" width="1200" height="140" fill="#14532d" />
    </svg>
  );
}

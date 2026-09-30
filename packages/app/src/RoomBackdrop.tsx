import React from "react";

export type RoomKind = "hall" | "wall" | "yard";

export interface RoomBackdropProps {
  room: RoomKind;
  className?: string;
}

/**
 * Distinct 2D room backdrops for the keep interior:
 * - Hall: Throne dais (elevated stone platform steps, royal velvet throne, golden lion finials, banners, torch sconces)
 * - Wall: Wall walk (crenellated ashlar battlements, merlons & arrow slits, timber walkway, braziers, open sky)
 * - Yard: Muddy yard (churned muddy earth with wagon ruts, puddles, bailey fencing, training quintain, barrels)
 *
 * GUARANTEE: strictly `pointer-events: none` on all art layers so plot cells, facts, and buttons remain 100% interactive!
 */
export function RoomBackdrop({ room, className = "" }: RoomBackdropProps) {
  return (
    <div
      className={`sc-keepin-backdrop-wrap is-${room} ${className}`}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      {room === "hall" && <ThroneDaisBackdrop />}
      {room === "wall" && <WallWalkBackdrop />}
      {room === "yard" && <MuddyYardBackdrop />}
    </div>
  );
}

/**
 * 1. Throne Dais (Hall):
 * Elevated stone dais platform steps, royal monarch throne with gold finials & velvet cushion,
 * Romanesque stone archways, flanking torch sconces, and hanging crimson/blue heraldic banners.
 */
export function ThroneDaisBackdrop() {
  return (
    <>
      <span className="sc-keepin-backdrop-badge">Throne Dais</span>
      <svg
        className="sc-keepin-backdrop-art sc-keepin-backdrop-throne-dais"
        viewBox="0 0 800 130"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/* Hall wall stone pattern */}
          <linearGradient id="hallWallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#18110a" />
            <stop offset="40%" stopColor="#2c1d11" />
            <stop offset="100%" stopColor="#1a110a" />
          </linearGradient>

          {/* Torch warm radial light */}
          <radialGradient id="torchGlowLeft" cx="80" cy="50" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#f97316" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="torchGlowRight" cx="720" cy="50" r="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#f97316" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Dais stone step gradient */}
          <linearGradient id="daisStepGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#543d2b" />
            <stop offset="50%" stopColor="#3d2b1e" />
            <stop offset="100%" stopColor="#251a12" />
          </linearGradient>

          {/* Velvet canopy gradient */}
          <linearGradient id="canopyVelvet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="60%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Gold gilding gradient */}
          <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ca8a04" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        {/* 1. Base Wall & Torch Ambient Light */}
        <rect x="0" y="0" width="800" height="130" fill="url(#hallWallGrad)" />
        <rect x="0" y="0" width="800" height="130" fill="url(#torchGlowLeft)" />
        <rect x="0" y="0" width="800" height="130" fill="url(#torchGlowRight)" />

        {/* Rear Wall Ashlar Stone Courses */}
        <g stroke="#3f2b1d" strokeWidth="0.8" opacity="0.45">
          <line x1="0" y1="26" x2="800" y2="26" />
          <line x1="0" y1="52" x2="800" y2="52" />
          <line x1="0" y1="78" x2="800" y2="78" />
          <line x1="0" y1="104" x2="800" y2="104" />
          {/* Vertical joints */}
          <line x1="120" y1="0" x2="120" y2="26" />
          <line x1="240" y1="26" x2="240" y2="52" />
          <line x1="180" y1="52" x2="180" y2="78" />
          <line x1="620" y1="26" x2="620" y2="52" />
          <line x1="680" y1="52" x2="680" y2="78" />
        </g>

        {/* 2. Central Romanesque High Alcove Behind Throne */}
        <path
          d="M 310 130 L 310 40 Q 400 6 490 40 L 490 130 Z"
          fill="#160e07"
          stroke="#4a3522"
          strokeWidth="1.5"
        />
        <path
          d="M 324 130 L 324 44 Q 400 14 476 44 L 476 130 Z"
          fill="#1a1109"
          stroke="#2f2014"
          strokeWidth="1"
        />

        {/* Dual High Clerestory Windows with Amber Light */}
        <path d="M 200 48 L 200 20 Q 212 12 224 20 L 224 48 Z" fill="#b45309" stroke="#543007" strokeWidth="1" opacity="0.85" />
        <path d="M 204 46 L 204 22 Q 212 15 220 22 L 220 46 Z" fill="#fbbf24" opacity="0.65" />
        <line x1="212" y1="16" x2="212" y2="48" stroke="#451a03" strokeWidth="0.8" />
        <line x1="200" y1="32" x2="224" y2="32" stroke="#451a03" strokeWidth="0.8" />

        <path d="M 576 48 L 576 20 Q 588 12 600 20 L 600 48 Z" fill="#b45309" stroke="#543007" strokeWidth="1" opacity="0.85" />
        <path d="M 580 46 L 580 22 Q 588 15 596 22 L 596 46 Z" fill="#fbbf24" opacity="0.65" />
        <line x1="588" y1="16" x2="588" y2="48" stroke="#451a03" strokeWidth="0.8" />
        <line x1="576" y1="32" x2="600" y2="32" stroke="#451a03" strokeWidth="0.8" />

        {/* 3. Massive Stone Columns Flanking Hall */}
        {/* Left Pillar */}
        <rect x="64" y="0" width="34" height="130" fill="#382717" stroke="#543b24" strokeWidth="1.2" />
        <rect x="60" y="0" width="42" height="12" fill="#4d3722" stroke="#6b4c2e" strokeWidth="1" />
        <rect x="60" y="118" width="42" height="12" fill="#4d3722" stroke="#6b4c2e" strokeWidth="1" />
        {/* Right Pillar */}
        <rect x="702" y="0" width="34" height="130" fill="#382717" stroke="#543b24" strokeWidth="1.2" />
        <rect x="698" y="0" width="42" height="12" fill="#4d3722" stroke="#6b4c2e" strokeWidth="1" />
        <rect x="698" y="118" width="42" height="12" fill="#4d3722" stroke="#6b4c2e" strokeWidth="1" />

        {/* Wrought Iron Torch Sconces & Flames */}
        {/* Left Torch */}
        <rect x="78" y="44" width="6" height="24" fill="#18181b" />
        <path d="M 74 44 L 88 44 L 84 52 L 78 52 Z" fill="#27272a" />
        <circle cx="81" cy="40" r="9" fill="#f59e0b" opacity="0.4" />
        <path d="M 77 44 Q 81 28 85 44 Z" fill="#ea580c" />
        <path d="M 79 43 Q 81 33 83 43 Z" fill="#fef08a" />

        {/* Right Torch */}
        <rect x="716" y="44" width="6" height="24" fill="#18181b" />
        <path d="M 712 44 L 726 44 L 722 52 L 716 52 Z" fill="#27272a" />
        <circle cx="719" cy="40" r="9" fill="#f59e0b" opacity="0.4" />
        <path d="M 715 44 Q 719 28 723 44 Z" fill="#ea580c" />
        <path d="M 717 43 Q 719 33 721 43 Z" fill="#fef08a" />

        {/* 4. Hanging Heraldic Wall Banners */}
        {/* Left Crimson Banner with Crown Crest */}
        <rect x="146" y="16" width="38" height="66" fill="#991b1b" stroke="#ca8a04" strokeWidth="1" />
        <polygon points="146,82 165,74 184,82" fill="#7f1d1d" stroke="#ca8a04" strokeWidth="0.8" />
        {/* Gold fringe & hanging bar */}
        <line x1="142" y1="16" x2="188" y2="16" stroke="#ca8a04" strokeWidth="2.5" />
        <circle cx="142" cy="16" r="2.5" fill="#fde047" />
        <circle cx="188" cy="16" r="2.5" fill="#fde047" />
        {/* Crown emblem */}
        <path d="M 157 44 L 160 38 L 165 42 L 170 38 L 173 44 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.5" />
        <rect x="157" y="44" width="16" height="4" fill="#f59e0b" />

        {/* Right Navy Banner with Heraldic Lion / Shield */}
        <rect x="616" y="16" width="38" height="66" fill="#1e3a8a" stroke="#ca8a04" strokeWidth="1" />
        <polygon points="616,82 635,74 654,82" fill="#172554" stroke="#ca8a04" strokeWidth="0.8" />
        <line x1="612" y1="16" x2="658" y2="16" stroke="#ca8a04" strokeWidth="2.5" />
        <circle cx="612" cy="16" r="2.5" fill="#fde047" />
        <circle cx="658" cy="16" r="2.5" fill="#fde047" />
        {/* Rampant shield emblem */}
        <path d="M 627 36 L 643 36 L 643 45 Q 635 52 627 45 Z" fill="#fde047" stroke="#b45309" strokeWidth="0.6" />
        <polygon points="635,38 637,42 633,42" fill="#b91c1c" />

        {/* 5. Overhead Dais Canopy (Baldachin) */}
        <path
          d="M 330 0 L 330 18 Q 365 24 400 18 Q 435 24 470 18 L 470 0 Z"
          fill="url(#canopyVelvet)"
          stroke="#ca8a04"
          strokeWidth="1.2"
        />
        {/* Gold fringe on canopy hem */}
        <path
          d="M 330 18 Q 347 24 365 21 Q 382 24 400 21 Q 418 24 435 21 Q 452 24 470 18"
          stroke="#fde047"
          strokeWidth="1.5"
          fill="none"
        />

        {/* 6. Three-Tiered Stone Dais Platform */}
        {/* Tier 1 (Lowest Platform) */}
        <rect x="230" y="112" width="340" height="18" fill="url(#daisStepGrad)" stroke="#6b4c2e" strokeWidth="1" />
        <line x1="230" y1="112" x2="570" y2="112" stroke="url(#goldTrim)" strokeWidth="1.6" />

        {/* Tier 2 (Middle Platform) */}
        <rect x="275" y="98" width="250" height="15" fill="url(#daisStepGrad)" stroke="#6b4c2e" strokeWidth="1" />
        <line x1="275" y1="98" x2="525" y2="98" stroke="url(#goldTrim)" strokeWidth="1.4" />

        {/* Tier 3 (Top Dais Platform) */}
        <rect x="320" y="82" width="160" height="17" fill="url(#daisStepGrad)" stroke="#6b4c2e" strokeWidth="1" />
        <line x1="320" y1="82" x2="480" y2="82" stroke="url(#goldTrim)" strokeWidth="1.5" />

        {/* Velvet Crimson Runner Carpet */}
        <rect x="366" y="82" width="68" height="48" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.8" />
        <line x1="366" y1="82" x2="366" y2="130" stroke="#fde047" strokeWidth="1" />
        <line x1="434" y1="82" x2="434" y2="130" stroke="#fde047" strokeWidth="1" />

        {/* 7. The Royal Monarch Throne (Grand Carved High-Backed Seat) */}
        {/* Throne Shadow */}
        <ellipse cx="400" cy="85" rx="36" ry="6" fill="#000000" opacity="0.65" />

        {/* Timber Throne Frame */}
        <rect x="374" y="24" width="52" height="60" rx="2" fill="#543007" stroke="#271406" strokeWidth="1.2" />

        {/* High Arched Throne Backrest */}
        <path d="M 374 40 Q 400 16 426 40 Z" fill="#78350f" stroke="#ca8a04" strokeWidth="1" />

        {/* Ornate Gold Crown Crest Finials atop Throne */}
        <polygon points="376,24 380,14 384,22 388,10 392,20 400,6 408,20 412,10 416,22 420,14 424,24" fill="url(#goldTrim)" stroke="#78350f" strokeWidth="0.6" />
        <circle cx="400" cy="5" r="2.5" fill="#fde047" />

        {/* Royal Crimson Velvet Tufted Backrest */}
        <rect x="380" y="32" width="40" height="34" rx="2" fill="#b91c1c" stroke="#991b1b" strokeWidth="0.8" />
        {/* Diamond tufting lines & buttons */}
        <line x1="384" y1="36" x2="416" y2="62" stroke="#7f1d1d" strokeWidth="0.6" />
        <line x1="416" y1="36" x2="384" y2="62" stroke="#7f1d1d" strokeWidth="0.6" />
        <circle cx="400" cy="49" r="1.2" fill="#fde047" />
        <circle cx="392" cy="42" r="1.0" fill="#fde047" />
        <circle cx="408" cy="42" r="1.0" fill="#fde047" />

        {/* Thick Velvet Seat Cushion */}
        <rect x="372" y="66" width="56" height="11" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
        <rect x="373" y="74" width="54" height="2" fill="#fde047" />

        {/* Golden Lion Armrests */}
        <rect x="368" y="52" width="6" height="18" fill="#ca8a04" stroke="#78350f" strokeWidth="0.7" />
        <circle cx="371" cy="52" r="3.2" fill="#fde047" stroke="#854d0e" strokeWidth="0.6" />
        <rect x="426" y="52" width="6" height="18" fill="#ca8a04" stroke="#78350f" strokeWidth="0.7" />
        <circle cx="429" cy="52" r="3.2" fill="#fde047" stroke="#854d0e" strokeWidth="0.6" />

        {/* Carved Lion Claw Legs */}
        <rect x="373" y="77" width="5" height="8" fill="#78350f" />
        <ellipse cx="375" cy="84" rx="3.5" ry="2" fill="#ca8a04" />
        <rect x="422" y="77" width="5" height="8" fill="#78350f" />
        <ellipse cx="425" cy="84" rx="3.5" ry="2" fill="#ca8a04" />

        {/* 8. Flagstone Floor Foreground Details */}
        <line x1="0" y1="129" x2="800" y2="129" stroke="#543d2b" strokeWidth="1" />
      </svg>
    </>
  );
}

/**
 * 2. Wall Walk (Wall):
 * Stone battlements with merlons and embrasures, arrow slits, weathered timber sentry duckboards,
 * glowing iron tripod braziers with rising smoke, leaning sentry shield and halberds, overlooking a twilight horizon.
 */
export function WallWalkBackdrop() {
  return (
    <>
      <span className="sc-keepin-backdrop-badge">Wall Walk</span>
      <svg
        className="sc-keepin-backdrop-art sc-keepin-backdrop-wall-walk"
        viewBox="0 0 800 130"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/* Twilight sky gradient */}
          <linearGradient id="twilightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#090d16" />
            <stop offset="40%" stopColor="#1e293b" />
            <stop offset="80%" stopColor="#334155" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Wall ashlar stone gradient */}
          <linearGradient id="wallStone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Timber duckboard walkway */}
          <linearGradient id="walkwayTimber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#543007" />
            <stop offset="40%" stopColor="#3f220c" />
            <stop offset="100%" stopColor="#1c0e04" />
          </linearGradient>

          {/* Brazier flame radial glow */}
          <radialGradient id="brazierGlowLeft" cx="130" cy="74" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="brazierGlowRight" cx="670" cy="74" r="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Dramatic Open Twilight Sky */}
        <rect x="0" y="0" width="800" height="75" fill="url(#twilightSky)" />

        {/* Distant Mountain Horizon & Distant Fortress Silhouette */}
        <polygon points="0,52 60,40 140,49 220,38 310,48 420,36 520,46 640,39 740,48 800,42 800,75 0,75" fill="#0f172a" opacity="0.65" />
        <polygon points="0,60 80,53 180,59 290,52 380,58 480,50 600,56 710,51 800,57 800,75 0,75" fill="#1e293b" opacity="0.85" />
        {/* Distant Watchtower */}
        <rect x="440" y="32" width="12" height="24" fill="#0f172a" />
        <polygon points="438,32 446,22 454,32" fill="#090d16" />

        {/* Brazier Ambient Light Glows */}
        <rect x="0" y="0" width="800" height="130" fill="url(#brazierGlowLeft)" />
        <rect x="0" y="0" width="800" height="130" fill="url(#brazierGlowRight)" />

        {/* 2. Heavy Stone Curtain Wall Battlements (Crenels and Merlons) */}
        {/* Low Curtain Wall Ledge */}
        <rect x="0" y="46" width="800" height="42" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />

        {/* Heavy Stone Merlons (Upright Battlement Teeth) */}
        {/* Merlon 1 (x: 10 - 90) */}
        <rect x="10" y="16" width="80" height="46" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="8" y="14" width="84" height="6" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        {/* Arrow slit */}
        <rect x="47" y="24" width="6" height="22" rx="1" fill="#090d16" />
        <line x1="42" y1="32" x2="58" y2="32" stroke="#090d16" strokeWidth="3" />

        {/* Merlon 2 (x: 170 - 250) */}
        <rect x="170" y="16" width="80" height="46" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="168" y="14" width="84" height="6" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <rect x="207" y="24" width="6" height="22" rx="1" fill="#090d16" />
        <line x1="202" y1="32" x2="218" y2="32" stroke="#090d16" strokeWidth="3" />

        {/* Merlon 3 (x: 330 - 410) */}
        <rect x="330" y="16" width="80" height="46" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="328" y="14" width="84" height="6" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <rect x="367" y="24" width="6" height="22" rx="1" fill="#090d16" />
        <line x1="362" y1="32" x2="378" y2="32" stroke="#090d16" strokeWidth="3" />

        {/* Merlon 4 (x: 490 - 570) */}
        <rect x="490" y="16" width="80" height="46" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="488" y="14" width="84" height="6" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <rect x="527" y="24" width="6" height="22" rx="1" fill="#090d16" />
        <line x1="522" y1="32" x2="538" y2="32" stroke="#090d16" strokeWidth="3" />

        {/* Merlon 5 (x: 650 - 730) */}
        <rect x="650" y="16" width="80" height="46" fill="url(#wallStone)" stroke="#1e293b" strokeWidth="1.2" />
        <rect x="648" y="14" width="84" height="6" fill="#64748b" stroke="#334155" strokeWidth="0.8" />
        <rect x="687" y="24" width="6" height="22" rx="1" fill="#090d16" />
        <line x1="682" y1="32" x2="698" y2="32" stroke="#090d16" strokeWidth="3" />

        {/* Stone Course Lines on Wall */}
        <g stroke="#1e293b" strokeWidth="0.8" opacity="0.6">
          <line x1="0" y1="62" x2="800" y2="62" />
          <line x1="0" y1="76" x2="800" y2="76" />
          <line x1="130" y1="62" x2="130" y2="76" />
          <line x1="290" y1="62" x2="290" y2="76" />
          <line x1="450" y1="62" x2="450" y2="76" />
          <line x1="610" y1="62" x2="610" y2="76" />
        </g>

        {/* 3. The Sentry Wall Walk Platform (Chemin de Ronde Timber Walkway) */}
        <rect x="0" y="86" width="800" height="44" fill="url(#walkwayTimber)" stroke="#3f220c" strokeWidth="1" />
        {/* Timber plank lines */}
        <g stroke="#1c0e04" strokeWidth="0.8">
          <line x1="0" y1="94" x2="800" y2="94" />
          <line x1="0" y1="104" x2="800" y2="104" />
          <line x1="0" y1="116" x2="800" y2="116" />
          {/* Iron studs along planks */}
          <line x1="70" y1="86" x2="70" y2="130" stroke="#291406" strokeWidth="1" />
          <line x1="190" y1="86" x2="190" y2="130" stroke="#291406" strokeWidth="1" />
          <line x1="310" y1="86" x2="310" y2="130" stroke="#291406" strokeWidth="1" />
          <line x1="430" y1="86" x2="430" y2="130" stroke="#291406" strokeWidth="1" />
          <line x1="550" y1="86" x2="550" y2="130" stroke="#291406" strokeWidth="1" />
          <line x1="670" y1="86" x2="670" y2="130" stroke="#291406" strokeWidth="1" />
        </g>
        {/* Inboard timber balustrade rail */}
        <line x1="0" y1="86" x2="800" y2="86" stroke="#854d0e" strokeWidth="2.5" />

        {/* 4. Iron Watch Braziers with Burning Charcoal */}
        {/* Left Brazier */}
        <g transform="translate(116, 56)">
          <path d="M 0 20 L 28 20 L 24 34 L 4 34 Z" fill="#27272a" stroke="#09090b" strokeWidth="1" />
          {/* Tripod legs */}
          <line x1="5" y1="34" x2="0" y2="52" stroke="#18181b" strokeWidth="2" />
          <line x1="14" y1="34" x2="14" y2="52" stroke="#18181b" strokeWidth="2" />
          <line x1="23" y1="34" x2="28" y2="52" stroke="#18181b" strokeWidth="2" />
          {/* Burning coals & flame */}
          <ellipse cx="14" cy="20" rx="12" ry="4" fill="#991b1b" />
          <path d="M 4 20 Q 14 0 24 20 Z" fill="#ea580c" />
          <path d="M 8 20 Q 14 6 20 20 Z" fill="#fbbf24" />
          {/* Embers */}
          <circle cx="12" cy="6" r="1.2" fill="#fde047" />
          <circle cx="18" cy="10" r="0.9" fill="#f97316" />
        </g>

        {/* Right Brazier */}
        <g transform="translate(656, 56)">
          <path d="M 0 20 L 28 20 L 24 34 L 4 34 Z" fill="#27272a" stroke="#09090b" strokeWidth="1" />
          <line x1="5" y1="34" x2="0" y2="52" stroke="#18181b" strokeWidth="2" />
          <line x1="14" y1="34" x2="14" y2="52" stroke="#18181b" strokeWidth="2" />
          <line x1="23" y1="34" x2="28" y2="52" stroke="#18181b" strokeWidth="2" />
          <ellipse cx="14" cy="20" rx="12" ry="4" fill="#991b1b" />
          <path d="M 4 20 Q 14 0 24 20 Z" fill="#ea580c" />
          <path d="M 8 20 Q 14 6 20 20 Z" fill="#fbbf24" />
          <circle cx="10" cy="8" r="1.2" fill="#fde047" />
          <circle cx="16" cy="4" r="0.9" fill="#f97316" />
        </g>

        {/* 5. Sentry Shield & Crossed Halberds / Spears */}
        {/* Leaning Kite Shield */}
        <g transform="translate(262, 54)">
          <path d="M 0 0 L 22 0 L 22 18 Q 11 36 0 42 Z" fill="#b91c1c" stroke="#d4a359" strokeWidth="1.2" />
          <path d="M 11 0 L 22 0 L 22 18 Q 11 36 11 42 Z" fill="#991b1b" />
          {/* Brass shield boss & iron rim */}
          <circle cx="11" cy="14" r="4" fill="#fbbf24" stroke="#78350f" strokeWidth="0.8" />
        </g>

        {/* Crossed Sentry Spears */}
        <g stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round">
          <line x1="290" y1="42" x2="318" y2="98" stroke="#451a03" strokeWidth="2" />
          <polygon points="287,44 290,34 293,44" fill="#cbd5e1" stroke="#334155" strokeWidth="0.6" />
          <line x1="318" y1="42" x2="290" y2="98" stroke="#451a03" strokeWidth="2" />
          <polygon points="315,44 318,34 321,44" fill="#cbd5e1" stroke="#334155" strokeWidth="0.6" />
        </g>

        {/* Coiled Rope & Mangonel Stone Balls */}
        <g transform="translate(590, 92)">
          <circle cx="12" cy="18" r="6" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="23" cy="18" r="6" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="17" cy="10" r="5.5" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" />
          {/* Coiled hemp rope */}
          <ellipse cx="44" cy="16" rx="14" ry="7" fill="#78350f" stroke="#ca8a04" strokeWidth="1.4" />
          <ellipse cx="44" cy="16" rx="7" ry="3.5" fill="#3f220c" />
        </g>
      </svg>
    </>
  );
}

/**
 * 3. Muddy Yard (Yard):
 * Churned muddy earth with deep wagon wheel ruts, standing rainwater puddles with sky reflections,
 * wooden palisade fencing, stacked timber barrels & crates, training quintain dummy, and straw bedding.
 */
export function MuddyYardBackdrop() {
  return (
    <>
      <span className="sc-keepin-backdrop-badge">Muddy Yard</span>
      <svg
        className="sc-keepin-backdrop-art sc-keepin-backdrop-muddy-yard"
        viewBox="0 0 800 130"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          {/* Overcast bailey sky */}
          <linearGradient id="yardSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e1e24" />
            <stop offset="50%" stopColor="#2e2b26" />
            <stop offset="100%" stopColor="#3d372e" />
          </linearGradient>

          {/* Muddy churned soil gradient */}
          <linearGradient id="mudEarth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#452b18" />
            <stop offset="35%" stopColor="#331e10" />
            <stop offset="70%" stopColor="#24140a" />
            <stop offset="100%" stopColor="#140a04" />
          </linearGradient>

          {/* Puddle sky reflection gradient */}
          <linearGradient id="puddleReflect" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="60%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Barrel wood gradient */}
          <linearGradient id="barrelWood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#543007" />
            <stop offset="50%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#3f220c" />
          </linearGradient>
        </defs>

        {/* 1. Overcast Sky & Distant Castle Keep Silhouette */}
        <rect x="0" y="0" width="800" height="42" fill="url(#yardSky)" />
        {/* Castle Keep wall & turrets in misty background */}
        <polygon points="40,36 40,16 60,16 60,36 120,36 120,8 150,8 150,36 260,36 340,18 420,36 680,36 710,12 740,12 740,36 800,36 800,42 0,42" fill="#181512" opacity="0.75" />

        {/* 2. Weathered Timber Palisade Fence & Outbuildings */}
        <g stroke="#1c0e04" strokeWidth="1">
          {/* Palisade logs */}
          {Array.from({ length: 34 }).map((_, i) => {
            const x = i * 24 + 4;
            const h = 26 + ((i * 7) % 8);
            const y = 36 - h;
            return (
              <polygon
                key={i}
                points={`${x},36 ${x},${y + 4} ${x + 5},${y} ${x + 10},${y + 4} ${x + 10},36`}
                fill={i % 2 === 0 ? "#451a03" : "#3f220c"}
              />
            );
          })}
          {/* Cross rails */}
          <line x1="0" y1="18" x2="800" y2="18" stroke="#543007" strokeWidth="2.5" />
          <line x1="0" y1="30" x2="800" y2="30" stroke="#271406" strokeWidth="2" />
        </g>

        {/* Thatched Lean-to Shed Roof (Left) */}
        <polygon points="0,6 110,18 100,36 0,36" fill="#713f12" stroke="#451a03" strokeWidth="1" />
        <line x1="95" y1="18" x2="95" y2="48" stroke="#3f220c" strokeWidth="3" />

        {/* 3. The Churned Muddy Earth Ground */}
        <rect x="0" y="36" width="800" height="94" fill="url(#mudEarth)" />

        {/* Deep Curving Wagon Wheel Ruts Cut into the Mud */}
        <g stroke="#0f0702" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" fill="none">
          <path d="M 0 56 Q 160 52 320 66 Q 480 80 800 62" />
          <path d="M 0 68 Q 160 64 320 78 Q 480 92 800 74" />
          <path d="M 40 86 Q 220 98 440 92 Q 620 86 800 102" strokeWidth="4" />
          <path d="M 40 100 Q 220 112 440 106 Q 620 100 800 116" strokeWidth="4" />
        </g>
        {/* Rut wet sheen highlights */}
        <g stroke="#5c3818" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" fill="none">
          <path d="M 2 55 Q 160 51 320 65 Q 480 79 798 61" />
          <path d="M 42 85 Q 220 97 440 91 Q 620 85 798 101" />
        </g>

        {/* Trampled Golden Straw / Thatch Bedding */}
        <g stroke="#ca8a04" strokeWidth="1.2" opacity="0.75">
          {/* Clustered straw stems in the mud */}
          <line x1="50" y1="46" x2="65" y2="49" />
          <line x1="54" y1="48" x2="68" y2="45" />
          <line x1="160" y1="82" x2="175" y2="84" />
          <line x1="164" y1="85" x2="178" y2="80" />
          <line x1="380" y1="52" x2="396" y2="55" />
          <line x1="385" y1="56" x2="399" y2="51" />
          <line x1="540" y1="78" x2="555" y2="81" />
          <line x1="544" y1="82" x2="558" y2="76" />
          <line x1="720" y1="94" x2="736" y2="97" />
          <line x1="724" y1="98" x2="738" y2="92" />
        </g>

        {/* 4. Large Reflective Rainwater Mud Puddles */}
        {/* Center-Left Puddle */}
        <ellipse cx="230" cy="82" rx="58" ry="14" fill="#140a04" />
        <ellipse cx="230" cy="81" rx="54" ry="12" fill="url(#puddleReflect)" />
        {/* Ripple rings */}
        <ellipse cx="225" cy="80" rx="36" ry="6" fill="none" stroke="#64748b" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="225" cy="80" rx="18" ry="3" fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />

        {/* Center-Right Puddle */}
        <ellipse cx="510" cy="95" rx="72" ry="16" fill="#140a04" />
        <ellipse cx="510" cy="94" rx="68" ry="14" fill="url(#puddleReflect)" />
        <ellipse cx="505" cy="93" rx="44" ry="7" fill="none" stroke="#64748b" strokeWidth="0.8" opacity="0.5" />
        <ellipse cx="505" cy="93" rx="22" ry="3.5" fill="none" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />

        {/* Small Forefront Puddle */}
        <ellipse cx="710" cy="115" rx="38" ry="8" fill="#140a04" />
        <ellipse cx="710" cy="114" rx="34" ry="7" fill="url(#puddleReflect)" />

        {/* 5. Courtyard Props & Training Equipment */}
        {/* Stacked Hooped Barrels & Timber Crate (Left) */}
        <g transform="translate(70, 48)">
          {/* Crate */}
          <rect x="0" y="24" width="28" height="24" fill="#92400e" stroke="#451a03" strokeWidth="1" />
          <line x1="0" y1="36" x2="28" y2="36" stroke="#451a03" strokeWidth="0.8" />
          <line x1="2" y1="26" x2="26" y2="46" stroke="#78350f" strokeWidth="0.8" />
          <line x1="26" y1="26" x2="2" y2="46" stroke="#78350f" strokeWidth="0.8" />
          {/* Lower Barrel */}
          <rect x="32" y="22" width="22" height="28" rx="3" fill="url(#barrelWood)" stroke="#271406" strokeWidth="1" />
          <line x1="32" y1="28" x2="54" y2="28" stroke="#27272a" strokeWidth="1.5" />
          <line x1="32" y1="44" x2="54" y2="44" stroke="#27272a" strokeWidth="1.5" />
          {/* Upper Stacked Barrel */}
          <rect x="18" y="4" width="20" height="24" rx="3" fill="url(#barrelWood)" stroke="#271406" strokeWidth="1" />
          <line x1="18" y1="10" x2="38" y2="10" stroke="#27272a" strokeWidth="1.3" />
          <line x1="18" y1="22" x2="38" y2="22" stroke="#27272a" strokeWidth="1.3" />
        </g>

        {/* Soldier Training Quintain Dummy (Center-Right) */}
        <g transform="translate(360, 40)">
          {/* Ground shadow */}
          <ellipse cx="20" cy="58" rx="14" ry="4" fill="#000000" opacity="0.6" />
          {/* Upright timber post */}
          <rect x="18" y="14" width="5" height="44" fill="#78350f" stroke="#3f220c" strokeWidth="0.8" />
          {/* Pivot iron pin */}
          <circle cx="20.5" cy="14" r="2.5" fill="#27272a" />
          {/* Horizontal rotating arm */}
          <rect x="0" y="12" width="42" height="4" fill="#92400e" stroke="#451a03" strokeWidth="0.6" />
          {/* Wooden practice shield on left arm */}
          <circle cx="5" cy="14" r="8" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <circle cx="5" cy="14" r="4" fill="#b91c1c" />
          {/* Sandbag counterweight on right arm */}
          <ellipse cx="37" cy="18" rx="4.5" ry="6" fill="#a16207" stroke="#78350f" strokeWidth="0.8" />
          <line x1="37" y1="14" x2="37" y2="18" stroke="#ca8a04" strokeWidth="1" />
        </g>

        {/* Straw Archery Target Butt (Far Right) */}
        <g transform="translate(630, 46)">
          <ellipse cx="20" cy="52" rx="16" ry="4" fill="#000000" opacity="0.5" />
          {/* Tripod legs */}
          <line x1="12" y1="26" x2="6" y2="52" stroke="#543007" strokeWidth="2" />
          <line x1="28" y1="26" x2="34" y2="52" stroke="#543007" strokeWidth="2" />
          <line x1="20" y1="20" x2="20" y2="52" stroke="#3f220c" strokeWidth="2" />
          {/* Round coiled straw target */}
          <circle cx="20" cy="24" r="16" fill="#ca8a04" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="20" cy="24" r="11" fill="#dc2626" />
          <circle cx="20" cy="24" r="6" fill="#ffffff" />
          <circle cx="20" cy="24" r="2.5" fill="#eab308" />
          {/* Stuck practice arrows */}
          <line x1="22" y1="23" x2="32" y2="17" stroke="#cbd5e1" strokeWidth="1.2" />
          <polygon points="32,17 34,15 35,18" fill="#ef4444" />
          <line x1="18" y1="26" x2="10" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
          <polygon points="10,34 8,36 11,37" fill="#ef4444" />
        </g>

        {/* Blacksmith Anvil on Wooden Stump (Far Left) */}
        <g transform="translate(18, 70)">
          {/* Tree stump base */}
          <rect x="6" y="24" width="18" height="20" fill="#543007" stroke="#271406" strokeWidth="1" />
          {/* Iron Anvil */}
          <path d="M 2 16 L 24 16 L 28 20 L 22 24 L 6 24 L 2 20 Z" fill="#334155" stroke="#0f172a" strokeWidth="0.8" />
          <rect x="8" y="20" width="12" height="6" fill="#1e293b" />
          {/* Horn */}
          <path d="M 24 16 Q 30 17 28 20 Z" fill="#475569" />
        </g>
      </svg>
    </>
  );
}

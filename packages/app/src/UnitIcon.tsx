import React from "react";
import { getCulture } from "@second-crown/sim";

export const CultureContext = React.createContext<string>("western");

export interface UnitIconProps {
  typeId: string;
  size?: number;
  frame?: 0 | 1 | 2;
  facing?: 1 | -1;
  animated?: boolean;
  style?: React.CSSProperties;
  className?: string;
  culture?: string;
}

const DEFAULT_SIZE = 48;

/**
 * Hook for 2-3 frame idle/march cadence (0 -> 1 -> 0 -> 2).
 */
function useUnitCadence(enabled: boolean): 0 | 1 | 2 {
  const [frame, setFrame] = React.useState<0 | 1 | 2>(0);
  React.useEffect(() => {
    if (!enabled) return;
    let step = 0;
    const interval = window.setInterval(() => {
      step = (step + 1) % 4;
      const f = step === 1 ? 1 : step === 3 ? 2 : 0;
      setFrame(f as 0 | 1 | 2);
    }, 240);
    return () => window.clearInterval(interval);
  }, [enabled]);
  return frame;
}

/**
 * Pixel silhouette unit icon in the same language as hold walkers and buildings.
 * Integer pixel alignments, authentic 2-3 frame idle/march strides, facing,
 * tabard colors, and type-specific weapons/gear.
 * Supports player culture tints (Crown Marches, Cedar Kin, Sand Banner, Wind Host, Tide Clans).
 */
export function UnitIcon(props: UnitIconProps) {
  const {
    typeId,
    size = DEFAULT_SIZE,
    facing = 1,
    animated = true,
    style,
    className,
    culture,
  } = props;

  const contextCulture = React.useContext(CultureContext);
  const activeCultureId = culture || contextCulture || "western";
  const cultureDef = getCulture(activeCultureId);
  const isDefaultCulture = cultureDef.id === "western";
  const cultPal = cultureDef.palette;

  const autoFrame = useUnitCadence(animated && props.frame === undefined);
  const frame = props.frame !== undefined ? props.frame : autoFrame;

  // Animation offsets
  const bob = frame === 0 ? 0 : 1;
  const legL = frame === 1 ? -2 : frame === 2 ? 1 : -1;
  const legR = frame === 1 ? 1 : frame === 2 ? -2 : 1;
  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;

  const renderContent = () => {
    switch (typeId) {
      case "archer": {
        // Forest green archer coat, feathered cap, recurve longbow, quiver
        return (
          <g>
            {/* Ground contact shadow */}
            <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Leather boots / leggings */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#27272a" />
            <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#18181b" />

            {/* Deep forest coat / tabard */}
            <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill={isDefaultCulture ? "#14532d" : cultPal.tabard} />
            {/* Leather belt */}
            <rect x="15" y={22 - bob} width="6.5" height="1.6" fill={isDefaultCulture ? "#78350f" : cultPal.timber} />

            {/* Head & face */}
            <circle cx="18" cy={14 - bob} r="3" fill="#fbcfe8" />

            {/* Archer cap with yellow feather quill */}
            <rect x="14.5" y={11 - bob} width="7" height="3" fill={isDefaultCulture ? "#15803d" : cultPal.tabard} />
            <polygon
              points={`${18 - facing * 1.5},${11 - bob} ${18 - facing * 5},${6 - bob} ${18 - facing * 1.5},${9 - bob}`}
              fill="#facc15"
            />

            {/* Back quiver of arrows */}
            <rect x={18 - facing * 4.5} y={15 - bob} width="3" height="8" fill={isDefaultCulture ? "#78350f" : cultPal.timber} />
            <line
              x1={18 - facing * 3.5}
              y1={15 - bob}
              x2={18 - facing * 3.5}
              y2={11 - bob}
              stroke="#f8fafc"
              strokeWidth="1.5"
            />

            {/* Recurve yew bow */}
            <path
              d={`M${18 + facing * 4.5} ${8 - bob + armSwing} Q${18 + facing * 8} ${19 - bob + armSwing} ${18 + facing * 4.5} ${30 - bob + armSwing}`}
              stroke={isDefaultCulture ? "#854d0e" : cultPal.timber}
              strokeWidth="1.8"
              fill="none"
            />
            {/* Taut bowstring */}
            <line
              x1={18 + facing * 4.5}
              y1={8 - bob + armSwing}
              x2={18 + facing * 4.5}
              y2={30 - bob + armSwing}
              stroke="#e2e8f0"
              strokeWidth="0.8"
            />
            {/* Nocked arrow */}
            <line
              x1={18 - facing * 1}
              y1={19 - bob + armSwing}
              x2={18 + facing * 7.5}
              y2={19 - bob + armSwing}
              stroke="#f8fafc"
              strokeWidth="1.1"
            />
          </g>
        );
      }

      case "spearman": {
        // Steel kettle hat, royal blue tabard, tall ash spear with steel tip, round shield
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="30" rx="7.5" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Soldier boots */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#27272a" />
            <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#18181b" />

            {/* Royal blue tabard over chainmail */}
            <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill={isDefaultCulture ? "#1e40af" : cultPal.tabard} />
            <rect x="15" y={22 - bob} width="6.5" height="1.6" fill={isDefaultCulture ? "#3b82f6" : cultPal.tabard} />

            {/* Head & face */}
            <circle cx="18" cy={14 - bob} r="3" fill="#fbcfe8" />

            {/* Steel kettle hat */}
            <rect x="13.5" y={12 - bob} width="9.5" height="2" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />
            <circle cx="18" cy={11 - bob} r="2.6" fill={isDefaultCulture ? "#cbd5e1" : cultPal.stone} />

            {/* Tall steel spear / pike */}
            <line
              x1={18 + facing * 5}
              y1={30 - bob}
              x2={18 + facing * 5}
              y2={4 - bob + armSwing}
              stroke={isDefaultCulture ? "#78350f" : cultPal.timber}
              strokeWidth="1.5"
            />
            <polygon
              points={`${18 + facing * 5},${3 - bob + armSwing} ${18 + facing * 5 - 2},${7 - bob + armSwing} ${18 + facing * 5 + 2},${7 - bob + armSwing}`}
              fill="#f1f5f9"
            />

            {/* Round wooden shield with brass boss on off-arm */}
            <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="4" fill={isDefaultCulture ? "#1e3a8a" : cultPal.tabard} stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="1.5" fill="#facc15" />
          </g>
        );
      }

      case "skirmisher": {
        // Scout green tunic, leather cap, throwing javelins, buckler
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Boots */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#451a03" />
            <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#27272a" />

            {/* Scout green tunic */}
            <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill={isDefaultCulture ? "#15803d" : cultPal.tabard} />
            <line x1="15" y1={18 - bob} x2="21.5" y2={26 - bob} stroke={isDefaultCulture ? "#78350f" : cultPal.timber} strokeWidth="1" />

            {/* Head & face */}
            <circle cx="18" cy={14 - bob} r="3" fill="#fbcfe8" />

            {/* Leather cap with feather */}
            <rect x="15" y={11 - bob} width="6.5" height="3" fill={isDefaultCulture ? "#5c3818" : cultPal.timber} />
            <polygon
              points={`${18 - facing * 1.5},${11 - bob} ${18 - facing * 4.5},${7 - bob} ${18 - facing * 1.5},${9.5 - bob}`}
              fill="#fde047"
            />

            {/* Throwing javelin */}
            <line
              x1={18 - facing * 3}
              y1={24 - bob + armSwing}
              x2={18 + facing * 9}
              y2={11 - bob + armSwing}
              stroke={isDefaultCulture ? "#78350f" : cultPal.timber}
              strokeWidth="1.4"
            />
            <polygon
              points={`${18 + facing * 9},${11 - bob + armSwing} ${18 + facing * 10.5},${14 - bob + armSwing} ${18 + facing * 7},${13 - bob + armSwing}`}
              fill="#cbd5e1"
            />

            {/* Arm buckler */}
            <circle cx={18 - facing * 3.5} y={21 - bob} r="3" fill={isDefaultCulture ? "#854d0e" : cultPal.timber} stroke={isDefaultCulture ? "#5c3818" : cultPal.timber} strokeWidth="0.8" />
          </g>
        );
      }

      case "cavalry": {
        // Warhorse with animated legs + mounted rider with lance
        const hLeg1 = frame === 1 ? 1 : frame === 2 ? -1 : 0;
        const hLeg2 = frame === 1 ? -1 : frame === 2 ? 1 : 0;
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />

            {/* Horse legs */}
            <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#451a03" />
            <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#6b3a19" />

            {/* Horse body */}
            <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#6b3a19" />

            {/* Horse neck & head */}
            <polygon
              points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`}
              fill="#6b3a19"
            />
            {/* Mane & ears */}
            <rect x={18 + facing * 9} y={10 - bob} width="2.5" height="3" fill="#18181b" />

            {/* Leather saddle */}
            <rect x="15" y={18 - bob} width="6" height="3" fill={isDefaultCulture ? "#451a03" : cultPal.timber} />

            {/* Mounted rider */}
            <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill={isDefaultCulture ? "#1d4ed8" : cultPal.tabard} />
            <circle cx="18" cy={9 - bob} r="3" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />

            {/* Cavalry lance with pennant */}
            <line
              x1={18 - facing * 5}
              y1={16 - bob}
              x2={18 + facing * 15}
              y2={7 - bob}
              stroke={isDefaultCulture ? "#854d0e" : cultPal.timber}
              strokeWidth="1.5"
            />
            <polygon
              points={`${18 + facing * 11},${8 - bob} ${18 + facing * 16},${6 - bob} ${18 + facing * 11},${11 - bob}`}
              fill={isDefaultCulture ? "#22c55e" : cultPal.tabard}
            />
          </g>
        );
      }

      case "knight": {
        // Steel great helm with eye-slits, heraldic heater shield with cross, broadsword, red cape
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Steel greaves */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />
            <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill={isDefaultCulture ? "#64748b" : cultPal.stone} />

            {/* Full steel plate cuirass */}
            <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill={isDefaultCulture ? "#cbd5e1" : cultPal.stone} />
            {/* Gold trim & belt */}
            <rect x="13.5" y={17 - bob} width="9" height="2" fill="#eab308" />

            {/* Great helm */}
            <rect x="14.5" y={10 - bob} width="7" height="7" rx="1" fill={isDefaultCulture ? "#cbd5e1" : cultPal.stone} />
            {/* Visor eye-slit */}
            <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.2" fill="#0f172a" />
            {/* Crimson helm plume */}
            <polygon points={`18,${10 - bob} 19.5,${6 - bob} 17,${7 - bob}`} fill={isDefaultCulture ? "#dc2626" : cultPal.tabard} />

            {/* Heraldic heater shield with golden cross */}
            <polygon
              points={`${18 - facing * 2},${17 - bob + armSwing} ${18 - facing * 8},${17 - bob + armSwing} ${18 - facing * 8},${25 - bob + armSwing} ${18 - facing * 5},${30 - bob + armSwing} ${18 - facing * 2},${25 - bob + armSwing}`}
              fill={isDefaultCulture ? "#b91c1c" : cultPal.tabard}
              stroke="#eab308"
              strokeWidth="0.8"
            />
            <line
              x1={18 - facing * 5}
              y1={17 - bob + armSwing}
              x2={18 - facing * 5}
              y2={30 - bob + armSwing}
              stroke="#facc15"
              strokeWidth="1.2"
            />
            <line
              x1={18 - facing * 8}
              y1={21 - bob + armSwing}
              x2={18 - facing * 2}
              y2={21 - bob + armSwing}
              stroke="#facc15"
              strokeWidth="1.2"
            />

            {/* Steel broadsword */}
            <line
              x1={18 + facing * 5}
              y1={26 - bob + armSwing}
              x2={18 + facing * 5}
              y2={10 - bob + armSwing}
              stroke="#f8fafc"
              strokeWidth="1.8"
            />
            <line
              x1={18 + facing * 2.5}
              y1={23 - bob + armSwing}
              x2={18 + facing * 7.5}
              y2={23 - bob + armSwing}
              stroke="#eab308"
              strokeWidth="1.5"
            />
          </g>
        );
      }

      case "siege": {
        // Timber carriage on spoked wheels, upright A-frame, throwing beam with boulder
        const armTilt = frame === 1 ? -2 : frame === 2 ? 2 : 0;
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />

            {/* Spoked wheels */}
            <circle cx="8" cy={27 - bob} r="4.5" fill="#451a03" stroke="#27272a" strokeWidth="1" />
            <circle cx="28" cy={27 - bob} r="4.5" fill="#451a03" stroke="#27272a" strokeWidth="1" />
            <circle cx="8" cy={27 - bob} r="1" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />
            <circle cx="28" cy={27 - bob} r="1" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />

            {/* Heavy timber chassis */}
            <rect x="5" y={21 - bob} width="26" height="5.5" fill={isDefaultCulture ? "#5c3818" : cultPal.timber} stroke="#27272a" strokeWidth="0.8" />

            {/* Upright A-frame trestle */}
            <polygon
              points={`11,${21 - bob} 18,${7 - bob} 25,${21 - bob}`}
              stroke={isDefaultCulture ? "#78350f" : cultPal.timber}
              strokeWidth="2.2"
              fill="none"
            />

            {/* Throwing arm beam with counterweight bucket & stone */}
            <line
              x1={18 - facing * 12}
              y1={19 - bob - armTilt}
              x2={18 + facing * 12}
              y2={3 - bob + armTilt}
              stroke={isDefaultCulture ? "#451a03" : cultPal.timber}
              strokeWidth="2.6"
            />
            {/* Iron counterweight box */}
            <rect x={18 - facing * 14} y={16 - bob - armTilt} width="5" height="5" fill="#27272a" />
            {/* Granite projectile stone */}
            <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill={isDefaultCulture ? "#94a3b8" : cultPal.stone} />
          </g>
        );
      }

      case "champion": {
        // Gilded plate, winged royal crown, imperial purple tabard, glowing runic greatsword, royal cape
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Gilded greaves */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#d97706" />
            <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#b45309" />

            {/* Royal Tyrian purple velvet tabard */}
            <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill={isDefaultCulture ? "#581c87" : cultPal.tabard} />
            {/* Gilded cuirass & lion trim */}
            <rect x="14.5" y={17 - bob} width="7" height="3" fill="#f59e0b" />

            {/* Royal winged helm / crown */}
            <rect x="15" y={10 - bob} width="6" height="6" rx="1" fill="#f59e0b" />
            <polygon
              points={`13.5,${10 - bob} 15.5,${5 - bob} 18,${8 - bob} 20.5,${5 - bob} 22.5,${10 - bob}`}
              fill="#fde047"
              stroke="#d97706"
              strokeWidth="0.5"
            />

            {/* Radiant runic greatsword with light glow */}
            <line
              x1={18 + facing * 5}
              y1={27 - bob + armSwing}
              x2={18 + facing * 5}
              y2={3 - bob + armSwing}
              stroke="#38bdf8"
              strokeWidth="2.4"
            />
            <line
              x1={18 + facing * 5}
              y1={27 - bob + armSwing}
              x2={18 + facing * 5}
              y2={3 - bob + armSwing}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            {/* Golden crossguard */}
            <line
              x1={18 + facing * 2}
              y1={23 - bob + armSwing}
              x2={18 + facing * 8}
              y2={23 - bob + armSwing}
              stroke="#fde047"
              strokeWidth="1.6"
            />

            {/* Flowing royal cape */}
            <polygon
              points={`${18 - facing * 3},${17 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 1.5},${27 - bob}`}
              fill={isDefaultCulture ? "#dc2626" : cultPal.tabard}
              opacity="0.9"
            />
          </g>
        );
      }

      case "militia":
      default: {
        // Spear-less peasant levy, coarse wool tunic, cloth coif, unarmed/club posture
        return (
          <g>
            {/* Contact shadow */}
            <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />

            {/* Rough shoes */}
            <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#3f3f46" />
            <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#27272a" />

            {/* Coarse homespun tunic */}
            <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill={isDefaultCulture ? "#854d0e" : cultPal.tabard} />
            {/* Rope belt */}
            <rect x="15" y={22 - bob} width="6.5" height="1.6" fill={isDefaultCulture ? "#a16207" : cultPal.timber} />

            {/* Head & face */}
            <circle cx="18" cy={14 - bob} r="3" fill="#fbcfe8" />

            {/* Peasant coif / cloth hood */}
            <rect x="14.5" y={11 - bob} width="7" height="3" fill={isDefaultCulture ? "#52525b" : cultPal.stone} />

            {/* Spear-less levy! Simple wooden club / tool held at side */}
            <rect
              x={18 + facing * 4}
              y={19 - bob + armSwing}
              width="2"
              height="6"
              rx="0.5"
              fill={isDefaultCulture ? "#78350f" : cultPal.timber}
            />
          </g>
        );
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{
        display: "inline-block",
        overflow: "visible",
        shapeRendering: "crispEdges",
        verticalAlign: "middle",
        ...style,
      }}
      className={className}
      aria-label={typeId}
      role="img"
    >
      {renderContent()}
    </svg>
  );
}


import React from "react";
import { getCulture } from "@second-crown/sim";
import { resolveCultureKit, type CultureKit } from "@second-crown/render";

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
 * Supports player culture tints and distinct silhouettes (Crown Marches, Cedar Kin, Sand Banner, Wind Host, Tide Clans).
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
  const kit: CultureKit = resolveCultureKit(activeCultureId);
  const cultureDef = getCulture(activeCultureId);
  const isDefaultCulture = kit === "western";
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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Woodland hunter archer: hooded cedar cowl, fur mantle, forest tunic, curved cedar flatbow, birch quiver
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#24170b" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill="#2d4a22" />
                  <rect x="15" y={22 - bob} width="6.5" height="1.6" fill="#5c3818" />
                  <polygon points={`14,${17 - bob} 22,${17 - bob} 23,${21 - bob} 18,${22 - bob} 13,${21 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14,${14 - bob} 18,${7 - bob} 22,${14 - bob} ${18 - facing * 3},${17 - bob}`} fill="#1e3318" />
                  <polygon points={`${18 - facing * 1.5},${10 - bob} ${18 - facing * 5},${5 - bob} ${18 - facing * 1.5},${8 - bob}`} fill="#e2c8a2" />
                  <rect x={18 - facing * 4.5} y={15 - bob} width="3" height="8" fill="#78350f" />
                  <line x1={18 - facing * 3.5} y1={15 - bob} x2={18 - facing * 3.5} y2={10 - bob} stroke="#cbd5e1" strokeWidth="1.5" />
                  <path d={`M${18 + facing * 4.5} ${8 - bob + armSwing} Q${18 + facing * 8.5} ${19 - bob + armSwing} ${18 + facing * 4.5} ${30 - bob + armSwing}`} stroke="#5c3818" strokeWidth="2" fill="none" />
                  <line x1={18 + facing * 4.5} y1={8 - bob + armSwing} x2={18 + facing * 4.5} y2={30 - bob + armSwing} stroke="#f1f5f9" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 7.5} y2={19 - bob + armSwing} stroke="#cbd5e1" strokeWidth="1.2" />
                </g>
              );
            }
            case "sand": {
              // Desert bowman: wrapped turban with fluttering havelock veil, white linen robe with crimson sash, composite bow
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#a16207" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x="15" y={18 - bob} width="6.5" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14.5" y={22 - bob} width="7.5" height="1.8" fill="#b91c1c" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3.5" rx="1.5" fill="#fde68a" />
                  <path d={`M${18 - facing * 3} ${12 - bob} Q${18 - facing * 6} ${16 - bob} ${18 - facing * 4.5} ${22 - bob}`} stroke="#fef3c7" strokeWidth="2.2" fill="none" />
                  <rect x={18 - facing * 4.5} y={16 - bob} width="3" height="7.5" rx="0.5" fill="#78350f" />
                  <line x1={18 - facing * 3.5} y1={16 - bob} x2={18 - facing * 3.5} y2={11 - bob} stroke="#dc2626" strokeWidth="1.5" />
                  <path d={`M${18 + facing * 4} ${8 - bob + armSwing} Q${18 + facing * 9} ${14 - bob + armSwing} ${18 + facing * 6.5} ${19 - bob + armSwing} Q${18 + facing * 9} ${24 - bob + armSwing} ${18 + facing * 4} ${30 - bob + armSwing}`} stroke="#b45309" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4} y1={8 - bob + armSwing} x2={18 + facing * 4} y2={30 - bob + armSwing} stroke="#fef08a" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 8} y2={19 - bob + armSwing} stroke="#f1f5f9" strokeWidth="1.1" />
                </g>
              );
            }
            case "steppe": {
              // Nomad horse archer: conical spangenhelm with horsehair plume, double-breasted deel coat, reflex bow
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.6" height="4" fill="#1e1b18" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.6" height="4" fill="#3f3f46" />
                  <rect x="14.5" y={17.5 - bob} width="7.5" height="9" rx="1.5" fill="#334155" />
                  <polygon points={`15,${17.5 - bob} 18,${21.5 - bob} 15,${26.5 - bob}`} fill="#1e293b" />
                  <rect x="14" y={22 - bob} width="8.5" height="1.8" fill="#eab308" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`14,${13 - bob} 18,${7 - bob} 22,${13 - bob}`} fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
                  <rect x="13.5" y={12.5 - bob} width="9" height="1.5" fill="#ca8a04" />
                  <path d={`M18,${7 - bob} Q${18 - facing * 3},${4 - bob} ${18 - facing * 5},${8 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  <rect x={18 - facing * 4.5} y={15 - bob} width="3.2" height="8" rx="0.5" fill="#6b3a19" />
                  <line x1={18 - facing * 3.5} y1={15 - bob} x2={18 - facing * 3.5} y2={10 - bob} stroke="#f8fafc" strokeWidth="1.5" />
                  <path d={`M${18 + facing * 4} ${8 - bob + armSwing} Q${18 + facing * 8.5} ${13 - bob + armSwing} ${18 + facing * 6} ${19 - bob + armSwing} Q${18 + facing * 8.5} ${25 - bob + armSwing} ${18 + facing * 4} ${30 - bob + armSwing}`} stroke="#78350f" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4} y1={8 - bob + armSwing} x2={18 + facing * 4} y2={30 - bob + armSwing} stroke="#e2e8f0" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 8} y2={19 - bob + armSwing} stroke="#f1f5f9" strokeWidth="1.1" />
                </g>
              );
            }
            case "islands": {
              // Island marine archer: reed headband with shell band, teal sailcloth vest, long bamboo bow, bone-tipped arrows
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.4" height="4" fill="#78350f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.4" height="4" fill="#a16207" />
                  <rect x="15" y={18 - bob} width="6.5" height="5" fill="#0f766e" />
                  <polygon points={`14.5,${22 - bob} 21.5,${22 - bob} 22,${27 - bob} 14,${27 - bob}`} fill="#f4f4f5" stroke="#d4d4d4" strokeWidth="0.5" />
                  <rect x="14.5" y={22 - bob} width="7.5" height="1.4" fill="#854d0e" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <rect x="14" y={11 - bob} width="8" height="2.5" rx="0.8" fill="#d97706" />
                  <line x1="14" y1={12.5 - bob} x2="22" y2={12.5 - bob} stroke="#fef08a" strokeWidth="0.8" />
                  <rect x={18 - facing * 4} y={15 - bob} width="2.8" height="8" rx="0.5" fill="#854d0e" />
                  <line x1={18 - facing * 3} y1={15 - bob} x2={18 - facing * 3} y2={10 - bob} stroke="#f8fafc" strokeWidth="1.3" />
                  <path d={`M${18 + facing * 4} ${6 - bob + armSwing} Q${18 + facing * 9} ${18 - bob + armSwing} ${18 + facing * 4} ${31 - bob + armSwing}`} stroke="#ca8a04" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4} y1={6 - bob + armSwing} x2={18 + facing * 4} y2={31 - bob + armSwing} stroke="#38bdf8" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={18 - bob + armSwing} x2={18 + facing * 8} y2={18 - bob + armSwing} stroke="#f8fafc" strokeWidth="1.2" />
                </g>
              );
            }
          }
        }
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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Woodland hunter spearman: leaf-blade spear, hooded cowl, fur mantle, round cedar shield
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7.5" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#24170b" />
                  <rect x="14.5" y={18 - bob} width="7" height="8" rx="1" fill="#2d4a22" />
                  <rect x="14.5" y={22 - bob} width="7" height="1.6" fill={cultPal.timber} />
                  <polygon points={`14,${17 - bob} 22,${17 - bob} 23,${21 - bob} 18,${22 - bob} 13,${21 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14,${14 - bob} 18,${8 - bob} 22,${14 - bob} ${18 - facing * 2.5},${17 - bob}`} fill="#1e3318" />
                  <circle cx="18" cy={8 - bob} r="1" fill="#36220f" />
                  <line x1={18 + facing * 5} y1={30 - bob} x2={18 + facing * 5} y2={4 - bob + armSwing} stroke="#5c3818" strokeWidth="1.5" />
                  <polygon points={`${18 + facing * 5},${2 - bob + armSwing} ${18 + facing * 5 - 2.8},${6 - bob + armSwing} ${18 + facing * 5},${9 - bob + armSwing} ${18 + facing * 5 + 2.8},${6 - bob + armSwing}`} fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="4.2" fill="#78350f" stroke="#36220f" strokeWidth="1" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="2.2" fill="#2d4a22" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="1" fill="#cbd5e1" />
                </g>
              );
            }
            case "sand": {
              // Desert spearman: fluttering turban havelock, crimson sash, slender pennon lance, brass sun buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7.5" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#a16207" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x="14.5" y={18 - bob} width="7" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14" y={22 - bob} width="8" height="2" fill="#b91c1c" />
                  <line x1={18 - facing * 2} y1={23 - bob} x2={18 - facing * 4.5} y2={28 - bob} stroke="#b91c1c" strokeWidth="1.5" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3.5" rx="1.5" fill="#fde68a" />
                  <path d={`M${18 - facing * 3} ${12 - bob} Q${18 - facing * 6} ${16 - bob} ${18 - facing * 4} ${22 - bob}`} stroke="#fef3c7" strokeWidth="2.2" fill="none" />
                  <line x1={18 + facing * 5} y1={30 - bob} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#78350f" strokeWidth="1.3" />
                  <polygon points={`${18 + facing * 5},${1 - bob + armSwing} ${18 + facing * 5 - 1.5},${6 - bob + armSwing} ${18 + facing * 5 + 1.5},${6 - bob + armSwing}`} fill="#f1f5f9" />
                  <polygon points={`${18 + facing * 5},${5 - bob + armSwing} ${18 + facing * 9},${7 - bob + armSwing} ${18 + facing * 5},${9 - bob + armSwing}`} fill="#dc2626" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="3.8" fill="#d97706" stroke="#facc15" strokeWidth="1" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="1.5" fill="#fef08a" />
                </g>
              );
            }
            case "steppe": {
              // Steppe nomad spearman: conical spangenhelm with horsehair crest, double-breasted caftan, horsehair lance, studded buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7.5" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.7" height="4" fill="#1e1b18" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.7" height="4" fill="#3f3f46" />
                  <rect x="14" y={17 - bob} width="8" height="9.5" rx="1.5" fill="#475569" />
                  <polygon points={`15,${17 - bob} 18,${21 - bob} 15,${26 - bob}`} fill="#334155" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#eab308" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`14,${13 - bob} 18,${8 - bob} 22,${13 - bob}`} fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
                  <rect x="13.5" y={12.5 - bob} width="9" height="1.5" fill="#64748b" />
                  <path d={`M18,${8 - bob} Q${18 - facing * 3},${5 - bob} ${18 - facing * 5},${9 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  <line x1={18 + facing * 5} y1={30 - bob} x2={18 + facing * 5} y2={4 - bob + armSwing} stroke="#6b3a19" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 5},${2 - bob + armSwing} ${18 + facing * 5 - 1.8},${7 - bob + armSwing} ${18 + facing * 5 + 1.8},${7 - bob + armSwing}`} fill="#f1f5f9" />
                  <rect x={18 + facing * 5 - 2} y={7 - bob + armSwing} width="4" height="2.5" rx="0.5" fill="#18181b" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="3.8" fill="#78350f" stroke="#a16207" strokeWidth="1.2" />
                  <circle cx={18 - facing * 3} y={20 - bob + armSwing} r="1.3" fill="#d97706" />
                </g>
              );
            }
            case "islands": {
              // Island spearman: woven reed cap with shell band, sailcloth/kilt, barbed fishing trident, reef buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7.5" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.4" height="4" fill="#78350f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.4" height="4" fill="#a16207" />
                  <rect x="14.5" y={17.5 - bob} width="7" height="5" fill="#0f766e" />
                  <polygon points={`14,${22 - bob} 22,${22 - bob} 22.5,${27 - bob} 13.5,${27 - bob}`} fill="#d4d4d4" stroke="#a3a3a3" strokeWidth="0.5" />
                  <rect x="14" y={22 - bob} width="8" height="1.4" fill="#854d0e" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <path d={`M14,${13 - bob} Q18,${9 - bob} 22,${13 - bob} Z`} fill="#d97706" />
                  <line x1="13.5" y1={13 - bob} x2="22.5" y2={13 - bob} stroke="#fef08a" strokeWidth="1.2" />
                  <line x1={18 + facing * 5} y1={30 - bob} x2={18 + facing * 5} y2={6 - bob + armSwing} stroke="#78350f" strokeWidth="1.5" />
                  <line x1={18 + facing * 5 - 3} y1={7 - bob + armSwing} x2={18 + facing * 5 + 3} y2={7 - bob + armSwing} stroke="#0284c7" strokeWidth="1.2" />
                  <line x1={18 + facing * 5 - 3} y1={7 - bob + armSwing} x2={18 + facing * 5 - 3} y2={2 - bob + armSwing} stroke="#0284c7" strokeWidth="1.2" />
                  <line x1={18 + facing * 5} y1={7 - bob + armSwing} x2={18 + facing * 5} y2={1 - bob + armSwing} stroke="#38bdf8" strokeWidth="1.4" />
                  <line x1={18 + facing * 5 + 3} y1={7 - bob + armSwing} x2={18 + facing * 5 + 3} y2={2 - bob + armSwing} stroke="#0284c7" strokeWidth="1.2" />
                  <ellipse cx={18 - facing * 3} cy={20 - bob + armSwing} rx="3.5" ry="4.5" fill="#115e59" stroke="#14b8a6" strokeWidth="1" />
                  <circle cx={18 - facing * 3} cy={20 - bob + armSwing} r="1.2" fill="#99f6e4" />
                </g>
              );
            }
          }
        }

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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Woodland trapper: wolf-fur cowl mantle, fringed buckskin tunic, flint-tipped javelins, bark arm buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#24170b" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill="#854d0e" />
                  <polygon points={`14,${17 - bob} 22,${17 - bob} 23,${21 - bob} 18,${22 - bob} 13,${21 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14.5,${14 - bob} 18,${8 - bob} 21.5,${14 - bob} ${18 - facing * 2},${16 - bob}`} fill="#1e3318" />
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9} y2={10 - bob + armSwing} stroke="#5c3818" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${10 - bob + armSwing} ${18 + facing * 11},${13 - bob + armSwing} ${18 + facing * 7.5},${12 - bob + armSwing}`} fill="#64748b" />
                  <circle cx={18 - facing * 3.5} y={21 - bob} r="3.2" fill="#78350f" stroke="#36220f" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} y={21 - bob} r="1.5" fill="#15803d" />
                </g>
              );
            }
            case "sand": {
              // Desert slinger / skirmisher: draped linen keffiyeh, flowing sand tunic with crimson sash, throwing darts, brass buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#a16207" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x="15" y={18 - bob} width="6.5" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14.5" y={22 - bob} width="7.5" height="1.8" fill="#b91c1c" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3" rx="1" fill="#fef3c7" />
                  <line x1="14" y1={12.5 - bob} x2="22" y2={12.5 - bob} stroke="#18181b" strokeWidth="0.8" />
                  <line x1={18 - facing * 3} y1={23 - bob + armSwing} x2={18 + facing * 9.5} y2={11 - bob + armSwing} stroke="#78350f" strokeWidth="1.3" />
                  <polygon points={`${18 + facing * 9.5},${11 - bob + armSwing} ${18 + facing * 11},${13.5 - bob + armSwing} ${18 + facing * 8},${13 - bob + armSwing}`} fill="#f1f5f9" />
                  <polygon points={`${18 - facing * 1.5},${21 - bob + armSwing} ${18 - facing * 4},${23 - bob + armSwing} ${18 - facing * 2.5},${25 - bob + armSwing}`} fill="#dc2626" />
                  <circle cx={18 - facing * 3.5} y={20.5 - bob} r="3.2" fill="#f59e0b" stroke="#facc15" strokeWidth="0.9" />
                  <circle cx={18 - facing * 3.5} y={20.5 - bob} r="1.3" fill="#fef08a" />
                </g>
              );
            }
            case "steppe": {
              // Nomad runner: pointed felt hat with fur brim, belted deel coat, composite reflex javelins, painted leather shield
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.6" height="4" fill="#292524" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.6" height="4" fill="#1c1917" />
                  <rect x="14.5" y={17.5 - bob} width="7.5" height="9" rx="1" fill="#475569" />
                  <rect x="14" y={22 - bob} width="8.5" height="1.8" fill="#ca8a04" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`15,${12 - bob} 18,${7 - bob} 21,${12 - bob}`} fill="#78350f" />
                  <rect x="14" y={11.5 - bob} width="8" height="2.5" rx="1" fill="#d97706" />
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9} y2={11 - bob + armSwing} stroke="#6b3a19" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${11 - bob + armSwing} ${18 + facing * 11},${13.5 - bob + armSwing} ${18 + facing * 8},${13 - bob + armSwing}`} fill="#cbd5e1" />
                  <rect x={18 + facing * 6} y={13 - bob + armSwing} width="2" height="2" fill="#18181b" />
                  <circle cx={18 - facing * 3.5} y={20.5 - bob} r="3.2" fill="#854d0e" stroke="#ca8a04" strokeWidth="1" />
                  <circle cx={18 - facing * 3.5} y={20.5 - bob} r="1.4" fill="#b91c1c" />
                </g>
              );
            }
            case "islands": {
              // Reef scout: woven palm visor, tattooed arms, sailcloth kilt, barbed stingray harpoon darts, turtle-shell arm buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.4" height="4" fill="#b45309" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.4" height="4" fill="#92400e" />
                  <rect x="15" y={18 - bob} width="6.5" height="5" fill="#0d9488" />
                  <polygon points={`14.5,${22 - bob} 21.5,${22 - bob} 22,${27 - bob} 14,${27 - bob}`} fill="#f4f4f5" stroke="#d4d4d4" strokeWidth="0.5" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <polygon points={`14,${13 - bob} 18,${10 - bob} 22,${13 - bob} ${18 - facing * 2},${14 - bob}`} fill="#ca8a04" />
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9.5} y2={10.5 - bob + armSwing} stroke="#0284c7" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9.5},${10.5 - bob + armSwing} ${18 + facing * 12},${13 - bob + armSwing} ${18 + facing * 8.5},${12.5 - bob + armSwing}`} fill="#38bdf8" />
                  <ellipse cx={18 - facing * 3.5} cy={20.5 - bob} rx="3" ry="4" fill="#115e59" stroke="#14b8a6" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} cy={20.5 - bob} r="1" fill="#fef08a" />
                </g>
              );
            }
          }
        }
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
        const hLeg1 = frame === 1 ? 1 : frame === 2 ? -1 : 0;
        const hLeg2 = frame === 1 ? -1 : frame === 2 ? 1 : 0;
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Mountain bay horse with fur blanket, rider with woodland cowl, leaf-spear, clan totem pennon
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#36220f" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#4a2c11" />
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#4a2c11" />
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#4a2c11" />
                  <rect x={18 + facing * 9} y={10 - bob} width="2.5" height="3" fill="#1c1917" />
                  <rect x="14" y={18 - bob} width="8" height="3" fill="#3f220c" />
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#854d0e" />
                  <circle cx="18" cy={9 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`15,${9 - bob} 18,${4 - bob} 21,${9 - bob} ${18 - facing * 2},${11 - bob}`} fill="#1e3318" />
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#5c3818" strokeWidth="1.6" />
                  <polygon points={`${18 + facing * 15},${6 - bob} ${18 + facing * 13.5},${3 - bob} ${18 + facing * 17},${5 - bob} ${18 + facing * 13.5},${9 - bob}`} fill="#cbd5e1" />
                  <polygon points={`${18 + facing * 10},${7 - bob} ${18 + facing * 14},${5.5 - bob} ${18 + facing * 10},${10.5 - bob}`} fill="#166534" />
                </g>
              );
            }
            case "sand": {
              // Desert Arabian charger: sleek sand/white horse with crimson barding, rider with turban, silver lance with red pennon
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="2.8" height="6" fill="#e2e8f0" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="2.8" height="6" fill="#f8fafc" />
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#f8fafc" />
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#f8fafc" />
                  <rect x={18 + facing * 9} y={10 - bob} width="2.5" height="3" fill="#cbd5e1" />
                  <rect x="13.5" y={18 - bob} width="9" height="3.5" fill="#b91c1c" />
                  <line x1="13.5" y1={21.5 - bob} x2="22.5" y2={21.5 - bob} stroke="#facc15" strokeWidth="0.8" />
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#fef3c7" />
                  <circle cx="18" cy={9 - bob} r="3" fill="#d4a373" />
                  <rect x="14.5" y={6.5 - bob} width="7" height="3" rx="1" fill="#fde68a" />
                  <path d={`M${18 - facing * 2.5} ${7.5 - bob} Q${18 - facing * 5} ${11 - bob} ${18 - facing * 4} ${16 - bob}`} stroke="#fef3c7" strokeWidth="1.8" fill="none" />
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#94a3b8" strokeWidth="1.3" />
                  <polygon points={`${18 + facing * 15},${6 - bob} ${18 + facing * 17},${5 - bob} ${18 + facing * 14},${7.5 - bob}`} fill="#f1f5f9" />
                  <polygon points={`${18 + facing * 9},${7 - bob} ${18 + facing * 14},${5 - bob} ${18 + facing * 12},${7 - bob} ${18 + facing * 14},${9 - bob} ${18 + facing * 9},${8 - bob}`} fill="#dc2626" />
                </g>
              );
            }
            case "steppe": {
              // Nomad steppe pony: shaggy dun pony with leather saddle, rider with spangenhelm and horsehair lance
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3.2" height="5.5" fill="#543007" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3.2" height="5.5" fill="#78350f" />
                  <rect x="9" y={19.5 - bob} width="18" height="6" rx="2" fill="#854d0e" />
                  <polygon points={`${18 + facing * 3},${19.5 - bob} ${18 + facing * 9.5},${13 - bob} ${18 + facing * 12.5},${15 - bob} ${18 + facing * 6},${23 - bob}`} fill="#854d0e" />
                  <rect x={18 + facing * 8.5} y={11 - bob} width="3" height="3" fill="#1c1917" />
                  <rect x="14" y={18.5 - bob} width="8" height="3" fill="#451a03" />
                  <rect x="14.5" y={12.5 - bob} width="7" height="6" rx="1" fill="#334155" />
                  <circle cx="18" cy={9.5 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`14.5,${8.5 - bob} 18,${4.5 - bob} 21.5,${8.5 - bob}`} fill="#94a3b8" />
                  <path d={`M18,${4.5 - bob} Q${18 - facing * 3},${2 - bob} ${18 - facing * 4},${6 - bob}`} stroke="#dc2626" strokeWidth="1.4" fill="none" />
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#6b3a19" strokeWidth="1.5" />
                  <polygon points={`${18 + facing * 15},${6 - bob} ${18 + facing * 17},${5 - bob} ${18 + facing * 14},${7.5 - bob}`} fill="#f1f5f9" />
                  <rect x={18 + facing * 11} y={6.5 - bob} width="2.5" height="2.5" rx="0.5" fill="#18181b" />
                </g>
              );
            }
            case "islands": {
              // Coastal outrider: wave-caparisoned mount, reed helmet, shell breastplate, barbed trident lance, sea banner
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#573312" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#6b3a19" />
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#6b3a19" />
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#6b3a19" />
                  <rect x="13.5" y={18 - bob} width="9" height="4" fill="#0f766e" />
                  <line x1="13.5" y1={22 - bob} x2="22.5" y2={22 - bob} stroke="#f0fdfa" strokeWidth="0.8" />
                  <rect x="15" y={12.5 - bob} width="6" height="6" rx="1" fill="#e2e8f0" />
                  <circle cx="18" cy={9.5 - bob} r="3" fill="#d99b66" />
                  <path d={`M15,${9 - bob} Q18,${5.5 - bob} 21,${9 - bob} Z`} fill="#ca8a04" />
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#78350f" strokeWidth="1.5" />
                  <line x1={18 + facing * 15 - 2} y1={6 - bob} x2={18 + facing * 15 + 2} y2={6 - bob} stroke="#0284c7" strokeWidth="1.2" />
                  <line x1={18 + facing * 15} y1={6 - bob} x2={18 + facing * 17.5} y2={5 - bob} stroke="#38bdf8" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${7.5 - bob} ${18 + facing * 13},${6 - bob} ${18 + facing * 9},${10.5 - bob}`} fill="#0d9488" />
                </g>
              );
            }
          }
        }
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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Cedar Ironwood Champion: heavy scale armor, carved bear helm with antler crest, cedar tower shield, war-cleaver
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#24170b" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#4a3728" />
                  <line x1="14.5" y1={19 - bob} x2="21.5" y2={19 - bob} stroke="#d97706" strokeWidth="0.8" />
                  <line x1="14.5" y1={22 - bob} x2="21.5" y2={22 - bob} stroke="#d97706" strokeWidth="0.8" />
                  <rect x="14.5" y={10 - bob} width="7" height="7" rx="1.2" fill="#3f220c" />
                  <polygon points={`13.5,${9 - bob} 15,${4 - bob} 17,${8 - bob}`} fill="#eab308" />
                  <polygon points={`19,${8 - bob} 21,${4 - bob} 22.5,${9 - bob}`} fill="#eab308" />
                  <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.4" fill="#18181b" />
                  <polygon points={`${18 - facing * 2},${16 - bob + armSwing} ${18 - facing * 8.5},${16 - bob + armSwing} ${18 - facing * 8.5},${29 - bob + armSwing} ${18 - facing * 2},${29 - bob + armSwing}`} fill="#78350f" stroke="#3f220c" strokeWidth="1" />
                  <line x1={18 - facing * 5.2} y1={18 - bob + armSwing} x2={18 - facing * 5.2} y2={27 - bob + armSwing} stroke="#166534" strokeWidth="1.8" />
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={8 - bob + armSwing} stroke="#cbd5e1" strokeWidth="2.4" />
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={8 - bob + armSwing} stroke="#f1f5f9" strokeWidth="1" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 7.5} y2={23 - bob + armSwing} stroke="#5c3818" strokeWidth="1.5" />
                </g>
              );
            }
            case "sand": {
              // Desert Mamluk: gilded mirror plate cuirass, turban-wrapped helmet, round sun buckler, curved scimitar
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#94a3b8" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#64748b" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#f59e0b" />
                  <circle cx="18" cy={21 - bob} r="2" fill="#cbd5e1" stroke="#facc15" strokeWidth="0.5" />
                  <rect x="14.5" y={10 - bob} width="7" height="7" rx="1" fill="#cbd5e1" />
                  <rect x="14" y={10 - bob} width="8" height="2.8" rx="1" fill="#fde68a" />
                  <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.2" fill="#0f172a" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="5" fill="#eab308" stroke="#fde047" strokeWidth="1" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="2" fill="#f59e0b" />
                  <path d={`M${18 + facing * 4} ${26 - bob + armSwing} Q${18 + facing * 8} ${18 - bob + armSwing} ${18 + facing * 5} ${9 - bob + armSwing}`} stroke="#f8fafc" strokeWidth="2" fill="none" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 7.5} y2={23 - bob + armSwing} stroke="#eab308" strokeWidth="1.5" />
                </g>
              );
            }
            case "steppe": {
              // Steppe Cataphract: lamellar iron/bronze cuirass, pointed spangenhelm with cheek-guards, lacquered shield, sabre
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#334155" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#1e293b" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#334155" />
                  <line x1="14.5" y1={19 - bob} x2="21.5" y2={19 - bob} stroke="#ca8a04" strokeWidth="1" />
                  <line x1="14.5" y1={22 - bob} x2="21.5" y2={22 - bob} stroke="#ca8a04" strokeWidth="1" />
                  <polygon points={`14.5,${12 - bob} 18,${7 - bob} 21.5,${12 - bob}`} fill="#94a3b8" />
                  <rect x="14.5" y={12 - bob} width="7" height="4.5" fill="#64748b" />
                  <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.2" fill="#0f172a" />
                  <path d={`M18,${7 - bob} Q${18 - facing * 3},${4 - bob} ${18 - facing * 5},${9 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  <rect x={18 - facing * 8} y={17 - bob + armSwing} width="6" height="11" rx="1" fill="#991b1b" stroke="#ca8a04" strokeWidth="0.8" />
                  <circle cx={18 - facing * 5} cy={22.5 - bob + armSwing} r="1.5" fill="#facc15" />
                  <path d={`M${18 + facing * 4} ${26 - bob + armSwing} Q${18 + facing * 7.5} ${18 - bob + armSwing} ${18 + facing * 5} ${9 - bob + armSwing}`} stroke="#f1f5f9" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 7.5} y2={23 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.5" />
                </g>
              );
            }
            case "islands": {
              // Tide Lord: pearl-shell plate armor, carved war mask with shark teeth, nautilus shield, serrated shark-tooth wave sword
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#0f766e" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#115e59" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#e2e8f0" stroke="#0d9488" strokeWidth="0.8" />
                  <rect x="14" y={10 - bob} width="8" height="7" rx="1" fill="#78350f" />
                  <line x1="14.5" y1={12.5 - bob} x2="21.5" y2={12.5 - bob} stroke="#ffffff" strokeWidth="1" />
                  <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.2" fill="#0f172a" />
                  <ellipse cx={18 - facing * 5} cy={22 - bob + armSwing} rx="4" ry="5.5" fill="#14b8a6" stroke="#f0fdfa" strokeWidth="1" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="1.8" fill="#fef08a" />
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={9 - bob + armSwing} stroke="#0284c7" strokeWidth="2.2" />
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={9 - bob + armSwing} stroke="#ffffff" strokeWidth="0.8" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 7.5} y2={23 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.5" />
                </g>
              );
            }
          }
        }
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
        const armTilt = frame === 1 ? -2 : frame === 2 ? 2 : 0;
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Forest log catapult: solid timber disk wheels, bent-wood throwing beam, river boulder
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  <circle cx="8" cy={27 - bob} r="4.5" fill="#3f220c" stroke="#5c3818" strokeWidth="1.2" />
                  <circle cx="28" cy={27 - bob} r="4.5" fill="#3f220c" stroke="#5c3818" strokeWidth="1.2" />
                  <circle cx="8" cy={27 - bob} r="1.5" fill="#d97706" />
                  <circle cx="28" cy={27 - bob} r="1.5" fill="#d97706" />
                  <rect x="5" y={20 - bob} width="26" height="6.5" rx="1" fill="#5c3818" stroke="#36220f" strokeWidth="1" />
                  <line x1="5" y1={23 - bob} x2="31" y2={23 - bob} stroke="#36220f" strokeWidth="1" />
                  <line x1="12" y1={20 - bob} x2="18" y2={8 - bob} stroke="#78350f" strokeWidth="2.4" />
                  <line x1="24" y1={20 - bob} x2="18" y2={8 - bob} stroke="#78350f" strokeWidth="2.4" />
                  <path d={`M${18 - facing * 11} ${18 - bob - armTilt} Q${18} ${12 - bob} ${18 + facing * 12} ${3 - bob + armTilt}`} stroke="#854d0e" strokeWidth="2.8" fill="none" />
                  <rect x={18 - facing * 13} y={15 - bob - armTilt} width="5" height="5" fill="#4a3728" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3.2" fill="#64748b" />
                  <circle cx={18 + facing * 12.5} cy={2.5 - bob + armTilt} r="1.2" fill="#15803d" />
                </g>
              );
            }
            case "sand": {
              // Desert torsion mangonel: sun-bleached carriage, torsion rope coils, terracotta fire-pot
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  <rect x="5" y={25 - bob} width="26" height="4" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
                  <rect x="7" y={21 - bob} width="4" height="6" fill="#18181b" />
                  <rect x="25" y={21 - bob} width="4" height="6" fill="#18181b" />
                  <circle cx="9" cy={24 - bob} r="2" fill="#f59e0b" />
                  <circle cx="27" cy={24 - bob} r="2" fill="#f59e0b" />
                  <rect x="6" y={19 - bob} width="24" height="5" fill="#d97706" />
                  <polygon points={`12,${19 - bob} 18,${7 - bob} 24,${19 - bob}`} stroke="#b45309" strokeWidth="2" fill="none" />
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#78350f" strokeWidth="2.5" />
                  <rect x={18 - facing * 14} y={16 - bob - armTilt} width="5" height="5" fill="#d97706" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill="#c2410c" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="1.5" fill="#ea580c" />
                </g>
              );
            }
            case "steppe": {
              // Nomad war-wagon traction trebuchet: 4 spoked wheels, wattle-hurdle bed, pulling harness, stone shot
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  <circle cx="7" cy={27 - bob} r="4.5" fill="#78350f" stroke="#1c1917" strokeWidth="1" />
                  <circle cx="29" cy={27 - bob} r="4.5" fill="#78350f" stroke="#1c1917" strokeWidth="1" />
                  <circle cx="7" cy={27 - bob} r="1.2" fill="#ca8a04" />
                  <circle cx="29" cy={27 - bob} r="1.2" fill="#ca8a04" />
                  <rect x="4" y={20 - bob} width="28" height="6" rx="1" fill="#573312" />
                  <line x1="4" y1={23 - bob} x2="32" y2={23 - bob} stroke="#ca8a04" strokeWidth="0.8" />
                  <polygon points={`11,${20 - bob} 18,${7 - bob} 25,${20 - bob}`} stroke="#854d0e" strokeWidth="2.2" fill="none" />
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#451a03" strokeWidth="2.5" />
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 - facing * 15} y2={25 - bob - armTilt} stroke="#ca8a04" strokeWidth="1" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill="#71717a" />
                </g>
              );
            }
            case "islands": {
              // Coastal outrigger catapult: catamaran driftwood carriage, whale-bone bow/beam, barbed harpoon
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  <rect x="4" y={26 - bob} width="28" height="3" rx="1" fill="#854d0e" stroke="#5c3818" strokeWidth="0.8" />
                  <rect x="6" y={21 - bob} width="24" height="4.5" fill="#0f766e" />
                  <line x1="6" y1={21 - bob} x2="30" y2={21 - bob} stroke="#ca8a04" strokeWidth="1" />
                  <polygon points={`11,${21 - bob} 18,${7 - bob} 25,${21 - bob}`} stroke="#0f766e" strokeWidth="2" fill="none" />
                  <path d={`M${18 - facing * 10} ${17 - bob - armTilt} Q${18} ${8 - bob} ${18 + facing * 13} ${2 - bob + armTilt}`} stroke="#e2e8f0" strokeWidth="2.5" fill="none" />
                  <circle cx={18 - facing * 10} cy={17 - bob - armTilt} r="2.5" fill="#ca8a04" />
                  <polygon points={`${18 + facing * 13},${2 - bob + armTilt} ${18 + facing * 16},${0 - bob + armTilt} ${18 + facing * 14},${5 - bob + armTilt}`} fill="#38bdf8" />
                </g>
              );
            }
          }
        }
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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Ancient Wood Warden: stag antler crown helm, emerald plate, wolf-fur mantle, glowing emerald runic blade
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#14532d" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#0f3d21" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#166534" />
                  <rect x="14.5" y={17 - bob} width="7" height="3" fill="#d97706" />
                  <polygon points={`13.5,${17 - bob} 22.5,${17 - bob} 23.5,${21 - bob} 18,${22 - bob} 12.5,${21 - bob}`} fill="#3f220c" />
                  <rect x="15" y={10 - bob} width="6" height="6" rx="1" fill="#14532d" />
                  <circle cx="18" cy={11 - bob} r="1.2" fill="#22c55e" />
                  <polygon points={`13,${9 - bob} 14.5,${4 - bob} 16.5,${7.5 - bob} 18,${5.5 - bob} 19.5,${7.5 - bob} 21.5,${4 - bob} 23,${9 - bob}`} fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#22c55e" strokeWidth="2.6" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#bbf7d0" strokeWidth="1.2" />
                  <line x1={18 + facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 8} y2={23 - bob + armSwing} stroke="#eab308" strokeWidth="1.6" />
                  <polygon points={`${18 - facing * 2},${18 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 4},${28 - bob}`} fill="#14532d" />
                </g>
              );
            }
            case "sand": {
              // Solar Champion: radiant golden solar armor, sunburst breastplate, jeweled turban-crown, blazing sun scimitar
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#f59e0b" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#d97706" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#fde047" />
                  <circle cx="18" cy={20 - bob} r="2" fill="#f59e0b" />
                  <line x1="15" y1={17 - bob} x2="21" y2={25 - bob} stroke="#f59e0b" strokeWidth="0.8" />
                  <line x1="21" y1={17 - bob} x2="15" y2={25 - bob} stroke="#f59e0b" strokeWidth="0.8" />
                  <rect x="14.5" y={9.5 - bob} width="7" height="6.5" rx="1.5" fill="#fde68a" />
                  <circle cx="18" cy={9 - bob} r="1.3" fill="#dc2626" />
                  <path d={`M${18 - facing * 2.5} ${10.5 - bob} Q${18 - facing * 6} ${15 - bob} ${18 - facing * 5} ${22 - bob}`} stroke="#fef3c7" strokeWidth="2" fill="none" />
                  <path d={`M${18 + facing * 4} ${27 - bob + armSwing} Q${18 + facing * 9} ${16 - bob + armSwing} ${18 + facing * 5} ${4 - bob + armSwing}`} stroke="#fbbf24" strokeWidth="2.8" fill="none" />
                  <path d={`M${18 + facing * 4} ${27 - bob + armSwing} Q${18 + facing * 9} ${16 - bob + armSwing} ${18 + facing * 5} ${4 - bob + armSwing}`} stroke="#ffffff" strokeWidth="1.2" fill="none" />
                  <line x1={18 + facing * 2} y1={24 - bob + armSwing} x2={18 + facing * 8} y2={24 - bob + armSwing} stroke="#f59e0b" strokeWidth="1.6" />
                  <polygon points={`${18 - facing * 2},${18 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 4},${28 - bob}`} fill="#991b1b" />
                </g>
              );
            }
            case "steppe": {
              // Great Khan: gilded lamellar armor, golden eagle-crested spangenhelm with horsehair crest, azure storm broadsword
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#ca8a04" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#78350f" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#ca8a04" />
                  <rect x="14.5" y={17 - bob} width="7" height="3" fill="#facc15" />
                  <polygon points={`13.5,${17 - bob} 22.5,${17 - bob} 22.5,${21 - bob} 13.5,${21 - bob}`} fill="#f1f5f9" stroke="#18181b" strokeWidth="0.5" />
                  <polygon points={`14.5,${11 - bob} 18,${5.5 - bob} 21.5,${11 - bob}`} fill="#facc15" />
                  <path d={`M18,${5.5 - bob} Q${18 - facing * 3},${3 - bob} ${18 - facing * 5.5},${7 - bob}`} stroke="#f8fafc" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#38bdf8" strokeWidth="2.5" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#ffffff" strokeWidth="1.2" />
                  <line x1={18 + facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 8} y2={23 - bob + armSwing} stroke="#facc15" strokeWidth="1.6" />
                  <polygon points={`${18 - facing * 2},${18 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 4},${28 - bob}`} fill="#b91c1c" />
                </g>
              );
            }
            case "islands": {
              // Sovereign of the Deep: iridescent abalone pearl plate, branching coral crown with glowing pearl, aquamarine trident
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#0d9488" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#0f766e" />
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#2dd4bf" stroke="#0f766e" strokeWidth="0.8" />
                  <rect x="14.5" y={17 - bob} width="7" height="3" fill="#facc15" />
                  <polygon points={`13.5,${10 - bob} 15,${5 - bob} 16.5,${8 - bob} 18,${4 - bob} 19.5,${8 - bob} 21,${5 - bob} 22.5,${10 - bob}`} fill="#06b6d4" />
                  <circle cx="18" cy={8.5 - bob} r="1.4" fill="#ffffff" />
                  <line x1={18 + facing * 5} y1={28 - bob + armSwing} x2={18 + facing * 5} y2={4 - bob + armSwing} stroke="#0284c7" strokeWidth="1.8" />
                  <line x1={18 + facing * 5 - 3} y1={5 - bob + armSwing} x2={18 + facing * 5 + 3} y2={5 - bob + armSwing} stroke="#22d3ee" strokeWidth="1.4" />
                  <line x1={18 + facing * 5 - 3} y1={5 - bob + armSwing} x2={18 + facing * 5 - 3} y2={1 - bob + armSwing} stroke="#22d3ee" strokeWidth="1.4" />
                  <line x1={18 + facing * 5} y1={5 - bob + armSwing} x2={18 + facing * 5} y2={0 - bob + armSwing} stroke="#ffffff" strokeWidth="1.6" />
                  <line x1={18 + facing * 5 + 3} y1={5 - bob + armSwing} x2={18 + facing * 5 + 3} y2={1 - bob + armSwing} stroke="#22d3ee" strokeWidth="1.4" />
                  <polygon points={`${18 - facing * 2},${18 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 4},${28 - bob}`} fill="#0369a1" />
                </g>
              );
            }
          }
        }
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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Woodland hunter militia: hooded cowl, buckskin tunic, heavy carved cedar cudgel
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#292524" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#1c1917" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill="#3f4a34" />
                  <rect x="15" y={22 - bob} width="6.5" height="1.6" fill="#78350f" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14,${15 - bob} 18,${10 - bob} 22,${15 - bob} ${18 - facing * 3},${17 - bob}`} fill="#1e3318" />
                  <polygon points={`${18 + facing * 4},${25 - bob + armSwing} ${18 + facing * 5.5},${17 - bob + armSwing} ${18 + facing * 2.5},${17 - bob + armSwing} ${18 + facing * 3.5},${25 - bob + armSwing}`} fill="#5c3818" stroke="#36220f" strokeWidth="0.5" />
                </g>
              );
            }
            case "sand": {
              // Desert militia: loose linen robe, flowing waist sash, desert ironwood walking staff
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#713f12" />
                  <rect x="14.5" y={18 - bob} width="7" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14" y={22 - bob} width="8" height="1.8" fill="#b45309" />
                  <line x1={18 - facing * 2} y1={23 - bob} x2={18 - facing * 4} y2={28 - bob} stroke="#b45309" strokeWidth="1.2" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3.5" rx="1" fill="#fde68a" />
                  <line x1="14" y1={12.5 - bob} x2="22" y2={12.5 - bob} stroke="#92400e" strokeWidth="0.8" />
                  <line x1={18 + facing * 4.5} y1={30 - bob} x2={18 + facing * 4.5} y2={10 - bob + armSwing} stroke="#78350f" strokeWidth="1.6" />
                  <circle cx={18 + facing * 4.5} cy={10 - bob + armSwing} r="1.3" fill="#b45309" />
                </g>
              );
            }
            case "steppe": {
              // Steppe nomad militia: conical felt cap with fur brim, belted nomad coat (deel), spiked wooden cudgel
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.6" height="4" fill="#292524" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.6" height="4" fill="#1c1917" />
                  <rect x="14.5" y={17.5 - bob} width="7.5" height="9" rx="1" fill="#475569" />
                  <rect x="14" y={22 - bob} width="8.5" height="1.8" fill="#ca8a04" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`15,${12 - bob} 18,${7 - bob} 21,${12 - bob}`} fill="#78350f" />
                  <rect x="14" y={11.5 - bob} width="8" height="2.5" rx="1" fill="#d97706" />
                  <line x1={18 + facing * 4.5} y1={25 - bob + armSwing} x2={18 + facing * 5.5} y2={16 - bob + armSwing} stroke="#573312" strokeWidth="2.2" />
                  <circle cx={18 + facing * 5.5} cy={16 - bob + armSwing} r="2.2" fill="#3f3f46" />
                </g>
              );
            }
            case "islands": {
              // Island levy: broad-brim straw hat, frayed sailcloth tunic, carved boat oar
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={27 - bob} width="2.4" height="3" fill="#b45309" />
                  <rect x={18 + legR * facing} y={27 - bob} width="2.4" height="3" fill="#92400e" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="0.5" fill="#0d9488" />
                  <rect x="14.5" y={22 - bob} width="7.5" height="1.6" fill="#854d0e" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <ellipse cx="18" cy={12 - bob} rx="6" ry="1.8" fill="#ca8a04" />
                  <circle cx="18" cy={10.5 - bob} r="2.4" fill="#a16207" />
                  <line x1={18 + facing * 4.5} y1={28 - bob} x2={18 + facing * 4.5} y2={11 - bob + armSwing} stroke="#78350f" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 4.5 - 2},${15 - bob + armSwing} ${18 + facing * 4.5 + 2},${15 - bob + armSwing} ${18 + facing * 4.5 + 1.2},${8 - bob + armSwing} ${18 + facing * 4.5 - 1.2},${8 - bob + armSwing}`} fill="#b45309" stroke="#78350f" strokeWidth="0.5" />
                </g>
              );
            }
          }
        }

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


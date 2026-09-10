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
              // Woodland hunter archer: hooded cowl, buckskin/forest tunic, cedar longbow, birch quiver
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#24170b" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill="#2d4a22" />
                  <rect x="15" y={22 - bob} width="6.5" height="1.6" fill={cultPal.timber} />
                  <polygon points={`14,${17 - bob} 22,${17 - bob} 22.5,${21 - bob} 18,${22 - bob} 13.5,${21 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14,${14 - bob} 18,${8 - bob} 22,${14 - bob} ${18 - facing * 2.5},${17 - bob}`} fill="#1e3318" />
                  <rect x={18 - facing * 4.5} y={15 - bob} width="3" height="8" fill="#78350f" />
                  <line x1={18 - facing * 3.5} y1={15 - bob} x2={18 - facing * 3.5} y2={10 - bob} stroke="#e2e8f0" strokeWidth="1.5" />
                  <path d={`M${18 + facing * 4.5} ${7 - bob + armSwing} Q${18 + facing * 8} ${19 - bob + armSwing} ${18 + facing * 4.5} ${31 - bob + armSwing}`} stroke="#5c3818" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4.5} y1={7 - bob + armSwing} x2={18 + facing * 4.5} y2={31 - bob + armSwing} stroke="#e2e8f0" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 7.5} y2={19 - bob + armSwing} stroke="#f8fafc" strokeWidth="1.1" />
                </g>
              );
            }
            case "sand": {
              // Desert composite bowman: flowing turban havelock, linen kaftan, reflex horn bow, red sash
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#a16207" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x="14.5" y={18 - bob} width="7" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14" y={22 - bob} width="8" height="2" fill="#b91c1c" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3.5" rx="1.5" fill="#fde68a" />
                  <path d={`M${18 - facing * 3} ${12 - bob} Q${18 - facing * 6} ${16 - bob} ${18 - facing * 4} ${22 - bob}`} stroke="#fef3c7" strokeWidth="2.2" fill="none" />
                  <rect x={18 - facing * 4.5} y={18 - bob} width="3" height="7" fill="#b91c1c" />
                  <line x1={18 - facing * 3.5} y1={18 - bob} x2={18 - facing * 3.5} y2={13 - bob} stroke="#fef08a" strokeWidth="1.4" />
                  <path d={`M${18 + facing * 4} ${9 - bob + armSwing} Q${18 + facing * 8} ${12 - bob + armSwing} ${18 + facing * 7} ${19 - bob + armSwing} Q${18 + facing * 8} ${26 - bob + armSwing} ${18 + facing * 4} ${29 - bob + armSwing}`} stroke="#b45309" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4} y1={9 - bob + armSwing} x2={18 + facing * 4} y2={29 - bob + armSwing} stroke="#fef08a" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 7} y2={19 - bob + armSwing} stroke="#dc2626" strokeWidth="1.1" />
                </g>
              );
            }
            case "steppe": {
              // Steppe horse/foot archer: conical felt cap with earflaps, double-breasted caftan, reflex horn bow
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.7" height="4" fill="#1e1b18" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.7" height="4" fill="#3f3f46" />
                  <rect x="14" y={17 - bob} width="8" height="9.5" rx="1.5" fill="#475569" />
                  <polygon points={`15,${17 - bob} 18,${21 - bob} 15,${26 - bob}`} fill="#334155" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#eab308" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`14,${13 - bob} 18,${8 - bob} 22,${13 - bob}`} fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
                  <rect x="13.5" y={12.5 - bob} width="9" height="1.5" fill="#64748b" />
                  <path d={`M18,${8 - bob} Q${18 - facing * 3},${5 - bob} ${18 - facing * 5},${9 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  <rect x={18 - facing * 4.5} y={16 - bob} width="3.2" height="8" fill="#78350f" />
                  <line x1={18 - facing * 3.5} y1={16 - bob} x2={18 - facing * 3.5} y2={11 - bob} stroke="#f1f5f9" strokeWidth="1.4" />
                  <path d={`M${18 + facing * 4.5} ${8 - bob + armSwing} Q${18 + facing * 8} ${14 - bob + armSwing} ${18 + facing * 6.5} ${19 - bob + armSwing} Q${18 + facing * 8} ${24 - bob + armSwing} ${18 + facing * 4.5} ${30 - bob + armSwing}`} stroke="#6b3a19" strokeWidth="1.9" fill="none" />
                  <line x1={18 + facing * 4.5} y1={8 - bob + armSwing} x2={18 + facing * 4.5} y2={30 - bob + armSwing} stroke="#f1f5f9" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 7} y2={19 - bob + armSwing} stroke="#1e293b" strokeWidth="1.2" />
                </g>
              );
            }
            case "islands": {
              // Island archer: reed conical hat, sailcloth kilt, asymmetrical bamboo longbow
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.4" height="4" fill="#78350f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.4" height="4" fill="#a16207" />
                  <rect x="14.5" y={17.5 - bob} width="7" height="5" fill="#0f766e" />
                  <polygon points={`14,${22 - bob} 22,${22 - bob} 22.5,${27 - bob} 13.5,${27 - bob}`} fill="#d4d4d4" stroke="#a3a3a3" strokeWidth="0.5" />
                  <rect x="14" y={22 - bob} width="8" height="1.4" fill="#854d0e" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <path d={`M14,${13 - bob} Q18,${9 - bob} 22,${13 - bob} Z`} fill="#d97706" />
                  <line x1="13.5" y1={13 - bob} x2="22.5" y2={13 - bob} stroke="#fef08a" strokeWidth="1.2" />
                  <rect x={18 - facing * 4.5} y={15 - bob} width="2.8" height="8" rx="1" fill="#b45309" stroke="#78350f" strokeWidth="0.6" />
                  <line x1={18 - facing * 3.5} y1={15 - bob} x2={18 - facing * 3.5} y2={10 - bob} stroke="#38bdf8" strokeWidth="1.4" />
                  <path d={`M${18 + facing * 4.5} ${5 - bob + armSwing} Q${18 + facing * 8.5} ${15 - bob + armSwing} ${18 + facing * 5} ${21 - bob + armSwing} Q${18 + facing * 7} ${27 - bob + armSwing} ${18 + facing * 4.5} ${31 - bob + armSwing}`} stroke="#eab308" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 4.5} y1={5 - bob + armSwing} x2={18 + facing * 4.5} y2={31 - bob + armSwing} stroke="#e2e8f0" strokeWidth="0.8" />
                  <line x1={18 - facing * 1} y1={19 - bob + armSwing} x2={18 + facing * 7.5} y2={19 - bob + armSwing} stroke="#0284c7" strokeWidth="1.1" />
                </g>
              );
            }
          }
        }

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
              // Woodland hunter skirmisher: fur hood, tomahawk / throwing axe, hide buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#24170b" />
                  <rect x="15" y={18 - bob} width="6.5" height="8" rx="1" fill="#2d4a22" />
                  <polygon points={`14,${17 - bob} 22,${17 - bob} 23,${21 - bob} 18,${22 - bob} 13,${21 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e2c8a2" />
                  <polygon points={`14,${14 - bob} 18,${9 - bob} 22,${14 - bob} ${18 - facing * 2.5},${17 - bob}`} fill="#1e3318" />
                  {/* Throwing axe / tomahawk */}
                  <line x1={18 - facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 8} y2={12 - bob + armSwing} stroke="#5c3818" strokeWidth="1.6" />
                  <polygon points={`${18 + facing * 8},${10 - bob + armSwing} ${18 + facing * 11},${12 - bob + armSwing} ${18 + facing * 8},${15 - bob + armSwing}`} fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                  {/* Cedar hide buckler */}
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="3.2" fill="#78350f" stroke="#36220f" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="1.5" fill="#2d4a22" />
                </g>
              );
            }
            case "sand": {
              // Desert skirmisher: keffiyeh face wrap, throwing javelin with crimson tassel, brass sun buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.5" height="4" fill="#a16207" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.5" height="4" fill="#854d0e" />
                  <rect x="14.5" y={18 - bob} width="7" height="8.5" rx="1" fill="#fef3c7" />
                  <rect x="14" y={22 - bob} width="8" height="2" fill="#b91c1c" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d4a373" />
                  <rect x="14" y={11 - bob} width="8" height="3.5" rx="1.5" fill="#fde68a" />
                  <path d={`M${18 - facing * 3} ${12 - bob} Q${18 - facing * 6} ${16 - bob} ${18 - facing * 4} ${22 - bob}`} stroke="#fef3c7" strokeWidth="2.2" fill="none" />
                  {/* Javelin with red tassel */}
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9} y2={11 - bob + armSwing} stroke="#78350f" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${11 - bob + armSwing} ${18 + facing * 10.5},${14 - bob + armSwing} ${18 + facing * 7},${13 - bob + armSwing}`} fill="#f1f5f9" />
                  <polygon points={`${18 + facing * 6},${13 - bob + armSwing} ${18 + facing * 8},${17 - bob + armSwing} ${18 + facing * 5.5},${16 - bob + armSwing}`} fill="#dc2626" />
                  {/* Brass sun buckler */}
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="3.2" fill="#d97706" stroke="#facc15" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="1.2" fill="#fef08a" />
                </g>
              );
            }
            case "steppe": {
              // Steppe outrider skirmisher: nomad felt cap, bone-tipped throwing dart, painted hide buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.7" height="4" fill="#1e1b18" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.7" height="4" fill="#3f3f46" />
                  <rect x="14" y={17 - bob} width="8" height="9.5" rx="1.5" fill="#475569" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#eab308" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#e5bb82" />
                  <polygon points={`14,${13 - bob} 18,${8 - bob} 22,${13 - bob}`} fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
                  <path d={`M18,${8 - bob} Q${18 - facing * 3},${5 - bob} ${18 - facing * 5},${9 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  {/* Throwing dart */}
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9} y2={11 - bob + armSwing} stroke="#6b3a19" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${11 - bob + armSwing} ${18 + facing * 11},${13 - bob + armSwing} ${18 + facing * 8},${13 - bob + armSwing}`} fill="#f1f5f9" />
                  <rect x={18 + facing * 6} y={13 - bob + armSwing} width="2" height="2" fill="#18181b" />
                  {/* Painted leather buckler */}
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="3.2" fill="#78350f" stroke="#a16207" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="1.2" fill="#38bdf8" />
                </g>
              );
            }
            case "islands": {
              // Island reef skirmisher: shell headband, barbed fishing harpoon with braided cord, woven buckler
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="7" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  <rect x={18 + legL * facing} y={26 - bob} width="2.4" height="4" fill="#78350f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.4" height="4" fill="#a16207" />
                  <rect x="14.5" y={17.5 - bob} width="7" height="5" fill="#0f766e" />
                  <polygon points={`14,${22 - bob} 22,${22 - bob} 22.5,${27 - bob} 13.5,${27 - bob}`} fill="#d4d4d4" stroke="#a3a3a3" strokeWidth="0.5" />
                  <rect x="14" y={22 - bob} width="8" height="1.4" fill="#854d0e" />
                  <circle cx="18" cy={14 - bob} r="3" fill="#d99b66" />
                  <path d={`M14,${13 - bob} Q18,${9 - bob} 22,${13 - bob} Z`} fill="#d97706" />
                  <line x1="13.5" y1={13 - bob} x2="22.5" y2={13 - bob} stroke="#fef08a" strokeWidth="1.2" />
                  {/* Barbed harpoon with trailing cord */}
                  <line x1={18 - facing * 3} y1={24 - bob + armSwing} x2={18 + facing * 9} y2={11 - bob + armSwing} stroke="#78350f" strokeWidth="1.4" />
                  <polygon points={`${18 + facing * 9},${11 - bob + armSwing} ${18 + facing * 11.5},${13.5 - bob + armSwing} ${18 + facing * 8},${13 - bob + armSwing}`} fill="#38bdf8" />
                  <path d={`M${18 + facing * 4} ${17 - bob + armSwing} Q${18} ${22 - bob + armSwing} ${18 - facing * 2} ${24 - bob + armSwing}`} stroke="#99f6e4" strokeWidth="0.8" fill="none" />
                  {/* Woven reef buckler */}
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="3.2" fill="#115e59" stroke="#14b8a6" strokeWidth="0.8" />
                  <circle cx={18 - facing * 3.5} y={20 - bob} r="1.2" fill="#99f6e4" />
                </g>
              );
            }
          }
        }

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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Boreal forest charger: dark bay horse, green barding, rider in fur mantle with cedar boar lance
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  {/* Horse legs */}
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#24170b" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#36220f" />
                  {/* Horse body */}
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#36220f" />
                  {/* Horse neck & head */}
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#36220f" />
                  <rect x={18 + facing * 9} y={10 - bob} width="2.5" height="3" fill="#18181b" />
                  {/* Woodland forest saddle & caparison */}
                  <rect x="14" y={18 - bob} width="8" height="3.5" rx="1" fill="#2d4a22" />
                  {/* Mounted rider */}
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#1e3318" />
                  <polygon points={`14,${11 - bob} 22,${11 - bob} 22,${14 - bob} 14,${14 - bob}`} fill="#4a3728" />
                  <circle cx="18" cy={9 - bob} r="2.8" fill="#e2c8a2" />
                  <polygon points={`15,${9 - bob} 18,${5 - bob} 21,${9 - bob}`} fill="#1e3318" />
                  {/* Cedar boar spear / lance with green swallowtail pennon */}
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={7 - bob} stroke="#5c3818" strokeWidth="1.6" />
                  <polygon points={`${18 + facing * 15},${7 - bob} ${18 + facing * 18},${6 - bob} ${18 + facing * 14},${9 - bob}`} fill="#cbd5e1" />
                  <polygon points={`${18 + facing * 10},${8 - bob} ${18 + facing * 15},${6 - bob} ${18 + facing * 10},${11 - bob}`} fill="#15803d" />
                  {/* Round cedar shield on flank */}
                  <circle cx={18 - facing * 2} y={17 - bob} r="3" fill="#78350f" stroke="#2d4a22" strokeWidth="0.8" />
                </g>
              );
            }
            case "sand": {
              // Desert Arabian courser: cream mare, rich crimson saddle cloth, rider in flowing robes & keffiyeh
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  {/* Slender legs */}
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="2.6" height="6" fill="#cbd5e1" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="2.6" height="6" fill="#f1f5f9" />
                  {/* Mare body */}
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#f8fafc" />
                  {/* Graceful arched neck */}
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${11 - bob} ${18 + facing * 13},${13 - bob} ${18 + facing * 6},${23 - bob}`} fill="#f8fafc" />
                  <rect x={18 + facing * 9.5} y={9.5 - bob} width="2" height="2.5" fill="#f1f5f9" />
                  {/* Crimson saddle cloth with gold tassels */}
                  <rect x="14" y={18 - bob} width="8" height="4" rx="1" fill="#b91c1c" />
                  <line x1="14" y1={22 - bob} x2="22" y2={22 - bob} stroke="#facc15" strokeWidth="1" />
                  {/* Mounted rider */}
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#fef3c7" />
                  <circle cx="18" cy={9 - bob} r="2.8" fill="#d4a373" />
                  <rect x="14" y={6.5 - bob} width="8" height="3" rx="1" fill="#fde68a" />
                  <path d={`M${18 - facing * 3} ${7 - bob} Q${18 - facing * 6} ${11 - bob} ${18 - facing * 4} ${17 - bob}`} stroke="#fef3c7" strokeWidth="2" fill="none" />
                  {/* Slender desert lance with crimson & gold banner */}
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 16} y2={6 - bob} stroke="#78350f" strokeWidth="1.3" />
                  <polygon points={`${18 + facing * 16},${6 - bob} ${18 + facing * 18.5},${5 - bob} ${18 + facing * 16},${8 - bob}`} fill="#f1f5f9" />
                  <polygon points={`${18 + facing * 11},${7 - bob} ${18 + facing * 16},${5.5 - bob} ${18 + facing * 11},${11 - bob}`} fill="#dc2626" />
                  {/* Brass sun buckler */}
                  <circle cx={18 - facing * 2} y={17 - bob} r="2.8" fill="#d97706" stroke="#facc15" strokeWidth="0.8" />
                </g>
              );
            }
            case "steppe": {
              // Steppe nomad horseman: hardy dun pony, high-cantle saddle, spangenhelm rider with horsehair lance
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  {/* Stocky legs */}
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#78350f" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#a16207" />
                  {/* Pony body */}
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#a16207" />
                  {/* Short muscular neck */}
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#a16207" />
                  {/* Hogged dark mane */}
                  <rect x={18 + facing * 8} y={10 - bob} width="3.5" height="3" fill="#18181b" />
                  {/* Steppe felt saddle */}
                  <rect x="14" y={18 - bob} width="8" height="3.5" rx="1" fill="#78350f" />
                  <rect x="15" y={18 - bob} width="6" height="2" fill="#0284c7" />
                  {/* Mounted nomad rider */}
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#475569" />
                  <circle cx="18" cy={9 - bob} r="2.8" fill="#e5bb82" />
                  <polygon points={`14.5,${9 - bob} 18,${4.5 - bob} 21.5,${9 - bob}`} fill="#94a3b8" />
                  <path d={`M18,${4.5 - bob} Q${18 - facing * 3},${2 - bob} ${18 - facing * 5},${6 - bob}`} stroke="#dc2626" strokeWidth="1.6" fill="none" />
                  {/* Horsehair-tasseled lance */}
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#6b3a19" strokeWidth="1.5" />
                  <polygon points={`${18 + facing * 15},${6 - bob} ${18 + facing * 18},${5 - bob} ${18 + facing * 15},${8 - bob}`} fill="#f1f5f9" />
                  <rect x={18 + facing * 13} y={6 - bob} width="2.5" height="2.5" fill="#18181b" />
                  <polygon points={`${18 + facing * 9},${7 - bob} ${18 + facing * 14},${6 - bob} ${18 + facing * 10},${10 - bob}`} fill="#dc2626" />
                </g>
              );
            }
            case "islands": {
              // Island coastal rider: slate tide mount, teal saddle pad with cowrie trim, trident spear
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="13" ry="3" fill="#000000" fillOpacity="0.35" />
                  {/* Mount legs */}
                  <rect x={facing >= 0 ? 10 : 23} y={24 - bob + hLeg1} width="3" height="6" fill="#334155" />
                  <rect x={facing >= 0 ? 23 : 10} y={24 - bob + hLeg2} width="3" height="6" fill="#475569" />
                  {/* Mount body */}
                  <rect x="9" y={19 - bob} width="18" height="6.5" rx="2" fill="#475569" />
                  <polygon points={`${18 + facing * 3},${19 - bob} ${18 + facing * 10},${12 - bob} ${18 + facing * 13},${14 - bob} ${18 + facing * 6},${23 - bob}`} fill="#475569" />
                  <rect x={18 + facing * 9} y={10 - bob} width="2.5" height="3" fill="#0f766e" />
                  {/* Sea-grass & shell saddle pad */}
                  <rect x="14" y={18 - bob} width="8" height="3.5" rx="1" fill="#0f766e" />
                  <line x1="14" y1={21.5 - bob} x2="22" y2={21.5 - bob} stroke="#99f6e4" strokeWidth="1" />
                  {/* Mounted warrior */}
                  <rect x="15" y={12 - bob} width="6" height="6.5" rx="1" fill="#115e59" />
                  <circle cx="18" cy={9 - bob} r="2.8" fill="#d99b66" />
                  <path d={`M14.5,${8.5 - bob} Q18,${5 - bob} 21.5,${8.5 - bob} Z`} fill="#d97706" />
                  <polygon points={`17,${5 - bob} 19,${1 - bob} 19.5,${5 - bob}`} fill="#38bdf8" />
                  {/* Tide trident / harpoon lance */}
                  <line x1={18 - facing * 5} y1={16 - bob} x2={18 + facing * 15} y2={6 - bob} stroke="#78350f" strokeWidth="1.5" />
                  <polygon points={`${18 + facing * 15},${5 - bob} ${18 + facing * 18},${5 - bob} ${18 + facing * 15},${8 - bob}`} fill="#38bdf8" />
                  <polygon points={`${18 + facing * 10},${8 - bob} ${18 + facing * 15},${6 - bob} ${18 + facing * 10},${11 - bob}`} fill="#06b6d4" />
                  {/* Shell shield on flank */}
                  <circle cx={18 - facing * 2} y={17 - bob} r="2.8" fill="#115e59" stroke="#14b8a6" strokeWidth="0.8" />
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
              // Cedar Hearthguard: ironwood & blackened iron plate, bear mantle, antlered helm, oak-leaf shield, broadsword
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Heavy greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#292524" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#1c1917" />
                  {/* Ironwood & blackened plate cuirass */}
                  <rect x="14" y={17 - bob} width="8" height="9" rx="1" fill="#36220f" />
                  <rect x="14.5" y={18 - bob} width="7" height="4" fill="#52525b" />
                  {/* Bear-fur collar */}
                  <polygon points={`13,${16 - bob} 23,${16 - bob} 24,${20 - bob} 18,${21 - bob} 12,${20 - bob}`} fill="#4a3728" />
                  {/* Antlered nasal helm */}
                  <rect x="14.5" y={10 - bob} width="7" height="6.5" rx="1" fill="#52525b" />
                  <rect x={18 - (facing > 0 ? 1 : 3)} y={13.5 - bob} width="4" height="1.2" fill="#18181b" />
                  {/* Antler crest */}
                  <polygon points={`14,${10 - bob} 12,${5 - bob} 14.5,${7 - bob}`} fill="#78350f" />
                  <polygon points={`22,${10 - bob} 24,${5 - bob} 21.5,${7 - bob}`} fill="#78350f" />
                  {/* Cedar shield with oak leaf emblem */}
                  <polygon points={`${18 - facing * 2},${17 - bob + armSwing} ${18 - facing * 8},${17 - bob + armSwing} ${18 - facing * 8},${26 - bob + armSwing} ${18 - facing * 5},${30 - bob + armSwing} ${18 - facing * 2},${26 - bob + armSwing}`} fill="#78350f" stroke="#2d4a22" strokeWidth="1" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="2" fill="#2d4a22" />
                  <polygon points={`${18 - facing * 5},${20.5 - bob + armSwing} ${18 - facing * 5 - 1.2},${23 - bob + armSwing} ${18 - facing * 5 + 1.2},${23 - bob + armSwing}`} fill="#eab308" />
                  {/* Broadsword */}
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={9 - bob + armSwing} stroke="#cbd5e1" strokeWidth="1.8" />
                  <line x1={18 + facing * 2.5} y1={22 - bob + armSwing} x2={18 + facing * 7.5} y2={22 - bob + armSwing} stroke="#5c3818" strokeWidth="1.5" />
                  <circle cx={18 + facing * 5} cy={27 - bob + armSwing} r="1" fill="#22c55e" />
                </g>
              );
            }
            case "sand": {
              // Mamluk Champion: gilded chahar-aina cuirass, turban-helmet with aventail, sunburst sipar shield, shamshir
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Gilded greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#d97706" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#b45309" />
                  {/* Crimson mail & gold mirror plate */}
                  <rect x="14" y={17 - bob} width="8" height="9" rx="1" fill="#991b1b" />
                  <rect x="15" y={18 - bob} width="6" height="5" rx="1" fill="#f59e0b" stroke="#facc15" strokeWidth="0.5" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#facc15" />
                  {/* Conical turban-helmet with spike */}
                  <rect x="14.5" y={11 - bob} width="7" height="5.5" rx="1" fill="#cbd5e1" />
                  <line x1="14" y1={14 - bob} x2="22" y2={14 - bob} stroke="#64748b" strokeWidth="1.2" />
                  <line x1="18" y1={11 - bob} x2="18" y2={7 - bob} stroke="#facc15" strokeWidth="1.4" />
                  <rect x="14" y={9.5 - bob} width="8" height="2" rx="0.5" fill="#fde68a" />
                  {/* Sunburst sipar shield */}
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="5" fill="#d97706" stroke="#facc15" strokeWidth="1" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="2.2" fill="#facc15" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="1" fill="#991b1b" />
                  {/* Curved shamshir sword */}
                  <path d={`M${18 + facing * 4.5} ${25 - bob + armSwing} Q${18 + facing * 5} ${17 - bob + armSwing} ${18 + facing * 8} ${10 - bob + armSwing}`} stroke="#f8fafc" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 6.5} y2={23 - bob + armSwing} stroke="#eab308" strokeWidth="1.4" />
                </g>
              );
            }
            case "steppe": {
              // Steppe Kheshig: steel & leather lamellar armor, fluted spangenhelm, teardrop shield with tamga, kilij saber
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Splint greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#334155" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#1e293b" />
                  {/* Lamellar coat of plates */}
                  <rect x="14" y={17 - bob} width="8" height="9.5" rx="1" fill="#1e293b" />
                  <line x1="14" y1={19 - bob} x2="22" y2={19 - bob} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="1.5 1" />
                  <line x1="14" y1={21 - bob} x2="22" y2={21 - bob} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="1.5 1" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#ca8a04" />
                  {/* Fluted spangenhelm with horsehair plume */}
                  <polygon points={`14,${12 - bob} 18,${6 - bob} 22,${12 - bob}`} fill="#94a3b8" stroke="#475569" strokeWidth="0.5" />
                  <rect x="14" y={11 - bob} width="8" height="2" fill="#ca8a04" />
                  <path d={`M18,${6 - bob} Q${18 - facing * 3},${3 - bob} ${18 - facing * 5},${8 - bob}`} stroke="#dc2626" strokeWidth="1.8" fill="none" />
                  {/* Steppe cavalry shield with golden tamga */}
                  <ellipse cx={18 - facing * 5} cy={22 - bob + armSwing} rx="4.5" ry="5.5" fill="#78350f" stroke="#ca8a04" strokeWidth="1" />
                  <circle cx={18 - facing * 5} cy={22 - bob + armSwing} r="2" fill="#ca8a04" />
                  <line x1={18 - facing * 5} y1={20 - bob + armSwing} x2={18 - facing * 5} y2={24 - bob + armSwing} stroke="#1e293b" strokeWidth="1" />
                  {/* Kilij saber with ring guard */}
                  <path d={`M${18 + facing * 4.5} ${26 - bob + armSwing} Q${18 + facing * 5} ${18 - bob + armSwing} ${18 + facing * 7.5} ${10 - bob + armSwing}`} stroke="#f1f5f9" strokeWidth="1.8" fill="none" />
                  <line x1={18 + facing * 2.5} y1={23 - bob + armSwing} x2={18 + facing * 6.5} y2={23 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.4" />
                </g>
              );
            }
            case "islands": {
              // Island Tide Sentinel: pearl-shell cuirass, sea-crested helm with plumage, octagonal shield, shark-tooth sword
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Shell greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#0f766e" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#115e59" />
                  {/* Pearl-shell & woven fiber cuirass */}
                  <rect x="14" y={17 - bob} width="8" height="9" rx="1" fill="#0f766e" />
                  <rect x="15" y={18 - bob} width="6" height="5" rx="1" fill="#e2e8f0" stroke="#2dd4bf" strokeWidth="0.8" />
                  <rect x="13.5" y={22 - bob} width="9" height="1.8" fill="#ca8a04" />
                  {/* Sea-crested helm with seabird plume */}
                  <rect x="14.5" y={11 - bob} width="7" height="5.5" rx="1" fill="#78350f" />
                  <polygon points={`16,${11 - bob} 18,${4 - bob} 20,${11 - bob}`} fill="#14b8a6" />
                  <polygon points={`18,${4 - bob} ${18 - facing * 2},${1 - bob} 18,${3 - bob}`} fill="#38bdf8" />
                  {/* Octagonal sea-oak shield with wave spiral */}
                  <polygon points={`${18 - facing * 3},${17 - bob + armSwing} ${18 - facing * 7},${17 - bob + armSwing} ${18 - facing * 9},${20 - bob + armSwing} ${18 - facing * 9},${25 - bob + armSwing} ${18 - facing * 7},${28 - bob + armSwing} ${18 - facing * 3},${28 - bob + armSwing} ${18 - facing * 1},${25 - bob + armSwing} ${18 - facing * 1},${20 - bob + armSwing}`} fill="#115e59" stroke="#38bdf8" strokeWidth="0.8" />
                  <circle cx={18 - facing * 5} cy={22.5 - bob + armSwing} r="2" fill="#38bdf8" />
                  <circle cx={18 - facing * 5} cy={22.5 - bob + armSwing} r="1" fill="#99f6e4" />
                  {/* Shark-tooth broadsword (leiomano) */}
                  <line x1={18 + facing * 5} y1={26 - bob + armSwing} x2={18 + facing * 5} y2={10 - bob + armSwing} stroke="#78350f" strokeWidth="2.2" />
                  <line x1={18 + facing * 4} y1={22 - bob + armSwing} x2={18 + facing * 6} y2={22 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.5" />
                  {/* White shark teeth studs along blade edge */}
                  <line x1={18 + facing * 6.5} y1={12 - bob + armSwing} x2={18 + facing * 6.5} y2={20 - bob + armSwing} stroke="#f8fafc" strokeWidth="1" strokeDasharray="1.5 1.5" />
                </g>
              );
            }
          }
        }

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
        if (!isDefaultCulture) {
          switch (kit) {
            case "cedar": {
              // Cedar log trebuchet: peeled pine chassis, solid disc wheels, hemp-lashed A-frame, river-stone cage
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  {/* Rough disc wheels */}
                  <circle cx="8" cy={27 - bob} r="4.5" fill="#5c3818" stroke="#36220f" strokeWidth="1" />
                  <circle cx="28" cy={27 - bob} r="4.5" fill="#5c3818" stroke="#36220f" strokeWidth="1" />
                  <circle cx="8" cy={27 - bob} r="1.3" fill="#ca8a04" />
                  <circle cx="28" cy={27 - bob} r="1.3" fill="#ca8a04" />
                  {/* Heavy log chassis */}
                  <rect x="5" y={21 - bob} width="26" height="5.5" rx="1" fill="#4a3728" stroke="#24170b" strokeWidth="0.8" />
                  {/* Pine branch camouflage */}
                  <polygon points={`7,${21 - bob} 11,${18 - bob} 15,${21 - bob}`} fill="#2d4a22" />
                  <polygon points={`21,${21 - bob} 25,${18 - bob} 29,${21 - bob}`} fill="#2d4a22" />
                  {/* Cedar A-frame with rope lashings */}
                  <polygon points={`11,${21 - bob} 18,${7 - bob} 25,${21 - bob}`} stroke="#78350f" strokeWidth="2.4" fill="none" />
                  <line x1="15" y1={13 - bob} x2="21" y2={13 - bob} stroke="#d97706" strokeWidth="1.2" />
                  {/* Log throwing arm & river-stone basket */}
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#36220f" strokeWidth="2.8" />
                  <rect x={18 - facing * 14} y={16 - bob - armTilt} width="5" height="5" fill="#574130" stroke="#36220f" strokeWidth="0.6" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3.2" fill="#94a3b8" />
                </g>
              );
            }
            case "sand": {
              // Desert mangonel: sun-bleached frame, bronze spoked wheels, arched struts, Greek fire pot
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  {/* Bronze spoked wheels */}
                  <circle cx="8" cy={27 - bob} r="4.5" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                  <circle cx="28" cy={27 - bob} r="4.5" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                  <circle cx="8" cy={27 - bob} r="1.3" fill="#fde68a" />
                  <circle cx="28" cy={27 - bob} r="1.3" fill="#fde68a" />
                  {/* Desert timber chassis */}
                  <rect x="5" y={21 - bob} width="26" height="5.5" rx="1" fill="#a16207" stroke="#78350f" strokeWidth="0.8" />
                  <rect x="7" y={22 - bob} width="22" height="2" fill="#b45309" />
                  {/* Horseshoe-arched strut tower */}
                  <path d={`M11,${21 - bob} Q18,${5 - bob} 25,${21 - bob}`} stroke="#d97706" strokeWidth="2.2" fill="none" />
                  <line x1="18" y1={7 - bob} x2="18" y2={21 - bob} stroke="#f59e0b" strokeWidth="1.2" />
                  {/* Throwing arm & flaming Greek fire pot */}
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#78350f" strokeWidth="2.4" />
                  <rect x={18 - facing * 14} y={16 - bob - armTilt} width="5" height="5" rx="1" fill="#b91c1c" />
                  {/* Flaming oil pot with glowing core */}
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill="#dc2626" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="1.6" fill="#fb923c" />
                  {/* Crimson pennon */}
                  <polygon points={`18,${7 - bob} 23,${5 - bob} 18,${9 - bob}`} fill="#dc2626" />
                </g>
              );
            }
            case "steppe": {
              // Steppe war arba: high-wheeled nomad siege cart, birch pylons, horsehair battle knot, traction beam
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  {/* High wooden spoked wheels */}
                  <circle cx="8" cy={27 - bob} r="5" fill="#451a03" stroke="#78350f" strokeWidth="1" />
                  <circle cx="28" cy={27 - bob} r="5" fill="#451a03" stroke="#78350f" strokeWidth="1" />
                  <line x1="8" y1={22 - bob} x2="8" y2={32 - bob} stroke="#a16207" strokeWidth="0.8" />
                  <line x1="28" y1={22 - bob} x2="28" y2={32 - bob} stroke="#a16207" strokeWidth="0.8" />
                  <circle cx="8" cy={27 - bob} r="1.2" fill="#ca8a04" />
                  <circle cx="28" cy={27 - bob} r="1.2" fill="#ca8a04" />
                  {/* Arba cart frame */}
                  <rect x="5" y={21 - bob} width="26" height="5" rx="0.5" fill="#6b3a19" stroke="#36220f" strokeWidth="0.8" />
                  {/* Birch pylon A-frame */}
                  <polygon points={`11,${21 - bob} 18,${7 - bob} 25,${21 - bob}`} stroke="#78350f" strokeWidth="2.2" fill="none" />
                  {/* Horsehair battle knot */}
                  <rect x="17" y={7 - bob} width="2" height="3" fill="#18181b" />
                  <polygon points={`17,${10 - bob} 16,${14 - bob} 19,${10 - bob}`} fill="#dc2626" />
                  {/* Heavy traction throwing beam */}
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#3f2413" strokeWidth="2.6" />
                  {/* Sandbag counterweight bundle */}
                  <ellipse cx={18 - facing * 12} cy={18 - bob - armTilt} rx="2.5" ry="3.5" fill="#475569" />
                  {/* Granite boulder */}
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill="#f1f5f9" />
                </g>
              );
            }
            case "islands": {
              // Island shore catapult: bamboo & driftwood catamaran on rollers, sennit cords, fiery pumice stone
              return (
                <g>
                  <ellipse cx="18" cy="31" rx="14" ry="2.8" fill="#000000" fillOpacity="0.35" />
                  {/* Bone/coral rollers */}
                  <ellipse cx="8" cy={28 - bob} rx="4" ry="3" fill="#0f766e" stroke="#14b8a6" strokeWidth="0.8" />
                  <ellipse cx="28" cy={28 - bob} rx="4" ry="3" fill="#0f766e" stroke="#14b8a6" strokeWidth="0.8" />
                  <circle cx="8" cy={28 - bob} r="1.2" fill="#e2e8f0" />
                  <circle cx="28" cy={28 - bob} r="1.2" fill="#e2e8f0" />
                  {/* Bamboo catamaran chassis */}
                  <rect x="5" y={22 - bob} width="26" height="4.5" rx="1" fill="#0d9488" stroke="#042f2e" strokeWidth="0.8" />
                  <line x1="6" y1={24 - bob} x2="30" y2={24 - bob} stroke="#ca8a04" strokeWidth="1" />
                  {/* Double-bamboo A-frame with sennit lashings */}
                  <polygon points={`11,${22 - bob} 18,${7 - bob} 25,${22 - bob}`} stroke="#eab308" strokeWidth="2.2" fill="none" />
                  <line x1="14" y1={14 - bob} x2="22" y2={14 - bob} stroke="#0284c7" strokeWidth="1.2" />
                  {/* Mangrove throwing beam & volcanic pumice */}
                  <line x1={18 - facing * 12} y1={19 - bob - armTilt} x2={18 + facing * 12} y2={3 - bob + armTilt} stroke="#78350f" strokeWidth="2.4" />
                  {/* Shell counterweight crate */}
                  <rect x={18 - facing * 14} y={16 - bob - armTilt} width="5" height="5" fill="#115e59" stroke="#0284c7" strokeWidth="0.8" />
                  {/* Glowing volcanic pumice stone */}
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="3" fill="#f97316" />
                  <circle cx={18 + facing * 12} cy={3 - bob + armTilt} r="1.5" fill="#fef08a" />
                  {/* Turquoise wind-vane */}
                  <polygon points={`18,${7 - bob} 22,${5 - bob} 18,${9 - bob}`} fill="#38bdf8" />
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
              // Cedar High Chieftain: verdigris bronze & ironwood plate, antler crown with emerald, bear mantle, radiant emerald blade
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Bronze greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#36220f" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#24170b" />
                  {/* Verdigris bronze & ironwood cuirass */}
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#1e3a2b" />
                  <rect x="14.5" y={17 - bob} width="7" height="3" fill="#ca8a04" />
                  {/* Antler crown with glowing emerald */}
                  <rect x="15" y={10 - bob} width="6" height="6" rx="1" fill="#ca8a04" />
                  <polygon points={`13,${10 - bob} 11,${4 - bob} 14,${7 - bob}`} fill="#78350f" />
                  <polygon points={`23,${10 - bob} 25,${4 - bob} 22,${7 - bob}`} fill="#78350f" />
                  <circle cx="18" cy={12 - bob} r="1.4" fill="#22c55e" />
                  {/* Radiant emerald greatsword with white blade core */}
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#4ade80" strokeWidth="2.6" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#ffffff" strokeWidth="1.2" />
                  <line x1={18 + facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 8} y2={23 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.6" />
                  {/* Flowing bear-fur & moss-green mantle */}
                  <polygon points={`${18 - facing * 3},${17 - bob} ${18 - facing * 8},${28 - bob} ${18 - facing * 1.5},${27 - bob}`} fill="#14532d" opacity="0.9" />
                  <rect x={18 - facing * 4} y={16 - bob} width="4" height="2" fill="#4a3728" />
                </g>
              );
            }
            case "sand": {
              // Desert Sultan / Sun Warden: gold mirror plate, turban-crown with ruby aigrette, sun-scimitar, crimson mantle
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Gilded greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#d97706" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#b45309" />
                  {/* Crimson silk robes & gold-damascened breastplate */}
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#991b1b" />
                  <rect x="14.5" y={17 - bob} width="7" height="4" fill="#f59e0b" />
                  <circle cx="18" cy={19 - bob} r="1.3" fill="#fef08a" />
                  {/* Turban-crown with ruby aigrette */}
                  <rect x="14.5" y={9.5 - bob} width="7" height="5" rx="1" fill="#fef3c7" />
                  <rect x="14" y={12 - bob} width="8" height="2" fill="#facc15" />
                  <line x1="18" y1={9.5 - bob} x2="18" y2={5 - bob} stroke="#facc15" strokeWidth="1.2" />
                  <circle cx="18" cy={5 - bob} r="1.5" fill="#dc2626" />
                  {/* Blazing sun-scimitar with golden flame glow */}
                  <path d={`M${18 + facing * 4.5} ${27 - bob + armSwing} Q${18 + facing * 5} ${15 - bob + armSwing} ${18 + facing * 8.5} ${3 - bob + armSwing}`} stroke="#facc15" strokeWidth="2.6" fill="none" />
                  <path d={`M${18 + facing * 4.5} ${27 - bob + armSwing} Q${18 + facing * 5} ${15 - bob + armSwing} ${18 + facing * 8.5} ${3 - bob + armSwing}`} stroke="#ffffff" strokeWidth="1.2" fill="none" />
                  <line x1={18 + facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 7} y2={23 - bob + armSwing} stroke="#eab308" strokeWidth="1.6" />
                  {/* Flowing royal crimson mantle with golden hem */}
                  <polygon points={`${18 - facing * 3},${17 - bob} ${18 - facing * 8.5},${28 - bob} ${18 - facing * 1.5},${27 - bob}`} fill="#b91c1c" opacity="0.95" />
                  <line x1={18 - facing * 8.5} y1={28 - bob} x2={18 - facing * 1.5} y2={27 - bob} stroke="#facc15" strokeWidth="1" />
                </g>
              );
            }
            case "steppe": {
              // Steppe Khagan: imperial gold lamellar cuirass, winged falcon crown with plume, Tengri sky-cape, lightning saber
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Splint greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#334155" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#1e293b" />
                  {/* Blackened steel & imperial gold lamellar cuirass */}
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#1e293b" />
                  <rect x="14" y={17 - bob} width="8" height="3" fill="#f59e0b" />
                  <circle cx="18" cy={20 - bob} r="1.3" fill="#38bdf8" />
                  {/* Great Khagan falcon crown */}
                  <rect x="15" y={10 - bob} width="6" height="6" rx="1" fill="#f59e0b" />
                  <polygon points={`13.5,${9 - bob} 11,${4 - bob} 15,${6 - bob}`} fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                  <polygon points={`22.5,${9 - bob} 25,${4 - bob} 21,${6 - bob}`} fill="#fde047" stroke="#ca8a04" strokeWidth="0.5" />
                  <path d={`M18,${10 - bob} Q${18 - facing * 3},${6 - bob} ${18 - facing * 5},${11 - bob}`} stroke="#dc2626" strokeWidth="1.8" fill="none" />
                  {/* Radiant saber of the Khans with lightning blue glow */}
                  <path d={`M${18 + facing * 4.5} ${27 - bob + armSwing} Q${18 + facing * 5} ${16 - bob + armSwing} ${18 + facing * 8} ${4 - bob + armSwing}`} stroke="#38bdf8" strokeWidth="2.6" fill="none" />
                  <path d={`M${18 + facing * 4.5} ${27 - bob + armSwing} Q${18 + facing * 5} ${16 - bob + armSwing} ${18 + facing * 8} ${4 - bob + armSwing}`} stroke="#ffffff" strokeWidth="1.2" fill="none" />
                  <line x1={18 + facing * 2} y1={23 - bob + armSwing} x2={18 + facing * 7} y2={23 - bob + armSwing} stroke="#ca8a04" strokeWidth="1.6" />
                  {/* Tengri sky-cape with wolf-fur collar */}
                  <polygon points={`${18 - facing * 3},${17 - bob} ${18 - facing * 8.5},${28 - bob} ${18 - facing * 1.5},${27 - bob}`} fill="#0284c7" opacity="0.95" />
                  <rect x={18 - facing * 4} y={16 - bob} width="4" height="2" fill="#e2c8a2" />
                </g>
              );
            }
            case "islands": {
              // Island Tide Sovereign: mother-of-pearl cuirass, ray crown with kingfisher plumage, aqua tidestrike trident, foam-teal cloak
              return (
                <g>
                  <ellipse cx="18" cy="30" rx="8" ry="2.2" fill="#000000" fillOpacity="0.35" />
                  {/* Shell greaves */}
                  <rect x={18 + legL * facing} y={26 - bob} width="2.8" height="4" fill="#0f766e" />
                  <rect x={18 + legR * facing} y={26 - bob} width="2.8" height="4" fill="#115e59" />
                  {/* Mother-of-pearl scale cuirass with coral gems */}
                  <rect x="14.5" y={17 - bob} width="7" height="9" rx="1" fill="#0f766e" />
                  <rect x="15" y={18 - bob} width="6" height="5" rx="1" fill="#f1f5f9" stroke="#06b6d4" strokeWidth="0.8" />
                  <circle cx="18" cy={20 - bob} r="1.2" fill="#f43f5e" />
                  {/* Ray crown of pearls & kingfisher feathers */}
                  <rect x="15" y={10 - bob} width="6" height="6" rx="1" fill="#ca8a04" />
                  <polygon points={`14,${10 - bob} 15.5,${4 - bob} 18,${7 - bob} 20.5,${4 - bob} 22,${10 - bob}`} fill="#facc15" />
                  <circle cx="15.5" cy={4 - bob} r="1" fill="#0ea5e9" />
                  <circle cx="20.5" cy={4 - bob} r="1" fill="#0ea5e9" />
                  <circle cx="18" cy={7 - bob} r="1.1" fill="#f8fafc" />
                  {/* Luminous Tidestrike trident crackling with aqua energy */}
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#22d3ee" strokeWidth="2.6" />
                  <line x1={18 + facing * 5} y1={27 - bob + armSwing} x2={18 + facing * 5} y2={3 - bob + armSwing} stroke="#ffffff" strokeWidth="1.2" />
                  {/* Trident prongs */}
                  <line x1={18 + facing * 3} y1={6 - bob + armSwing} x2={18 + facing * 7} y2={6 - bob + armSwing} stroke="#eab308" strokeWidth="1.6" />
                  <line x1={18 + facing * 3} y1={6 - bob + armSwing} x2={18 + facing * 3} y2={2 - bob + armSwing} stroke="#22d3ee" strokeWidth="1.4" />
                  <line x1={18 + facing * 7} y1={6 - bob + armSwing} x2={18 + facing * 7} y2={2 - bob + armSwing} stroke="#22d3ee" strokeWidth="1.4" />
                  {/* Flowing seafoam-teal cloak */}
                  <polygon points={`${18 - facing * 3},${17 - bob} ${18 - facing * 8.5},${28 - bob} ${18 - facing * 1.5},${27 - bob}`} fill="#0d9488" opacity="0.95" />
                  <line x1={18 - facing * 8.5} y1={28 - bob} x2={18 - facing * 1.5} y2={27 - bob} stroke="#ccfbf1" strokeWidth="1" />
                </g>
              );
            }
          }
        }

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


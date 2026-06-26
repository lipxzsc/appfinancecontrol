import { useEffect, useState } from "react";

interface Props {
  /** true = eyes open (password visible) */
  open: boolean;
  /** focused/typing — peeks side to side */
  typing?: boolean;
  size?: number;
}

/**
 * Cute pastel mascot. Blinks while password is hidden, peeks while typing,
 * opens its eyes wide when the user clicks "mostrar senha".
 */
export function EyeCharacter({ open, typing, size = 88 }: Props) {
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState(0); // -1, 0, 1

  useEffect(() => {
    if (open) return;
    const t = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200 + Math.random() * 1500);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!typing || !open) {
      setLook(0);
      return;
    }
    const t = setInterval(() => setLook((Math.random() > 0.5 ? 1 : -1)), 900);
    return () => clearInterval(t);
  }, [typing, open]);

  const eyeOpenY = blink ? 1 : 7;
  const pupilX = 4 + look * 1.8;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="ec-face" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="var(--pastel-yellow)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--pastel-pink)" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      {/* face */}
      <circle cx="60" cy="62" r="44" fill="url(#ec-face)" />
      <circle cx="60" cy="62" r="44" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
      {/* cheeks */}
      <circle cx="34" cy="74" r="6" fill="var(--pastel-pink)" opacity="0.55" />
      <circle cx="86" cy="74" r="6" fill="var(--pastel-pink)" opacity="0.55" />

      {/* hands covering eyes when closed */}
      <g style={{ transition: "transform .35s cubic-bezier(.5,1.6,.4,1)", transformOrigin: "60px 62px", transform: open ? "translateY(28px)" : "translateY(0)" }}>
        <ellipse cx="42" cy="58" rx="16" ry="13" fill="var(--pastel-blue)" stroke="rgba(0,0,0,.15)" strokeWidth="1.3" />
        <ellipse cx="78" cy="58" rx="16" ry="13" fill="var(--pastel-blue)" stroke="rgba(0,0,0,.15)" strokeWidth="1.3" />
        {/* finger gap */}
        {!open && (
          <>
            <path d="M36 58 q6 -2 12 0" stroke="rgba(0,0,0,.25)" strokeWidth="1" fill="none" />
            <path d="M72 58 q6 -2 12 0" stroke="rgba(0,0,0,.25)" strokeWidth="1" fill="none" />
          </>
        )}
      </g>

      {/* eyes (visible when open) */}
      <g style={{ opacity: open ? 1 : 0, transition: "opacity .25s .15s" }}>
        <ellipse cx="44" cy="56" rx="7" ry={eyeOpenY} fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth="1.2" />
        <ellipse cx="76" cy="56" rx="7" ry={eyeOpenY} fill="#fff" stroke="rgba(0,0,0,.35)" strokeWidth="1.2" />
        {!blink && (
          <>
            <circle cx={44 + (pupilX - 4)} cy="57" r="2.6" fill="#222" />
            <circle cx={76 + (pupilX - 4)} cy="57" r="2.6" fill="#222" />
            <circle cx={44 + (pupilX - 4) - 0.8} cy="56" r="0.9" fill="#fff" />
            <circle cx={76 + (pupilX - 4) - 0.8} cy="56" r="0.9" fill="#fff" />
          </>
        )}
      </g>

      {/* mouth */}
      <path
        d={open ? "M48 80 Q60 92 72 80" : "M50 82 Q60 76 70 82"}
        stroke="rgba(0,0,0,.55)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        style={{ transition: "d .3s" }}
      />
    </svg>
  );
}
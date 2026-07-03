import { useEffect, useRef, useState } from "react";

interface Props {
  /** true = olhos abertos (senha visível) */
  open: boolean;
  /** foco/digitando — se mexe mais */
  typing?: boolean;
  size?: number;
}

/**
 * Mascote pastel super animadinho.
 * - Respira (breathe scale)
 * - Balança de leve o tempo todo (idle sway)
 * - Pisca em intervalos aleatórios + pisca duplo ocasional
 * - Espia quando você digita (ergue as mãos e espicha os olhos)
 * - Solta faíscas de alegria quando você mostra a senha
 * - Boca reage: sorrisão ao mostrar, biquinho ao esconder, "o" ao digitar
 */
export function EyeCharacter({ open, typing, size = 96 }: Props) {
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState(0); // -1, 0, 1
  const [wave, setWave] = useState(false); // acena quando abre
  const sparkRef = useRef(0);
  const [, force] = useState(0);

  // pisca
  useEffect(() => {
    if (open) return;
    let cancelled = false;
    async function loop() {
      while (!cancelled) {
        await wait(2200 + Math.random() * 1800);
        if (cancelled) return;
        setBlink(true);
        await wait(130);
        setBlink(false);
        if (Math.random() > 0.65) {
          await wait(110);
          setBlink(true);
          await wait(130);
          setBlink(false);
        }
      }
    }
    loop();
    return () => {
      cancelled = true;
    };
  }, [open]);

  // olha pros lados quando está digitando
  useEffect(() => {
    if (!typing) {
      setLook(0);
      return;
    }
    const t = setInterval(() => setLook(Math.random() > 0.5 ? 1 : -1), 650);
    return () => clearInterval(t);
  }, [typing]);

  // acena ao abrir
  useEffect(() => {
    if (!open) return;
    setWave(true);
    sparkRef.current = Date.now();
    force((n) => n + 1);
    const t = setTimeout(() => setWave(false), 900);
    return () => clearTimeout(t);
  }, [open]);

  const eyeOpenY = blink ? 1 : typing ? 8 : 6.5;
  const pupilX = look * 2;

  const mouthPath = open
    ? typing
      ? "M55 82 Q60 88 65 82" // "o" pequeno
      : "M46 78 Q60 96 74 78" // sorrisão
    : typing
      ? "M52 82 Q60 78 68 82" // sorrisinho tímido
      : "M52 84 Q60 78 68 84"; // biquinho

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        animation: "ec-breathe 3.4s ease-in-out infinite",
      }}
    >
      <style>{keyframes}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        aria-hidden
        style={{
          display: "block",
          animation: "ec-sway 5s ease-in-out infinite",
        }}
      >
        <defs>
          <radialGradient id="ec-face" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="var(--pastel-yellow)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--pastel-pink)" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="ec-hand" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="var(--pastel-blue)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--pastel-purple, #c9b8ff)" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* faíscas ao abrir */}
        {open && wave && (
          <g style={{ animation: "ec-spark 0.9s ease-out forwards" }}>
            <circle cx="20" cy="30" r="2" fill="var(--pastel-yellow)" />
            <circle cx="100" cy="28" r="2.5" fill="var(--pastel-pink)" />
            <circle cx="14" cy="70" r="1.6" fill="var(--pastel-blue)" />
            <circle cx="106" cy="72" r="2" fill="var(--pastel-yellow)" />
          </g>
        )}

        {/* face */}
        <circle cx="60" cy="62" r="44" fill="url(#ec-face)" />
        <circle cx="60" cy="62" r="44" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />

        {/* cheeks */}
        <circle cx="32" cy="74" r="6.5" fill="var(--pastel-pink)" opacity="0.6" />
        <circle cx="88" cy="74" r="6.5" fill="var(--pastel-pink)" opacity="0.6" />

        {/* mãos cobrindo os olhos quando fechado */}
        <g
          style={{
            transition: "transform .45s cubic-bezier(.5,1.6,.4,1)",
            transformOrigin: "60px 62px",
            transform: open
              ? `translateY(34px) rotate(${wave ? -8 : 0}deg)`
              : typing
                ? "translateY(-3px)"
                : "translateY(0)",
          }}
        >
          <g style={{ animation: open && wave ? "ec-wave 0.6s ease-in-out 2" : undefined, transformOrigin: "60px 60px" }}>
            <ellipse cx="42" cy="58" rx="16" ry="13" fill="url(#ec-hand)" stroke="rgba(0,0,0,.18)" strokeWidth="1.3" />
            <ellipse cx="78" cy="58" rx="16" ry="13" fill="url(#ec-hand)" stroke="rgba(0,0,0,.18)" strokeWidth="1.3" />
            {!open && (
              <>
                <path d="M36 58 q6 -2 12 0" stroke="rgba(0,0,0,.25)" strokeWidth="1" fill="none" />
                <path d="M72 58 q6 -2 12 0" stroke="rgba(0,0,0,.25)" strokeWidth="1" fill="none" />
              </>
            )}
          </g>
        </g>

        {/* olhos */}
        <g style={{ opacity: open ? 1 : 0, transition: "opacity .25s .18s" }}>
          <ellipse cx="44" cy="56" rx="7.5" ry={eyeOpenY} fill="#fff" stroke="rgba(0,0,0,.4)" strokeWidth="1.2" />
          <ellipse cx="76" cy="56" rx="7.5" ry={eyeOpenY} fill="#fff" stroke="rgba(0,0,0,.4)" strokeWidth="1.2" />
          {!blink && (
            <>
              <circle cx={44 + pupilX} cy="57" r="2.8" fill="#222" style={{ transition: "cx .25s" }} />
              <circle cx={76 + pupilX} cy="57" r="2.8" fill="#222" style={{ transition: "cx .25s" }} />
              <circle cx={44 + pupilX - 0.9} cy="55.8" r="1" fill="#fff" />
              <circle cx={76 + pupilX - 0.9} cy="55.8" r="1" fill="#fff" />
            </>
          )}
        </g>

        {/* sobrancelhas quando digita */}
        {typing && open && (
          <g stroke="rgba(0,0,0,.55)" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M37 44 q7 -3 14 0" />
            <path d="M69 44 q7 -3 14 0" />
          </g>
        )}

        {/* boca */}
        <path
          d={mouthPath}
          stroke="rgba(0,0,0,.6)"
          strokeWidth="2.2"
          fill={open && !typing ? "rgba(255,120,140,.45)" : "none"}
          strokeLinecap="round"
          style={{ transition: "d .3s" }}
        />
      </svg>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const keyframes = `
@keyframes ec-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
@keyframes ec-sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
@keyframes ec-wave { 0%,100% { transform: rotate(0); } 50% { transform: rotate(6deg); } }
@keyframes ec-spark { 0% { opacity: 0; transform: scale(0.6); } 40% { opacity: 1; } 100% { opacity: 0; transform: scale(1.4); } }
`;
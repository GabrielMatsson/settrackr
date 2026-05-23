"use client"

import { useEffect } from "react"

type Props = { onDone: () => void }

export default function ChickenAnimation({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 7800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes chicken-walk {
          from { transform: translateX(110vw); }
          to   { transform: translateX(-200px); }
        }
        @keyframes chicken-waddle {
          0%, 100% { transform: rotate(-7deg) translateY(0px); }
          50%       { transform: rotate(7deg) translateY(-5px); }
        }
      `}</style>
      <div
        className="fixed bottom-24 left-0 z-50 pointer-events-none flex flex-col items-center gap-2"
        style={{ animation: "chicken-walk 7.5s linear forwards" }}
      >
        <div style={{ transform: "scaleX(-1)", transformOrigin: "center" }}>
          <svg
            viewBox="0 0 80 90"
            width="80"
            height="90"
            style={{ animation: "chicken-waddle 0.35s ease-in-out infinite", transformOrigin: "40px 80px", display: "block" }}
          >
            <ellipse cx="40" cy="56" rx="27" ry="22" fill="#F97316" />
            <ellipse cx="33" cy="55" rx="15" ry="9" fill="#EA580C" transform="rotate(-12 33 55)" />
            <circle cx="55" cy="30" r="17" fill="#F97316" />
            <circle cx="48" cy="16" r="5" fill="#DC2626" />
            <circle cx="56" cy="13" r="5.5" fill="#DC2626" />
            <circle cx="64" cy="16" r="4.5" fill="#DC2626" />
            <polygon points="72,30 67,24 67,36" fill="#FCD34D" />
            <circle cx="60" cy="27" r="4" fill="white" />
            <circle cx="61" cy="27" r="2" fill="#1f2937" />
            <ellipse cx="68" cy="37" rx="4" ry="5.5" fill="#DC2626" />
            <line x1="33" y1="76" x2="27" y2="88" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="49" y1="76" x2="54" y2="88" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="27" y1="88" x2="17" y2="88" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="27" y1="88" x2="27" y2="83" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="54" y1="88" x2="63" y2="88" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="54" y1="88" x2="54" y2="83" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
        >
          Kycklingben!
        </span>
      </div>
    </>
  )
}

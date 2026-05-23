"use client"

import { useEffect } from "react"

type Props = { onDone: () => void }

export default function GhostAnimation({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 9300)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <>
      <style>{`
        @keyframes ghost-float {
          from { transform: translateX(110vw); }
          to   { transform: translateX(-200px); }
        }
        @keyframes ghost-bob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
      `}</style>
      <div
        className="fixed bottom-24 left-0 z-50 pointer-events-none flex flex-col items-center gap-2"
        style={{ animation: "ghost-float 9s linear forwards" }}
      >
        <div style={{ animation: "ghost-bob 1.4s ease-in-out infinite" }}>
          <svg
            viewBox="0 0 70 90"
            width="70"
            height="90"
            style={{ display: "block" }}
          >
            <path
              d="M 8 48 C 8 18 20 5 35 5 C 50 5 62 18 62 48 L 62 72 Q 56 62 50 72 Q 44 82 38 72 Q 32 62 26 72 Q 20 82 14 72 Q 10 68 8 72 Z"
              fill="#a5b4fc"
              opacity="0.92"
            />
            <path
              d="M 8 48 C 8 18 20 5 35 5 C 50 5 62 18 62 48 L 62 72 Q 56 62 50 72 Q 44 82 38 72 Q 32 62 26 72 Q 20 82 14 72 Q 10 68 8 72 Z"
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              opacity="0.5"
            />
            <ellipse cx="24" cy="42" rx="6" ry="8" fill="#1e1b4b" />
            <ellipse cx="46" cy="42" rx="6" ry="8" fill="#1e1b4b" />
            <circle cx="26" cy="39" r="2.5" fill="white" />
            <circle cx="48" cy="39" r="2.5" fill="white" />
          </svg>
        </div>
        <span
          className="text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
          style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
        >
          Gymmet undrar om du lever...
        </span>
      </div>
    </>
  )
}

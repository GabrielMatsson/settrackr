import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #6366f1 0%, #4338ca 100%)",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Left outer plate */}
          <div style={{ width: 26, height: 84, background: "white", borderRadius: 6, boxShadow: "2px 0 6px rgba(0,0,0,0.2)" }} />
          {/* Left collar */}
          <div style={{ width: 13, height: 50, background: "rgba(255,255,255,0.8)" }} />
          {/* Bar */}
          <div style={{ width: 34, height: 11, background: "rgba(255,255,255,0.9)", borderRadius: 3 }} />
          {/* Right collar */}
          <div style={{ width: 13, height: 50, background: "rgba(255,255,255,0.8)" }} />
          {/* Right outer plate */}
          <div style={{ width: 26, height: 84, background: "white", borderRadius: 6, boxShadow: "-2px 0 6px rgba(0,0,0,0.2)" }} />
        </div>
      </div>
    ),
    { ...size }
  )
}

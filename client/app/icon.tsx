import { ImageResponse } from "next/og"

export const size = { width: 192, height: 192 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #6366f1 0%, #4338ca 100%)",
          borderRadius: "22%",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Left outer plate */}
          <div style={{ width: 28, height: 90, background: "white", borderRadius: 6, boxShadow: "2px 0 6px rgba(0,0,0,0.2)" }} />
          {/* Left collar */}
          <div style={{ width: 14, height: 54, background: "rgba(255,255,255,0.8)" }} />
          {/* Bar */}
          <div style={{ width: 36, height: 12, background: "rgba(255,255,255,0.9)", borderRadius: 3 }} />
          {/* Right collar */}
          <div style={{ width: 14, height: 54, background: "rgba(255,255,255,0.8)" }} />
          {/* Right outer plate */}
          <div style={{ width: 28, height: 90, background: "white", borderRadius: 6, boxShadow: "-2px 0 6px rgba(0,0,0,0.2)" }} />
        </div>
      </div>
    ),
    { ...size }
  )
}

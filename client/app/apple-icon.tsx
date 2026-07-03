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
          background: "#4f46e5",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 20, height: 68, background: "white", borderRadius: 4 }} />
          <div style={{ width: 52, height: 15, background: "white" }} />
          <div style={{ width: 20, height: 68, background: "white", borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}

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
          background: "#4f46e5",
          borderRadius: "20%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 22, height: 72, background: "white", borderRadius: 4 }} />
          <div style={{ width: 56, height: 16, background: "white" }} />
          <div style={{ width: 22, height: 72, background: "white", borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}

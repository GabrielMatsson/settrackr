import { ImageResponse } from "next/og"

// PWA manifest icons (192/512) — same barbell design as app/icon.tsx but on a
// full-square background (no rounded corners): the OS applies its own mask, so
// the artwork must bleed to the edges. Keep in sync with app/icon.tsx.

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }]
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const px = size === "512" ? 512 : 192
  // Scale the 192-based design up proportionally
  const s = px / 192

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
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Left outer plate */}
          <div style={{ width: 28 * s, height: 90 * s, background: "white", borderRadius: 6 * s, boxShadow: "2px 0 6px rgba(0,0,0,0.2)" }} />
          {/* Left collar */}
          <div style={{ width: 14 * s, height: 54 * s, background: "rgba(255,255,255,0.8)" }} />
          {/* Bar */}
          <div style={{ width: 36 * s, height: 12 * s, background: "rgba(255,255,255,0.9)", borderRadius: 3 * s }} />
          {/* Right collar */}
          <div style={{ width: 14 * s, height: 54 * s, background: "rgba(255,255,255,0.8)" }} />
          {/* Right outer plate */}
          <div style={{ width: 28 * s, height: 90 * s, background: "white", borderRadius: 6 * s, boxShadow: "-2px 0 6px rgba(0,0,0,0.2)" }} />
        </div>
      </div>
    ),
    { width: px, height: px }
  )
}

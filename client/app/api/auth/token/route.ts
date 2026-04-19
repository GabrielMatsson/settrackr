import { auth } from "@/auth"
import { SignJWT } from "jose"
import { NextResponse } from "next/server"

const secret = new TextEncoder().encode(process.env.AUTH_SECRET)

// Returns a plain HS256 JWT the FastAPI backend can verify.
// The frontend calls this once and uses the token for all API requests.
export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const token = await new SignJWT({
    sub: session.user.email,
    name: session.user.name ?? "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)

  return NextResponse.json({ token })
}

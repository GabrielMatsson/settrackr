import { auth } from "@/auth"
import ProfileClient from "./components/ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  return (
    <ProfileClient
      name={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
      image={session?.user?.image ?? null}
    />
  )
}

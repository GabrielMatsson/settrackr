import { auth } from "@/auth"
import HomeClient from "./components/HomeClient"

export default async function DashboardPage() {
  const session = await auth()
  return <HomeClient name={session?.user?.name ?? "där"} />
}

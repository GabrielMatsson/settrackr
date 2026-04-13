import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-8 bg-gray-900 border border-gray-800 rounded-2xl px-12 py-14 w-full max-w-sm shadow-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">SetTrackr</h1>
          <p className="text-gray-400 text-sm">Håll koll på din träning</p>
        </div>

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/dashboard" })
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg px-4 py-3 transition-colors"
          >
            Logga in med Google
          </button>
        </form>
      </div>
    </main>
  )
}

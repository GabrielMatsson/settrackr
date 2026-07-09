import { signIn } from "@/auth"
import LoginBackground from "./components/LoginBackground"
import LoginHero from "./components/LoginHero"

export default function LoginPage() {
  return (
    <div className="relative flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
      <LoginBackground />

      <div className="login-rise relative z-10 flex flex-col items-center gap-7 sm:gap-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl px-6 sm:px-12 py-9 sm:py-14 w-full max-w-sm shadow-xl">
        <LoginHero />

        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/dashboard" })
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg px-4 py-3 border border-gray-200 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden className="shrink-0">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            Logga in med Google
          </button>
        </form>
      </div>
    </div>
  )
}

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // Always show Google's account chooser so a user who logged out can pick
      // a different account instead of being silently signed back into the same
      // one (Google's SSO session otherwise auto-selects it).
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
})

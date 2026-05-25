import NextAuth, { type DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google" 

// Tell TypeScript about our custom session fields
declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    userId?: string 
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly"
        }
      }
    })
  ],
  session: {
    strategy: "jwt", // Force JWT strategy
  },
  callbacks: {
    async jwt({ token, account }) {
      // Save the access token
      if (account) {
        token.accessToken = account.access_token;
      }
      
      // Use Google's unique ID as the user ID for our database
      if (token.sub) {
        token.userId = token.sub;
      }
      
      return token;
    },
    
    async session({ session, token }: any) {
      // Pass the ID and token to the frontend session
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }
      
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      
      return session;
    }
  }
})
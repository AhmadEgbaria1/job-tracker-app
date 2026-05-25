import NextAuth, { type DefaultSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google" 

// --- הוסף את בלוק ההגדרות הזה כאן כדי לספר ל-TS על השדות החדשים ---
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
  }
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          // כאן הוספנו את ההרשאה לקריאת מיילים
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly"
        }
      }
    })
  ],
  callbacks: {
    // הפונקציה שלך שמעבירה את ה-ID
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      
      // כדי שתוכל להשתמש ב-API של גוגל אחר כך, אתה חייב להעביר את הטוקן לסשן
      if (token && (token as any).accessToken) {
        session.accessToken = (token as any).accessToken;
      }
      
      return session;
    },
    
    // אתה חייב גם את פונקציית ה-jwt כדי לתפוס את הטוקן שגוגל מחזירה ברגע ההתחברות
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    }
  }
})
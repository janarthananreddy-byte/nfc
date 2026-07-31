import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { logAudit } from "./audit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp:   { label: "OTP",   type: "text"  },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        const record = await prisma.otpToken.findFirst({
          where: {
            email:     credentials.email,
            otp:       credentials.otp,
            used:      false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!record) return null;

        await prisma.otpToken.update({ where: { id: record.id }, data: { used: true } });

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id   = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await logAudit({ actorEmail: user.email || "", action: "user_login", targetType: "user", targetId: user.id || "", targetLabel: user.email || "", details: "Signed in" });
    },
    async signOut({ token }) {
      await logAudit({ actorEmail: (token?.email as string) || "", action: "user_logout", targetType: "user", targetId: (token?.id as string) || "", targetLabel: (token?.email as string) || "", details: "Signed out" });
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
  session: { strategy: "jwt" },
};

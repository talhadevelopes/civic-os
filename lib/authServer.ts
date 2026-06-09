import { getServerSession } from "next-auth";

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) return null;

        // Handle Demo MLA Login
        if (email.startsWith("mla.") && email.endsWith("@civicos.demo")) {
          // Extract name: mla.first.last@civicos.demo -> "First Last"
          const namePart = email.split("@")[0].replace("mla.", "");
          const formattedName = namePart
            .split(".")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Dynamically create or find this MLA in the User table
          // This ensures foreign key constraints work for reports/comments/timeline
          let mlaUser = await prisma.user.findUnique({ where: { email } });

          if (!mlaUser) {
            mlaUser = await prisma.user.create({
              data: {
                name: formattedName,
                email: email,
                passwordHash: await bcrypt.hash("password123", 10),
                role: "AUTHORITY",
                authorityBody: "MLA",
              },
            });
          }

          return {
            id: mlaUser.id,
            name: mlaUser.name,
            email: mlaUser.email,
            role: mlaUser.role,
            authorityBody: mlaUser.authorityBody,
          } as any;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          authorityBody: user.authorityBody,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.authorityBody = (user as any).authorityBody ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).authorityBody = (token as any).authorityBody ?? null;
      }
      return session;
    },
  },
};

export function requireServerSession() {
  return getServerSession(authOptions);
}

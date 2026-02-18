import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "CITIZEN" | "AUTHORITY";
      authorityBody?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CITIZEN" | "AUTHORITY";
    authorityBody?: string | null;
  }
}

export {};

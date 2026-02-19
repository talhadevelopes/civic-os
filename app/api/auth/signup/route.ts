import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { AUTHORITY_CODE_MAP } from "@/public/data/authorityCodes";
import { prisma } from "@/lib/prisma";

type Role = "CITIZEN" | "AUTHORITY";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
      authorityCode?: string;
    };

    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const role: Role = body.role ?? "CITIZEN";
    const authorityCode = (body.authorityCode ?? "").trim();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (role !== "CITIZEN" && role !== "AUTHORITY") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    let authorityBody: string | null = null;
    let finalAuthorityCode: string | null = null;

    if (role === "AUTHORITY") {
      if (!authorityCode) {
        return NextResponse.json({ error: "Authority verification code is required" }, { status: 400 });
      }
      authorityBody = AUTHORITY_CODE_MAP[authorityCode] ?? null;
      if (!authorityBody) {
        return NextResponse.json({ error: "Invalid authority verification code" }, { status: 400 });
      }
      finalAuthorityCode = authorityCode;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        authorityCode: finalAuthorityCode,
        authorityBody,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authorityBody: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

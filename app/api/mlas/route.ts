import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const mlas = await prisma.mla.findMany({
      select: {
        id: true,
        name: true,
        constituency: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return NextResponse.json(mlas);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch MLAs" }, { status: 500 });
  }
}

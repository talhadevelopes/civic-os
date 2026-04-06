import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const months: { month: string; resolved: number; reported: number }[] = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    
    const [reported, resolved] = await Promise.all([
      prisma.report.count({
        where: { createdAt: { gte: date, lt: nextMonth } },
      }),
      prisma.report.count({
        where: {
          status: "CONFIRMED_FIXED",
          updatedAt: { gte: date, lt: nextMonth },
        },
      }),
    ]);
    
    months.push({ month: monthName, resolved, reported });
  }

  const statusBreakdown = await prisma.report.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const categoryBreakdown = await prisma.report.groupBy({
    by: ["category"],
    _count: { id: true },
  });

  return NextResponse.json({
    statusBreakdown: statusBreakdown.map((s : any) => ({
      name: s.status.replace(/_/g, " "),
      value: s._count.id,
    })),
    categoryBreakdown: categoryBreakdown
      .map((c : any) => ({
        name: c.category.replace(/_/g, " ").slice(0, 12),
        count: c._count.id,
      }))
      .sort((a : any, b : any) => b.count - a.count),
    monthlyTrend: months,
  });
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Listing ALL reports in database:");
  const reports = await prisma.report.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  reports.forEach((r, i) => {
    console.log(`${i + 1}. [${r.id}] ${r.title} (created: ${r.createdAt.toLocaleString()})`);
  });

  console.log("\nTotal reports:", reports.length);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

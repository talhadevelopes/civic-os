import { requireServerSession } from "@/lib/authServer";
import Navbar from "@/app/_components/global/Navbar";

export default async function NavbarServer() {
  const session = await requireServerSession();

  const user = session?.user
    ? {
        id: (session.user as any).id as string,
        name: session.user.name ?? null,
        role: (session.user as any).role as "CITIZEN" | "AUTHORITY",
        authorityBody: (session.user as any).authorityBody ?? null,
      }
    : null;

  return <Navbar user={user} />;
}

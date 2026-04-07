import SidebarLayout from "@/app/_components/global/SidebarLayout";
import NavbarServer from "@/app/_components/global/NavbarServer";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout navbar={<NavbarServer />}>
      {children}
    </SidebarLayout>
  );
}

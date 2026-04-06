import NavbarServer from "@/app/_components/global/NavbarServer";
import AppSidebar from "@/app/_components/global/AppSidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <NavbarServer />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

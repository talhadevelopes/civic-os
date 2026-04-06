import SidebarLayout from "@/app/_components/global/SidebarLayout";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}

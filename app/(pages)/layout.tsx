import NavbarServer from "@/components/NavbarServer";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarServer />
      {children}
    </>
  );
}

import NavbarServer from "@/app/_components/global/NavbarServer";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarServer />
      {children}
    </>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administración de reservas | H.K. Detailing",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}

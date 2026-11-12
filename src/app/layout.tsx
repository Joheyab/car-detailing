import type { Metadata } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "H&K Detailing | Detailing móvil en Greenville",
  description:
    "Detailing automotriz a domicilio en Greenville y alrededores. Reserva limpieza y protección para tu vehículo.",
  openGraph: {
    title: "H&K Detailing | Greenville, SC",
    description: "Cuidado automotriz a domicilio en Greenville y alrededores.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

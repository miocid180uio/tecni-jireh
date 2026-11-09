import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TECNI JIREH | Técnicos Verificados de Refrigeración y Aire Acondicionado",
  description:
    "Localiza, filtra y contrata técnicos de refrigeración, aires acondicionados Split, neveras y cuartos fríos verificados con el respaldo de Refrigeraciones Jireh.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-[#F8FAFC] text-slate-900`}>
        {children}
      </body>
    </html>
  );
}

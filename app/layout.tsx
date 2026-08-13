import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subite Admin",
  description: "Panel de administración interno de Subite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/providers";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SecureFrame Gallery",
  description: "Plataforma segura de galería de imágenes con detección de esteganografía",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner"; // Importamos librería

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stitch Labs - Pokemon Collector",
  description: "Gestiona tu colección de cartas con estilo Gengar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950`}>
        <Navbar />
       <div className="min-h-screen pb-10">
  {children}
</div>

        {/* 2. COMPONENTE DE NOTIFICACIONES GLOBAL */}
        {/* Cambiado a 'top-center' para que salga arriba en el medio */}
        <Toaster 
          theme="dark" 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#0f172a', // Coincide con bg-slate-950
              border: '1px solid #334155', // Borde sutil
              color: 'white',
            },
            className: 'font-sans' // Hereda la fuente Geist
          }}
        />
      </body>
    </html>
  );
}
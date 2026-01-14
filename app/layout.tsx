import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner"; 
import InstallButton from "./components/InstallButton"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. METADATA: Título, descripción y manifiesto
export const metadata: Metadata = {
  title: "PokéBinders",
  description: "Gestiona tu colección de cartas con estilo Gengar",
  manifest: "/manifest.json",
};

// 2. VIEWPORT: Aquí va el color de la barra del móvil (Nuevo estándar Next.js)
export const viewport: Viewport = {
  themeColor: "#020617",
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

        {/* BOTÓN DE DESCARGA PWA */}
        <InstallButton /> 

        {/* NOTIFICACIONES */}
        <Toaster 
          theme="dark" 
          position="top-center" 
          richColors 
          closeButton
          toastOptions={{
            style: {
              background: '#0f172a', 
              border: '1px solid #334155', 
              color: 'white',
            },
            className: 'font-sans' 
          }}
        />
      </body>
    </html>
  );
}
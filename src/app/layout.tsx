import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Footer } from '@/components/layout/footer';
import { Open_Sans, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/layout/header'; // Re-added import



export const metadata: Metadata = {
  title: 'Nugali Seasonal Selections',
  description: 'Premium seasonal chocolates by Nugali.',
};

export default function RootLayout({
  children, }: Readonly<{ children: React.ReactNode; }>) {

  // Define fonts using next/font/google for App Router compatibility
  const openSans = Open_Sans({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-open-sans', // Define CSS variable
  });

  const playfairDisplay = Playfair_Display({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-playfair-display', // Define CSS variable
  });

  return (
    <html lang="en">
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

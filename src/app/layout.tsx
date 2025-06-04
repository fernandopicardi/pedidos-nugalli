import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Footer } from '@/components/layout/footer';
import { PT_Sans, Playfair_Display } from 'next/font/google';
import { Header } from '@/components/layout/header';

// Initialize fonts at the module scope
const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'], // Include weights you'll use
  display: 'swap',
  variable: '--font-pt-sans', // Define CSS variable for PT Sans
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'], // Include weights you'll use
  display: 'swap',
  variable: '--font-playfair-display', // Define CSS variable for Playfair Display
});

export const metadata: Metadata = {
  title: 'Nugali Seasonal Selections',
  description: 'Premium seasonal chocolates by Nugali.',
};

export default function RootLayout({
  children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" className={`${ptSans.variable} ${playfairDisplay.variable}`}>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

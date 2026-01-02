import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { VehicleProvider } from '@/lib/vehicle-context';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Service Guide Tool',
  description: 'Personal vehicle service guide and maintenance tracker',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486262715619-67b519e0edd0?w=1200&h=630&fit=crop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486262715619-67b519e0edd0?w=1200&h=630&fit=crop',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VehicleProvider>
          {children}
          <Toaster position="bottom-right" />
        </VehicleProvider>
      </body>
    </html>
  );
}

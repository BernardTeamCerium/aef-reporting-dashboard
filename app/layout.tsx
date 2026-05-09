import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AEF Reporting Dashboard',
  description: 'Premium Allied Elite Financial reporting platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dialectic — AI Persona Seminar',
  description: 'Invite AI personas into Zoom for Socratic-style discussions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

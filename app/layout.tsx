import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { GrainOverlay } from '@/components/GrainOverlay';
import './globals.css';

// Switzer carries every type role — display, UI, and numerals/labels (the
// role mono used to own). Two src entries sharing one `variable` name give
// the browser a normal-style @font-face and an italic-style @font-face
// under the same font-family, so `font-style: italic` in CSS correctly
// selects Switzer's real Variable Italic file — no synthetic oblique
// anywhere.
const switzer = localFont({
  src: [
    { path: './fonts/switzer/Switzer-Variable.woff2', style: 'normal' },
    { path: './fonts/switzer/Switzer-VariableItalic.woff2', style: 'italic' },
  ],
  variable: '--font-switzer-loader',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  title: 'MJ COBE',
  description: "Soul has a new face.",
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${switzer.variable} h-full antialiased`}>
      <body className="surface-ink min-h-full">
        {children}
        <GrainOverlay />
      </body>
    </html>
  );
}

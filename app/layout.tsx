import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { GrainOverlay } from '@/components/GrainOverlay';
import './globals.css';

// Tanker carries the display role only — the condensed poster-style
// headline face. Switzer carries UI and numerals/labels (the role mono
// used to own). Two families, two @font-face declarations, both self-hosted
// under next/font/local; no component ever names either by name.
const tanker = localFont({
  src: './fonts/tanker/Tanker-Regular.woff2',
  variable: '--font-tanker-loader',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

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
    <html
      lang="en"
      className={`${tanker.variable} ${switzer.variable} h-full antialiased`}
    >
      <body className="surface-ink min-h-full">
        {children}
        <GrainOverlay />
      </body>
    </html>
  );
}

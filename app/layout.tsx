import type {
  Metadata,
  Viewport,
} from 'next';
import localFont from 'next/font/local';
import { GrainOverlay } from '@/components/GrainOverlay';
import './globals.css';
import './visual-phase-3.css';
import './visual-phase-4.css';
import './visual-phase-5.css';

const tanker = localFont({
  src: './fonts/tanker/Tanker-Regular.woff2',
  variable: '--font-tanker-loader',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

const zodiak = localFont({
  src: [
    {
      path: './fonts/zodiak/Zodiak-Variable.woff2',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: './fonts/zodiak/Zodiak-VariableItalic.woff2',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-zodiak-loader',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const switzer = localFont({
  src: [
    {
      path: './fonts/switzer/Switzer-Variable.woff2',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: './fonts/switzer/Switzer-VariableItalic.woff2',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-switzer-loader',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const metadata: Metadata = {
  title: {
    default:
      'MJ COBE | Soul Has A New Face.',
    template: '%s | MJ COBE',
  },
  description:
    'Original R&B. A new visual world. A career being built in real time.',
  applicationName: 'MJ COBE',
  creator: 'MJ COBE',
  publisher: 'MJ COBE',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'MJ COBE',
    title:
      'MJ COBE | Soul Has A New Face.',
    description:
      'Original R&B. A new visual world. A career being built in real time.',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'MJ COBE | Soul Has A New Face.',
    description:
      'Original R&B. A new visual world. A career being built in real time.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0b',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={[
        tanker.variable,
        zodiak.variable,
        switzer.variable,
        'h-full antialiased',
      ].join(' ')}
    >
      <body className="surface-ink min-h-full overflow-x-clip">
        {children}
        <GrainOverlay />
      </body>
    </html>
  );
}

import Link from 'next/link';

/**
 * Slice 0 ships no PRD pages — this is scaffolding, not the homepage.
 * Real content lives at /dev/gallery until Slice 1.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Link href="/dev/gallery" className="font-mono text-eyebrow uppercase underline">
        /dev/gallery
      </Link>
    </main>
  );
}

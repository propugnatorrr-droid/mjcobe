import { notFound } from 'next/navigation';

/** Dev-only tooling. Never reachable once deployed. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return children;
}

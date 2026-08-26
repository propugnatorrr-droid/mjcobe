import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/guard';
import { signOut } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

/** Every page in this group is gated by the layout — no per-page guard to forget. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();

  const links = [
    { href: '/admin', label: admin.nav.overview },
    { href: '/admin/contributions', label: admin.nav.contributions },
    { href: '/admin/sponsors', label: admin.nav.sponsors },
    { href: '/admin/offline', label: admin.nav.offline },
    { href: '/admin/settings', label: admin.nav.settings },
    { href: '/admin/copy', label: admin.nav.copy },
    { href: '/admin/audit', label: admin.nav.audit },
  ];

  return (
    <div className="surface-ink min-h-screen">
      <header className="border-b border-[var(--line)] px-6 py-5 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <span className="font-mono text-eyebrow uppercase tracking-[0.18em] text-[var(--text)]">
            {admin.brand}
          </span>
          <form action={signOut} className="flex items-center gap-6">
            <span className="font-mono text-eyebrow uppercase text-[var(--text-faint)]">
              {me.email}
            </span>
            <button
              type="submit"
              className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {admin.signOut}
            </button>
          </form>
        </div>

        <nav className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="px-6 py-12 md:px-10 md:py-16">{children}</div>
    </div>
  );
}

import Link from 'next/link';
import {
  LayoutGrid, Music, Images, History, Receipt, Landmark, Wallet, Settings, FileText, ShieldCheck, LogOut, Ban, Link2, Bell,
} from 'lucide-react';
import { requireAdmin } from '@/lib/admin/guard';
import { signOut } from '@/lib/admin/actions';
import { admin } from '@/lib/copy/admin';

/** Every page in this group is gated by the layout — no per-page guard to forget. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();

  const links = [
    { href: '/admin', label: admin.nav.overview, icon: LayoutGrid },
    { href: '/admin/songs', label: admin.nav.songs, icon: Music },
    { href: '/admin/media', label: admin.nav.media, icon: Images },
    { href: '/admin/journey', label: admin.nav.journey, icon: History },
    { href: '/admin/contributions', label: admin.nav.contributions, icon: Receipt },
{ href: '/admin/sponsors', label: admin.nav.sponsors, icon: Landmark },
{
  href: '/admin/sponsors/manage',
  label: admin.nav.sponsorProfiles,
  icon: Landmark,
},
    { href: '/admin/offline', label: admin.nav.offline, icon: Wallet },
    { href: '/admin/referrals', label: admin.nav.referrals, icon: Link2 },
    { href: '/admin/settings', label: admin.nav.settings, icon: Settings },
    { href: '/admin/copy', label: admin.nav.copy, icon: FileText },
    { href: '/admin/audit', label: admin.nav.audit, icon: ShieldCheck },
    { href: '/admin/blocklist', label: admin.nav.blocklist, icon: Ban },
    { href: '/admin/notifications', label: admin.nav.notifications, icon: Bell, },
  ];

  return (
    <div className="surface-ink flex min-h-screen">
      <aside
        className="flex w-64 shrink-0 flex-col border-r px-5 py-8"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="mb-9 flex items-center gap-3 px-2">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-base text-gold"
            style={{ outline: '1px solid var(--champagne)' }}
          >
            MJ
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg tracking-[0.12em] text-gold">MJ COBE</span>
            <span className="mt-1 font-ui text-[0.5rem] uppercase tracking-[0.3em] text-[var(--text-dim)]">
              {admin.brand}
            </span>
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-[var(--radius-panel)] px-3 py-2.5 font-ui text-sm text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:bg-[var(--ink-2)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
              >
                <Icon aria-hidden size={18} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        <form action={signOut} className="mt-auto flex flex-col gap-3 border-t px-3 pt-6" style={{ borderColor: 'var(--line)' }}>
          <span className="truncate font-mono text-eyebrow text-[var(--text-dim)]">
            {me.email}
          </span>
          <button
            type="submit"
            className="flex items-center gap-2 font-ui text-sm text-[var(--text-dim)] transition-colors [transition-duration:var(--duration-signature)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
          >
            <LogOut aria-hidden size={16} />
            {admin.signOut}
          </button>
        </form>
      </aside>

      <div className="flex-1 px-8 py-10 md:px-12 md:py-14">{children}</div>
    </div>
  );
}

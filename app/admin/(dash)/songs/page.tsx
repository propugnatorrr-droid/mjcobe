import Link from 'next/link';
import { listSongsAdmin } from '@/lib/admin/songs';
import { AdminHeading, AdminHint, Table, Td } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function SongsAdminPage() {
  const songs = await listSongsAdmin();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <AdminHeading>{admin.songs.heading}</AdminHeading>
        <Link
          href="/admin/songs/new"
          className="rounded-full bg-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--ink)] transition-colors [transition-duration:var(--duration-signature)] hover:brightness-110"
        >
          + {admin.songs.create}
        </Link>
      </div>
      <AdminHint>{admin.songs.hint}</AdminHint>

      {songs.length === 0 ? (
        <p className="text-body text-[var(--text-dim)]">{admin.songs.empty}</p>
      ) : (
        <Table head={[admin.songs.title, admin.songs.slug, admin.songs.status, admin.songs.published, '']}>
          {songs.map((song) => (
            <tr key={song.id}>
              <Td>{song.title}</Td>
              <Td mono dim>{song.slug}</Td>
              <Td dim>{admin.songs.statuses[song.status]}</Td>
              <Td dim>{song.isPublished ? 'Yes' : 'No'}</Td>
              <Td nowrap>
                <Link
                  href={`/admin/songs/${song.id}`}
                  className="font-mono text-eyebrow uppercase text-[var(--text-dim)] transition-opacity [transition-duration:var(--duration-signature)] hover:opacity-60"
                >
                  {admin.actions.edit}
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

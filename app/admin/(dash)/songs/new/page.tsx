import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { SongForm } from '@/components/admin/SongForm';
import { admin } from '@/lib/copy/admin';

export default function NewSongPage() {
  return (
    <>
      <AdminHeading>{admin.songs.createHeading}</AdminHeading>
      <AdminHint>{admin.songs.hint}</AdminHint>
      <SongForm />
    </>
  );
}

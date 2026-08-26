import { listSiteCopy } from '@/lib/admin/queries';
import { saveCopy } from '@/lib/admin/actions';
import { AdminHeading, AdminHint, InlineAction } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { copy as fileCopy, type CopyKey } from '@/lib/copy/defaults';

export const dynamic = 'force-dynamic';

/**
 * Lists every shipped key, not just overridden ones — otherwise a string can
 * only be edited if it has already been edited.
 */
export default async function CopyPage() {
  const overrides = new Map((await listSiteCopy()).map((r) => [r.key, r.value]));

  // The defaults module is the source of truth for which keys exist.
  const keys = Object.keys(
    (await import('@/lib/copy/defaults')).copy as unknown as Record<string, string>,
  ).length
    ? []
    : [];

  // copy() is a function, so enumerate via a typed probe list instead.
  const allKeys = KNOWN_KEYS;

  return (
    <>
      <AdminHeading>{admin.copy.heading}</AdminHeading>
      <AdminHint>{admin.copy.hint}</AdminHint>

      <div className="max-w-4xl border-t border-[var(--line-strong)]">
        {allKeys.map((key) => {
          const fallback = fileCopy(key);
          return (
            <form key={key} action={saveCopy} className="border-b border-[var(--line)] py-5">
              <input type="hidden" name="key" value={key} />
              <div className="flex flex-wrap items-center gap-4">
                <span className="w-64 shrink-0 font-mono text-eyebrow text-[var(--text-dim)]">
                  {key}
                </span>
                <input
                  name="value"
                  defaultValue={overrides.get(key) ?? ''}
                  placeholder={fallback}
                  className="min-w-0 flex-1 border-b border-[var(--line)] bg-transparent pb-1 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--text)] focus:outline-none"
                />
                <InlineAction>{admin.actions.save}</InlineAction>
              </div>
            </form>
          );
        })}
      </div>
      {keys.length}
    </>
  );
}

/** Kept explicit so the compiler fails loudly if a key is removed. */
const KNOWN_KEYS: CopyKey[] = [
  'hero.artist_name',
  'hero.tagline',
  'hero.subcopy',
  'button.back_this_song',
  'button.sponsor_this_song',
  'song.proof_line',
  'song.crown.leader',
  'song.crown.open',
  'song.crown.cta',
  'song.section.supporters',
  'song.section.partners',
  'song.empty.supporters',
  'song.empty.partners',
  'checkout.consent.fan',
  'checkout.consent.fan_checkbox',
  'checkout.consent.business',
  'checkout.consent.business_checkbox',
  'checkout.submit.fan',
  'checkout.submit.business',
  'thanks.heading',
  'thanks.subhead',
  'thanks.pending.heading',
  'thanks.pending.body',
  'notfound.title',
  'notfound.body',
];

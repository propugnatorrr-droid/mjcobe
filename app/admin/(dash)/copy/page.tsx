import { listSiteCopy } from '@/lib/admin/queries';
import { saveCopy } from '@/lib/admin/actions';
import { AdminHeading, AdminHint, InlineAction } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';
import { copy as fileCopy, copyKeys } from '@/lib/copy/defaults';

export const dynamic = 'force-dynamic';

/**
 * Lists every shipped key, not just overridden ones — otherwise a string can
 * only be edited if it has already been edited.
 */
export default async function CopyPage() {
  const overrides = new Map((await listSiteCopy()).map((r) => [r.key, r.value]));

  // The defaults module is the source of truth for which keys exist.
  const allKeys = copyKeys;

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
    </>
  );
}


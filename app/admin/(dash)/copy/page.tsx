import {
  listCopyRows,
} from '@/lib/admin/copy-queries';
import {
  saveCopyOverride,
} from '@/lib/admin/copy-actions';
import {
  AdminHeading,
  AdminHint,
} from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function CopyPage({
  searchParams,
}: Props) {
  const { q } = await searchParams;
  const rows = await listCopyRows(q);

  const overridden = rows.filter(
    (row) => row.override !== null,
  ).length;

  return (
    <>
      <AdminHeading>
        Site copy
      </AdminHeading>

      <AdminHint>
        {overridden} of {rows.length}{' '}
        keys are overridden. Saving a
        value identical to the default
        clears the override.
      </AdminHint>

      <form
        method="get"
        className="mt-6 flex gap-3"
      >
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Filter by key or text"
          className="min-w-0 flex-1 rounded-sm border border-[var(--line)] bg-[var(--ink-2)] px-3 py-2 text-sm text-[var(--text)]"
        />

        <button
          type="submit"
          className="rounded-sm border border-[var(--line)] px-4 py-2 font-ui text-[0.625rem] uppercase tracking-[0.16em] text-[var(--text-dim)]"
        >
          Filter
        </button>
      </form>

      <div className="mt-8 space-y-4">
        {rows.map((row) => (
          <form
            key={row.key}
            action={saveCopyOverride}
            className="rounded-sm border border-[var(--line)] bg-[var(--ink-2)] p-4"
          >
            <input
              type="hidden"
              name="key"
              value={row.key}
            />

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <code className="font-mono text-xs text-[var(--champagne)]">
                {row.key}
              </code>

              {row.override !== null ? (
                <span className="font-ui text-[0.5625rem] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                  Overridden
                </span>
              ) : null}
            </div>

            <textarea
              name="value"
              defaultValue={row.effective}
              rows={row.effective.length > 120 ? 4 : 2}
              className="mt-3 w-full rounded-sm border border-[var(--line)] bg-[var(--ink)] px-3 py-2 text-sm text-[var(--text)]"
            />

            {row.override !== null ? (
              <p className="mt-2 font-mono text-[0.6875rem] text-[var(--text-faint)]">
                Default: {row.fallback}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-3 rounded-sm border border-[var(--line)] px-4 py-2 font-ui text-[0.625rem] uppercase tracking-[0.16em] text-[var(--text-dim)]"
            >
              Save
            </button>
          </form>
        ))}
      </div>
    </>
  );
}

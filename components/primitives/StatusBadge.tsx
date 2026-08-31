type SongStatus =
  | 'draft'
  | 'building'
  | 'coming_soon'
  | 'released'
  | 'vault';

const INDEX: Record<
  SongStatus,
  string
> = {
  draft: '00',
  building: '01',
  coming_soon: '02',
  released: '03',
  vault: '04',
};

export function StatusBadge({
  status,
  label,
}: {
  status: SongStatus;
  label: string;
}) {
  return (
    <span
      className={[
        'mj-status-index',
        `mj-status-index--${status}`,
      ].join(' ')}
    >
      <span
        aria-hidden
        className="mj-status-index__number"
      >
        {INDEX[status] ?? '00'}
      </span>

      <span className="mj-status-index__label">
        {label}
      </span>
    </span>
  );
}

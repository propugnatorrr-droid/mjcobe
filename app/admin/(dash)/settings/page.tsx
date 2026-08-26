import { listSettings } from '@/lib/admin/queries';
import { SettingRow } from '@/components/admin/SettingRow';
import { AdminHeading, AdminHint } from '@/components/admin/ui';
import { admin } from '@/lib/copy/admin';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const rows = await listSettings();

  return (
    <>
      <AdminHeading>{admin.settings.heading}</AdminHeading>
      <AdminHint>{admin.settings.hint}</AdminHint>

      <div className="max-w-3xl border-t border-[var(--line-strong)]">
        {rows.map((row) => (
          <SettingRow
            key={row.key}
            settingKey={row.key}
            value={JSON.stringify(row.value)}
            description={row.description}
          />
        ))}
        <SettingRow settingKey="" value="" description={null} isNew />
      </div>
    </>
  );
}

import {
  assignLibraryMedia,
} from '@/lib/admin/media-library-actions';
import type {
  AdminMediaAssetRow,
} from '@/lib/admin/songs';
import { admin } from '@/lib/copy/admin';

type Props = {
  songId: string;
  assignment:
    | 'cover'
    | 'audio';
  assets:
    AdminMediaAssetRow[];
  currentAssetId:
    string | null;
};

export function MediaLibraryPicker({
  songId,
  assignment,
  assets,
  currentAssetId,
}: Props) {
  const expectedKind =
    assignment === 'cover'
      ? 'image'
      : 'audio';

  const available =
    assets.filter(
      (asset) =>
        asset.kind ===
        expectedKind,
    );

  return (
    <div className="mt-5 border-t border-[var(--line)] pt-5">
      <h4 className="font-mono text-eyebrow uppercase text-[var(--text-dim)]">
        {
          admin.media
            .chooseExisting
        }
      </h4>

      {available.length === 0 ? (
        <p className="mt-3 text-body text-[var(--text-dim)]">
          {
            admin.media
              .noneForType
          }
        </p>
      ) : (
        <form
          action={
            assignLibraryMedia
          }
          className="mt-4 flex flex-col gap-4"
        >
          <input
            type="hidden"
            name="songId"
            value={songId}
          />

          <input
            type="hidden"
            name="assignment"
            value={assignment}
          />

          <select
            name="assetId"
            required
            defaultValue={
              currentAssetId ??
              ''
            }
            className="min-h-11 w-full rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--field-bg)] px-3 py-2 font-mono text-xs text-[var(--text)] focus:border-[var(--champagne)] focus:outline-none"
          >
            <option
              value=""
              disabled
            >
              {
                admin.media
                  .selectAsset
              }
            </option>

            {available.map(
              (asset) => (
                <option
                  key={asset.id}
                  value={asset.id}
                >
                  {asset.role}
                  {' — '}
                  {asset.path
                    .split('/')
                    .pop()}
                </option>
              ),
            )}
          </select>

          <button
            type="submit"
            className="self-start rounded-full border border-[var(--champagne)] px-5 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.04em] text-[var(--champagne)] hover:bg-[var(--champagne)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--champagne)]"
          >
            {
              assignment ===
              'cover'
                ? admin.media
                    .assignCover
                : admin.media
                    .assignAudio
            }
          </button>
        </form>
      )}
    </div>
  );
}

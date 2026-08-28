export const JOURNEY_EVENT_KINDS = [
  'preview_uploaded',
  'supporter_milestone',
  'funding_milestone',
  'new_top_sponsor',
  'new_top_supporter',
  'production_update',
  'release',
  'video_release',
  'stream_milestone',
  'view_milestone',
  'campaign_opened',
  'campaign_closed',
  'manual',
] as const;

export type JourneyEventKind =
  (typeof JOURNEY_EVENT_KINDS)[number];

export function isJourneyEventKind(
  value: string | null,
): value is JourneyEventKind {
  return (
    value !== null &&
    JOURNEY_EVENT_KINDS.some(
      (kind) => kind === value,
    )
  );
}

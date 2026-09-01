export const analyticsKinds = [
  'song_page_view',
  'audio_play',
  'audio_complete',
  'support_click',
  'sponsor_click',
  'checkout_start',
  'payment_step_view',
  'payment_failure',
  'payment_success',
] as const;

export type AnalyticsKind =
  (typeof analyticsKinds)[number];

export type AnalyticsPayload = {
  eventId: string;
  kind: AnalyticsKind;
  songId?: string;
  campaignId?: string;
  path?: string;
  referrer?: string;
  meta?: Record<
    string,
    string | number | boolean
  >;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const allowedKinds =
  new Set<string>(
    analyticsKinds,
  );

const allowedMetaKeys =
  new Set([
    'source',
    'scope',
    'reason',
    'progress',
  ]);

function objectValue(
  value: unknown,
): Record<string, unknown> | null {
  if (
    typeof value !==
      'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

function optionalUuid(
  value: unknown,
): string | undefined | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined;
  }

  if (
    typeof value !==
      'string' ||
    !UUID_RE.test(value)
  ) {
    return null;
  }

  return value;
}

function optionalString(
  value: unknown,
  maximumLength: number,
): string | undefined | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined;
  }

  if (
    typeof value !==
      'string'
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length >
      maximumLength
  ) {
    return null;
  }

  return normalized;
}

function safeMeta(
  value: unknown,
): Record<
  string,
  string | number | boolean
> | null {
  if (
    value === undefined ||
    value === null
  ) {
    return {};
  }

  const object =
    objectValue(value);

  if (!object) {
    return null;
  }

  const output: Record<
    string,
    string | number | boolean
  > = {};

  for (
    const [
      key,
      metaValue,
    ] of Object.entries(object)
  ) {
    if (
      !allowedMetaKeys.has(key)
    ) {
      continue;
    }

    if (
      typeof metaValue ===
      'string'
    ) {
      if (
        metaValue.length <= 80
      ) {
        output[key] =
          metaValue;
      }

      continue;
    }

    if (
      typeof metaValue ===
        'number' &&
      Number.isFinite(
        metaValue,
      )
    ) {
      output[key] =
        metaValue;

      continue;
    }

    if (
      typeof metaValue ===
      'boolean'
    ) {
      output[key] =
        metaValue;
    }
  }

  return output;
}

export function parseAnalyticsPayload(
  input: unknown,
): AnalyticsPayload | null {
  const value =
    objectValue(input);

  if (!value) {
    return null;
  }

  const eventId =
    optionalUuid(
      value.eventId,
    );

  const songId =
    optionalUuid(
      value.songId,
    );

  const campaignId =
    optionalUuid(
      value.campaignId,
    );

  const path =
    optionalString(
      value.path,
      300,
    );

  const referrer =
    optionalString(
      value.referrer,
      500,
    );

  const meta =
    safeMeta(
      value.meta,
    );

  if (
    !eventId ||
    typeof value.kind !==
      'string' ||
    !allowedKinds.has(
      value.kind,
    ) ||
    songId === null ||
    campaignId === null ||
    path === null ||
    referrer === null ||
    meta === null
  ) {
    return null;
  }

  if (
    path &&
    !path.startsWith('/')
  ) {
    return null;
  }

  return {
    eventId,
    kind:
      value.kind as
        AnalyticsKind,
    songId,
    campaignId,
    path,
    referrer,
    meta,
  };
}

export function analyticsKindNeedsSong(
  kind: AnalyticsKind,
): boolean {
  return (
    kind ===
      'song_page_view' ||
    kind ===
      'audio_play' ||
    kind ===
      'audio_complete'
  );
}

export function analyticsKindNeedsCampaign(
  kind: AnalyticsKind,
): boolean {
  return (
    kind ===
      'support_click' ||
    kind ===
      'sponsor_click' ||
    kind ===
      'checkout_start' ||
    kind ===
      'payment_step_view' ||
    kind ===
      'payment_failure' ||
    kind ===
      'payment_success'
  );
}

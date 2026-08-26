import 'server-only';
import { createHash } from 'node:crypto';
import { text } from '@/lib/copy/site-copy';

/**
 * The consent record must reflect the exact words a person agreed to. Copy is
 * admin-editable, so the version string embeds a hash of the live text — an
 * edit automatically produces a new version rather than silently invalidating
 * every prior record.
 */
const BASE_VERSION = 'v1';

export async function consentFor(supportType: 'fan' | 'business') {
  const body = await text(
    supportType === 'fan' ? 'checkout.consent.fan' : 'checkout.consent.business',
  );
  const checkbox = await text(
    supportType === 'fan'
      ? 'checkout.consent.fan_checkbox'
      : 'checkout.consent.business_checkbox',
  );

  const full = `${body}\n${checkbox}`;
  const digest = createHash('sha256').update(full).digest('hex').slice(0, 12);

  return {
    body,
    checkbox,
    version: `${supportType}-${BASE_VERSION}-${digest}`,
    text: full,
  };
}

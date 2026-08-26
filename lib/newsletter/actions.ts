'use server';

import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { EMAIL_RE } from '@/lib/checkout/validate';

export type NewsletterState = { ok?: boolean; error?: string };

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!EMAIL_RE.test(email)) return { error: 'invalid_email' };

  await dbw
    .insert(s.newsletterSubscribers)
    .values({ email, source: 'now_page' })
    .onConflictDoUpdate({
      target: s.newsletterSubscribers.email,
      set: { unsubscribedAt: null },
    });

  return { ok: true };
}

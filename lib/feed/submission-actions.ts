'use server';

import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { dbw } from '@/lib/db/write';
import * as s from '@/lib/db/schema';
import { str, bool, slugify } from '@/lib/checkout/validate';
import { normalizeExternalUrl } from '@/lib/feed/sanitize';
import { validateFeedMedia, storeFeedMedia } from '@/lib/feed/media';
import { validateSubmissionToken, markInviteUsed } from '@/lib/feed/invites';

export type SubmissionState = {
  ok?: 'submitted';
  error?: string;
};

const sha = (v: string) => createHash('sha256').update(v).digest('hex');

async function ipHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  return ip ? sha(ip) : null;
}

const RATE_LIMIT_WINDOW_MINUTES = 10;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

async function attemptCountInWindow(field: 'inviteId' | 'ipHash', value: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const column = field === 'inviteId' ? s.feedSubmissionAttempts.inviteId : s.feedSubmissionAttempts.ipHash;

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(s.feedSubmissionAttempts)
    .where(and(eq(column, value), gte(s.feedSubmissionAttempts.occurredAt, since)));

  return Number(row?.count ?? 0);
}

async function recordAttempt(inviteId: string | null, ip: string | null): Promise<void> {
  await dbw.insert(s.feedSubmissionAttempts).values({ inviteId, ipHash: ip });
}

// 'video' is not offered here for the same reason it's excluded from the
// admin form — see lib/feed/media.ts's header comment.
const ALLOWED_POST_TYPES = ['text', 'image', 'link'] as const;

export async function submitBrandFeedPost(_prev: SubmissionState, formData: FormData): Promise<SubmissionState> {
  // Honeypot: a real person never fills a hidden field. Checked before any
  // DB work, matching lib/checkout/actions.ts's convention.
  if (str(formData.get('company_website_confirm'))) {
    return { error: 'blocked' };
  }

  const rawToken = str(formData.get('token'), 200);
  const ip = await ipHash();
  if (!rawToken) return { error: 'invalid_token' };

  if (ip) {
    const ipAttempts = await attemptCountInWindow('ipHash', ip);
    if (ipAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      await recordAttempt(null, ip);
      return { error: 'rate_limited' };
    }
  }

  const invite = await validateSubmissionToken(rawToken);
  if (!invite) {
    await recordAttempt(null, ip);
    return { error: 'invalid_token' };
  }

  const inviteAttempts = await attemptCountInWindow('inviteId', invite.inviteId);
  if (inviteAttempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    await recordAttempt(invite.inviteId, ip);
    return { error: 'rate_limited' };
  }

  await recordAttempt(invite.inviteId, ip);

  const rightsAttested = bool(formData.get('rightsAttested'));
  if (!rightsAttested) return { error: 'rights_required' };

  const postType = str(formData.get('postType'), 20) ?? 'text';
  if (!ALLOWED_POST_TYPES.includes(postType as (typeof ALLOWED_POST_TYPES)[number])) {
    return { error: 'invalid_type' };
  }

  const title = str(formData.get('title'), 200);
  const body = str(formData.get('body'), 5000);
  const ctaLabel = str(formData.get('ctaLabel'), 60);
  const rawCtaUrl = str(formData.get('ctaUrl'), 2000);
  const ctaUrl = rawCtaUrl ? normalizeExternalUrl(rawCtaUrl) : null;
  if (rawCtaUrl && !ctaUrl) return { error: 'unsafe_url' };

  const mediaValidation = await validateFeedMedia(formData.get('media'));
  if (!mediaValidation.ok) return { error: `media_${mediaValidation.reason}` };
  const mediaAssetId = mediaValidation.file
    ? await storeFeedMedia(mediaValidation.file, mediaValidation.detectedType!)
    : null;

  const baseSlug = slugify(title || 'brand-post') || 'brand-post';
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 20) {
    const [existing] = await db
      .select({ id: s.brandFeedPosts.id })
      .from(s.brandFeedPosts)
      .where(eq(s.brandFeedPosts.slug, slug))
      .limit(1);
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const created = await dbw.transaction(async (tx) => {
    const [post] = await tx
      .insert(s.brandFeedPosts)
      .values({
        // sponsorId comes exclusively from the validated invite — nothing
        // in this form can select or override which sponsor a post belongs
        // to, which is the whole point of binding invites to a sponsor at
        // issuance time (see lib/feed/invites.ts).
        sponsorId: invite.sponsorId,
        slug,
        postType,
        title,
        body,
        mediaAssetId,
        ctaLabel,
        ctaUrl,
        submissionSource: 'brand_invite',
        rightsAttested,
        moderation: 'pending',
        submittedAt: new Date(),
      })
      .returning({ id: s.brandFeedPosts.id });

    if (!post) {
      throw new Error('Feed post was not created');
    }

    // markInviteUsed's own conditional WHERE (usedAt IS NULL) is what makes
    // this safe under a concurrent double-submit with the same token — if
    // it returns false here, another request already consumed this invite
    // between validateSubmissionToken and this transaction, and the whole
    // transaction rolls back rather than leaving two posts from one invite.
    const claimed = await markInviteUsed(tx, invite.inviteId, post.id);
    if (!claimed) {
      throw new Error('Invite already used');
    }

    return post;
  });

  return created ? { ok: 'submitted' } : { error: 'failed' };
}

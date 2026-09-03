'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { dbw } from '@/lib/db/write';
import { db } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { requireAdminRole } from '@/lib/admin/guard';
import { recordAudit } from '@/lib/audit/log';
import { str, bool, slugify } from '@/lib/checkout/validate';
import { normalizeExternalUrl } from '@/lib/feed/sanitize';
import type { AdminState } from '@/lib/admin/actions';

/** Content authoring vs. moderation are different responsibilities per the
 * launch role table: content_admin writes/edits post copy; approving what
 * goes public is content_admin + partnership_admin (brand relationships)
 * + moderator (general moderation duty). super_admin is always allowed
 * regardless (requireAdminRole's own rule). */
const CONTENT_ROLES = ['content_admin'] as const;
const MODERATION_ROLES = ['content_admin', 'partnership_admin', 'moderator'] as const;

function revalidateFeedSurfaces(slug?: string) {
  revalidatePath('/admin/feed');
  revalidatePath('/feed');
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/feed/${slug}`);
}

type PostFields = {
  sponsorId: string;
  postType: string;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  relatedSongId: string | null;
  relatedCampaignId: string | null;
};

function readPostFields(formData: FormData): PostFields | { error: string } {
  const sponsorId = str(formData.get('sponsorId'), 100);
  if (!sponsorId) return { error: 'missing' };

  const postType = str(formData.get('postType'), 20) ?? 'text';
  if (!['text', 'image', 'video', 'link'].includes(postType)) {
    return { error: 'invalid_type' };
  }

  const rawCtaUrl = str(formData.get('ctaUrl'), 2000);
  const ctaUrl = rawCtaUrl ? normalizeExternalUrl(rawCtaUrl) : null;
  if (rawCtaUrl && !ctaUrl) return { error: 'unsafe_url' };

  return {
    sponsorId,
    postType,
    title: str(formData.get('title'), 200),
    body: str(formData.get('body'), 5000),
    ctaLabel: str(formData.get('ctaLabel'), 60),
    ctaUrl,
    relatedSongId: str(formData.get('relatedSongId'), 100),
    relatedCampaignId: str(formData.get('relatedCampaignId'), 100),
  };
}

export async function createFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...CONTENT_ROLES]);

  const fields = readPostFields(formData);
  if ('error' in fields) return fields;

  const titleForSlug = fields.title || 'post';
  const baseSlug = slugify(titleForSlug) || 'post';
  let slug = baseSlug;
  let attempt = 0;
  // Slugs must be unique; a title collision gets a numeric suffix rather
  // than a failed insert an admin has to puzzle out.
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

  const rightsAttested = bool(formData.get('rightsAttested'));

  const [created] = await dbw
    .insert(s.brandFeedPosts)
    .values({
      ...fields,
      slug,
      submissionSource: 'admin',
      rightsAttested,
      moderation: 'pending',
      submittedAt: new Date(),
    })
    .returning({ id: s.brandFeedPosts.id });

  if (!created) return { error: 'failed' };

  await recordAudit({
    adminUserId: me.id,
    action: 'brand_feed_post.create',
    entity: 'brand_feed_post',
    entityId: created.id,
    after: fields,
  });

  revalidateFeedSurfaces();

  return { ok: 'saved' };
}

export async function updateFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const me = await requireAdminRole([...CONTENT_ROLES]);

  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  const fields = readPostFields(formData);
  if ('error' in fields) return fields;

  const [before] = await db.select().from(s.brandFeedPosts).where(eq(s.brandFeedPosts.id, id)).limit(1);
  if (!before) return { error: 'not_found' };

  // The first time an admin edits a brand-submitted post, snapshot what
  // the sponsor actually sent before overwriting it — never on an
  // admin-authored post (there's no "original" distinct from itself), and
  // never overwritten again on a second edit.
  const shouldSnapshot = before.submissionSource === 'brand_invite' && !before.originalSubmission;
  const originalSubmission = shouldSnapshot
    ? {
        title: before.title,
        body: before.body,
        ctaLabel: before.ctaLabel,
        ctaUrl: before.ctaUrl,
        postType: before.postType,
      }
    : undefined;

  await dbw
    .update(s.brandFeedPosts)
    .set({
      ...fields,
      ...(originalSubmission ? { originalSubmission } : {}),
      updatedAt: new Date(),
    })
    .where(eq(s.brandFeedPosts.id, id));

  await recordAudit({
    adminUserId: me.id,
    action: 'brand_feed_post.update',
    entity: 'brand_feed_post',
    entityId: id,
    before: { title: before.title, body: before.body, ctaLabel: before.ctaLabel, ctaUrl: before.ctaUrl },
    after: fields,
  });

  revalidateFeedSurfaces(before.slug);

  return { ok: 'saved' };
}

async function transitionModeration(input: {
  id: string;
  action: string;
  moderation: 'pending' | 'approved' | 'flagged' | 'hidden' | 'blocked';
  rejectionReason?: string | null;
  publishNow?: boolean;
  scheduledFor?: Date | null;
}): Promise<AdminState> {
  const me = await requireAdminRole([...MODERATION_ROLES]);

  const [before] = await db.select().from(s.brandFeedPosts).where(eq(s.brandFeedPosts.id, input.id)).limit(1);
  if (!before) return { error: 'not_found' };

  const now = new Date();

  await dbw
    .update(s.brandFeedPosts)
    .set({
      moderation: input.moderation,
      rejectionReason: input.rejectionReason ?? null,
      reviewedAt: now,
      reviewedByAdminId: me.id,
      scheduledFor: input.scheduledFor ?? before.scheduledFor,
      publishedAt: input.publishNow ? now : before.publishedAt,
      updatedAt: now,
    })
    .where(eq(s.brandFeedPosts.id, input.id));

  await recordAudit({
    adminUserId: me.id,
    action: `brand_feed_post.${input.action}`,
    entity: 'brand_feed_post',
    entityId: input.id,
    before: { moderation: before.moderation, publishedAt: before.publishedAt },
    after: { moderation: input.moderation, publishedAt: input.publishNow ? now : before.publishedAt },
    reason: input.rejectionReason ?? null,
  });

  revalidateFeedSurfaces(before.slug);

  return { ok: 'saved' };
}

export async function approveFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };
  const scheduledForRaw = str(formData.get('scheduledFor'), 40);
  const scheduledFor = scheduledForRaw ? new Date(scheduledForRaw) : null;
  const publishNow = !scheduledFor;

  return transitionModeration({
    id,
    action: 'approve',
    moderation: 'approved',
    publishNow,
    scheduledFor,
  });
}

export async function rejectFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };
  const reason = str(formData.get('reason'), 500);

  return transitionModeration({ id, action: 'reject', moderation: 'blocked', rejectionReason: reason });
}

export async function hideFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  return transitionModeration({ id, action: 'hide', moderation: 'hidden' });
}

export async function unpublishFeedPost(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const id = str(formData.get('id'), 100);
  if (!id) return { error: 'missing' };

  return transitionModeration({ id, action: 'unpublish', moderation: 'pending' });
}

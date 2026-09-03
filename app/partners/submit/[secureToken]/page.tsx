import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { SubmissionForm } from '@/components/feed/SubmissionForm';
import { validateSubmissionToken } from '@/lib/feed/invites';
import { flagEnabled } from '@/lib/config/settings';
import { text } from '@/lib/copy/site-copy';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await text('submit.title'), robots: { index: false, follow: false } };
}

type Props = { params: Promise<{ secureToken: string }> };

export default async function BrandSubmissionPage({ params }: Props) {
  if (!(await flagEnabled('brandSubmissionsEnabled'))) {
    notFound();
  }

  const { secureToken } = await params;
  const invite = await validateSubmissionToken(secureToken);

  const [eyebrow, title, introPrefix, introSuffix, invalidTitle, invalidBody] = await Promise.all([
    text('submit.eyebrow'),
    text('submit.title'),
    text('submit.intro_prefix'),
    text('submit.intro_suffix'),
    text('submit.invalid_title'),
    text('submit.invalid_body'),
  ]);

  if (!invite) {
    return (
      <main id="main-content" className="surface-ink min-h-screen">
        <SiteNav sub={title} />
        <header className="site-shell section-space-compact">
          <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.5rem)] uppercase leading-none text-[var(--text)]">
            {invalidTitle}
          </h1>
          <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">{invalidBody}</p>
        </header>
        <SiteFooter />
      </main>
    );
  }

  const [
    typeLabel, typeText, typeImage, typeLink, titleLabel, bodyLabel, ctaLabelLabel, ctaUrlLabel,
    mediaLabel, mediaHint, rightsLabel, submit, successTitle, successBody, errorRightsRequired,
    errorUnsafeUrl, errorMediaType, errorMediaSize, errorMediaSignature, errorRateLimited, errorGeneric,
  ] = await Promise.all([
    text('submit.type_label'), text('submit.type_text'), text('submit.type_image'), text('submit.type_link'),
    text('submit.title_label'), text('submit.body_label'), text('submit.cta_label_label'), text('submit.cta_url_label'),
    text('submit.media_label'), text('submit.media_hint'), text('submit.rights_label'), text('submit.submit'),
    text('submit.success_title'), text('submit.success_body'), text('submit.error_rights_required'),
    text('submit.error_unsafe_url'), text('submit.error_media_type'), text('submit.error_media_size'),
    text('submit.error_media_signature'), text('submit.error_rate_limited'), text('submit.error_generic'),
  ]);

  return (
    <main id="main-content" className="surface-ink min-h-screen">
      <SiteNav sub={title} />

      <header className="site-shell section-space-compact">
        <p className="font-ui text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-[var(--champagne)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <p className="mt-4 max-w-[52ch] text-body text-[var(--text-dim)]">
          {introPrefix} <span className="text-[var(--text)]">{invite.sponsorBusinessName}</span>. {introSuffix}
        </p>
      </header>

      <section className="site-shell section-space-compact pt-0">
        <SubmissionForm
          token={secureToken}
          copy={{
            typeLabel, typeText, typeImage, typeLink, titleLabel, bodyLabel, ctaLabelLabel, ctaUrlLabel,
            mediaLabel, mediaHint, rightsLabel, submit, successTitle, successBody,
            errorRightsRequired, errorUnsafeUrl, errorMediaType, errorMediaSize, errorMediaSignature,
            errorRateLimited, errorGeneric,
          }}
        />
      </section>

      <SiteFooter />
    </main>
  );
}

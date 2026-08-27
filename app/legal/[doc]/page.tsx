import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { text } from '@/lib/copy/site-copy';
import type { CopyKey } from '@/lib/copy/defaults';

export const revalidate = 3600;

const DOCS: Record<string, CopyKey> = {
  terms: 'legal.terms.title',
  privacy: 'legal.privacy.title',
  contact: 'legal.contact.title',
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

type Props = { params: Promise<{ doc: string }> };

export default async function LegalPage({ params }: Props) {
  const { doc } = await params;
  const titleKey = DOCS[doc];
  if (!titleKey) notFound();

  const title = await text(titleKey);

  return (
    <main className="surface-ink min-h-screen">
      <SiteNav />

      <section className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] uppercase leading-none text-[var(--text)]">
          {title}
        </h1>
        <span className="rule-gold mt-6 block h-px w-24 opacity-80" />

        {doc === 'contact' ? (
          <div className="mt-8">
            <p className="max-w-[62ch] text-body text-[var(--text-dim)]">
              {await text('legal.contact.body')}
            </p>
            <dl className="mt-10 flex flex-col gap-5">
              {[
                [await text('legal.contact.partnerships'), 'partners@mjcobe.com'],
                [await text('legal.contact.press'), 'press@mjcobe.com'],
                [await text('legal.contact.support'), 'hello@mjcobe.com'],
              ].map(([label, email]) => (
                <div key={label} className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                  <dt className="w-36 shrink-0 font-ui text-[0.625rem] uppercase tracking-[0.2em] text-[var(--champagne)]">
                    {label}
                  </dt>
                  <dd className="font-mono text-sm text-[var(--text)]">{email}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
            {await text('legal.placeholder')}
          </p>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

import { ButtonLink } from '@/components/primitives/Button';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { text } from '@/lib/copy/site-copy';

export default async function NotFound() {
  return (
    <main className="surface-ink flex min-h-screen flex-col">
      <SiteNav />

      <section className="flex flex-1 items-center px-6 py-20 md:px-10">
        <div className="mx-auto w-full max-w-[92rem] text-center">
          <p className="font-display text-[clamp(5rem,18vw,12rem)] leading-none text-gold">
            {await text('notfound.code')}
          </p>
          <h1 className="mt-4 font-display text-[clamp(1.75rem,5vw,3.5rem)] uppercase leading-none text-[var(--text)]">
            {await text('notfound.title')}
          </h1>
          <p className="mx-auto mt-6 max-w-[52ch] text-body text-[var(--text-dim)]">
            {await text('notfound.body')}
          </p>
          <div className="mt-10">
            <ButtonLink href="/music" variant="primary" glow className="!rounded-sm">
              {await text('notfound.cta')}
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

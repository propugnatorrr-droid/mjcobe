import { ButtonLink } from '@/components/primitives/Button';
import { Eyebrow } from '@/components/primitives/Eyebrow';
import { Display } from '@/components/primitives/Display';
import { text } from '@/lib/copy/site-copy';

export default async function NotFound() {
  return (
    <main className="surface-ink flex min-h-screen items-center px-6 md:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <Eyebrow>{await text('notfound.code')}</Eyebrow>
        <div className="mt-8">
          <Display>{await text('notfound.title')}</Display>
        </div>
        <p className="mt-8 max-w-[62ch] text-body text-[var(--text-dim)]">
          {await text('notfound.body')}
        </p>
        <div className="mt-12">
          <ButtonLink href="/music" variant="ghost">
            {await text('notfound.cta')}
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}

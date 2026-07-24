import { useTranslation } from 'react-i18next';
import { ShieldIcon } from '@shared/components/icons';

/**
 * one-pass HeroBand — v6 (2026-07-24).
 *
 * Sits between the Navbar and the main action card. The brief (E) wanted
 * the container style to feel "real" instead of "unchanged from v4", so we
 * introduce this breathing band that frames each creation page.
 *
 *  - title (text-3xl) + subtitle (one line) + tagline (small caps),
 *  - hidden <lg so it never competes with the form on tablet/mobile,
 *  - centered text, generous vertical padding (~150-200px total).
 *
 * Three copy slots are i18n-driven so the band works in zh-CN / en.
 */
export default function HeroBand() {
  const { t } = useTranslation();
  return (
    <section
      data-testid="hero-band"
      className="hidden lg:block text-center pt-2 pb-10 lg:pt-4 lg:pb-14"
    >
      <div
        className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
        style={{
          background:
            'linear-gradient(135deg, rgba(74, 149, 255, 0.12) 0%, rgba(91, 181, 255, 0.18) 100%)',
          border: '1.5px solid rgba(74, 149, 255, 0.25)',
        }}
        aria-hidden="true"
      >
        <ShieldIcon className="h-6 w-6 text-[#4A95FF]" />
      </div>
      <h1 className="text-3xl sm:text-[2rem] font-bold tracking-tight text-[#3A2E5C] m-0">
        {t('hero.title')}
      </h1>
      <p className="mt-3 text-base sm:text-lg text-[#3A2E5C]/70 leading-relaxed">
        {t('hero.subtitle')}
      </p>
      <p className="mt-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#4A95FF]/80">
        {t('hero.tagline')}
      </p>
    </section>
  );
}

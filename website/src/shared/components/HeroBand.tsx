import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldIcon } from '@shared/components/icons';

/**
 * one-pass CompactInfo — v8 (2026-07-27).
 *
 * Replaces v6's big "HeroBand" (icon + text-3xl title + subtitle + tagline,
 * ~150-200px tall). Users said it ate too much vertical space and pushed the
 * action card below the fold. Now it's a single-row info hint card:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ 🛡  加密消息 · 浏览器本地加密，服务端只看密文      ✕     │
 *   └─────────────────────────────────────────────────────────┘
 *
 *   · height ~60-72px (vs ~180px before)
 *   · desktop only (mobile never had it — the in-card title covers that)
 *   · dismissible (× button); once dismissed it stays gone for the session
 *     via sessionStorage so repeat visitors see the action card immediately
 */
export default function HeroBand() {
  const { t } = useTranslation();
  const storageKey = 'onepass:hero-band-dismissed';
  const [dismissed, setDismissed] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.sessionStorage?.getItem(storageKey) === '1',
  );

  if (dismissed) return null;

  return (
    <section
      data-testid="hero-band"
      className="hidden lg:flex items-center gap-3 mt-1 mb-5 px-4 py-3 rounded-2xl text-sm"
      style={{
        background:
          'linear-gradient(180deg, rgba(74, 149, 255, 0.06) 0%, rgba(91, 181, 255, 0.04) 100%)',
        border: '1px solid rgba(74, 149, 255, 0.18)',
      }}
      aria-label={t('hero.title')}
    >
      <span
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(74, 149, 255, 0.14) 0%, rgba(91, 181, 255, 0.20) 100%)',
          border: '1px solid rgba(74, 149, 255, 0.28)',
        }}
        aria-hidden="true"
      >
        <ShieldIcon className="h-4 w-4 text-[#4A95FF]" />
      </span>
      <div className="flex-1 min-w-0 text-[#3A2E5C]/80 leading-snug">
        <span className="font-semibold text-[#3A2E5C]">
          {t('hero.title')}
        </span>
        <span className="mx-2 text-[#3A2E5C]/30">·</span>
        <span>{t('hero.subtitle')}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          try {
            window.sessionStorage?.setItem(storageKey, '1');
          } catch {
            /* sessionStorage may be blocked — ignore */
          }
          setDismissed(true);
        }}
        className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-lg text-[#3A2E5C]/40 hover:text-[#3A2E5C] hover:bg-white/60 transition-colors"
        aria-label={t('common.dismiss')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </section>
  );
}

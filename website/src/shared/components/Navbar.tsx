import { useConfig } from '../hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SettingsMenu from './SettingsMenu';

/**
 * one-pass Navbar — v4 "product-grade" layout (2026-07-24).
 *
 *   - sticky + backdrop-blur-xl + bg-white/65 (frosted glass over the page gradient)
 *   - taller (h-20 / 5rem) with extra horizontal padding
 *   - logo scaled up (40px), brand name text-lg/xl, semibold
 *   - container follows the same `max-w-5xl` / `wide:max-w-none` rule as
 *     <main> in App.tsx so nav line + content card share the same horizontal
 *     edges at every viewport (no misalignment at 1920px+)
 *   - about / settings: pill-shaped buttons with hover lift, larger 22px icons
 *
 * Inspired by Stripe / Linear / Vercel chrome — product-grade, not Bootstrap.
 */
export default function Navbar() {
  const { APP_NAME, LOGO_URL } = useConfig();
  const { t } = useTranslation();
  const location = useLocation();
  const onAbout = location.pathname === '/about';

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        borderColor: 'rgba(224, 230, 240, 0.7)',
        boxShadow: '0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 1px 20px rgba(58, 46, 92, 0.04)',
      }}
    >
      <div className="max-w-5xl wide:max-w-none mx-auto px-4 sm:px-6 lg:px-8 wide:px-12">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center min-w-0">
            <a
              className="flex items-center gap-2.5 sm:gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 min-w-0 group"
              href="#/"
              data-testid="nav-brand"
            >
              <img
                src={LOGO_URL ?? '/onepass.svg'}
                alt={APP_NAME ?? 'one-pass'}
                className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="text-lg sm:text-xl font-semibold tracking-tight text-[#3A2E5C] truncate">
                {APP_NAME ?? t('header.appName')}
              </span>
            </a>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href="#/about"
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                onAbout
                  ? 'bg-[#4A95FF]/10 text-[#4A95FF]'
                  : 'text-[#3A2E5C]/75 hover:text-[#3A2E5C] hover:bg-white/70'
              }`}
              data-testid="nav-about"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-[22px] h-[22px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
              <span className="hidden sm:inline">{t('header.buttonAbout')}</span>
            </a>
            <SettingsMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
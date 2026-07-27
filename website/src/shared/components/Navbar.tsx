import { useConfig } from '../hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SettingsMenu from './SettingsMenu';

/**
 * one-pass Navbar — v6 (2026-07-24).
 *
 *   - h-24 (96px) up from h-20 — more breathing room.
 *   - logo 48px up from 40px; brand text-2xl up from text-xl.
 *   - slogan underneath the brand (hidden <lg).
 *   - Top + bottom border lines (border-t + border-b) for a chunky frame.
 *   - Desktop menu: 文本 / 文件 in the center, "active" gets blue text + a
 *     2px bottom bar.
 *   - Mobile (<lg): hamburger button (right corner) opens the MobileMenu
 *     drawer; about / settings stay in the drawer.
 */
export default function Navbar() {
  const { APP_NAME, LOGO_URL } = useConfig();
  const { t } = useTranslation();
  const location = useLocation();
  const onAbout = location.pathname === '/about';
  const onText = location.pathname === '/' || location.pathname === '';
  const onFile = location.pathname.startsWith('/file');
  // Result pages live at /secret/:prefix/:uuid/:password (decrypt)
  // and /s/:uuid (legacy short-link decrypt). Both end in 'result'
  // semantically: the user just produced a link and we want a quick
  // "再发一个" / "New secret" CTA in the nav.
  const onResult =
    location.pathname.startsWith('/secret') ||
    location.pathname.startsWith('/s/');

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-xl border-t border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.72)',
        borderTopColor: 'rgba(255, 255, 255, 0.9)',
        borderBottomColor: 'rgba(224, 230, 240, 0.85)',
        boxShadow:
          '0 1px 0 rgba(255, 255, 255, 0.6) inset, 0 4px 24px rgba(58, 46, 92, 0.05), 0 1px 0 rgba(58, 46, 92, 0.03)',
      }}
      data-testid="navbar"
    >
      <div className="max-w-5xl wide:max-w-none mx-auto px-4 sm:px-6 lg:px-8 wide:px-12">
        <div className="flex items-center justify-between h-24">
          {/* LEFT — Brand (logo + name + slogan). */}
          <div className="flex items-center min-w-0">
            <a
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 min-w-0 group"
              href="#/"
              data-testid="nav-brand"
            >
              <img
                src={LOGO_URL ?? '/onepass.svg'}
                alt={APP_NAME ?? 'one-pass'}
                className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 transition-transform duration-200 group-hover:scale-[1.03]"
              />
              <span className="flex flex-col min-w-0 leading-tight">
                <span className="text-xl sm:text-2xl font-semibold tracking-tight text-[#3A2E5C] truncate">
                  {APP_NAME ?? t('header.appName')}
                </span>
                <span
                  className="hidden lg:block text-[11px] font-medium tracking-wide text-[#3A2E5C]/55 mt-0.5 truncate"
                  data-testid="nav-slogan"
                >
                  {t('nav.slogan')}
                </span>
              </span>
            </a>
          </div>

          {/* CENTER — desktop menu (hidden <lg). */}
          <nav
            aria-label="primary"
            className="hidden lg:flex items-center gap-1 lg:gap-2"
          >
            <NavLink
              href="#/"
              active={onText}
              label={t('nav.menuText')}
              testId="nav-text"
            />
            <NavLink
              href="#/file"
              active={onFile}
              label={t('nav.menuFile')}
              testId="nav-file"
            />
          </nav>

          {/* RIGHT — about / settings on desktop; hamburger slot on mobile. */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* About + Settings — desktop only (mobile gets them via drawer). */}
            <div className="hidden lg:flex items-center gap-1 sm:gap-2">
              {onResult && (
                <a
                  href="#/"
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-semibold rounded-full text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200"
                  style={{
                    background:
                      'linear-gradient(135deg, #4A95FF 0%, #5BB5FF 100%)',
                  }}
                  data-testid="nav-create-another"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                    stroke="currentColor"
                    className="w-[18px] h-[18px]"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>{t('nav.createAnother')}</span>
                </a>
              )}
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
                <span>{t('header.buttonAbout')}</span>
              </a>
              <SettingsMenu />
            </div>

            {/* Hamburger slot (mobile only). App.tsx renders the MobileMenu
                and passes the open state via a window CustomEvent. We just
                render the trigger here; the trigger ID is what App listens
                to. */}
            {onResult && (
              <a
                href="#/"
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full text-white shadow-sm active:scale-[0.95] transition-all duration-200"
                style={{
                  background:
                    'linear-gradient(135deg, #4A95FF 0%, #5BB5FF 100%)',
                }}
                aria-label={t('nav.createAnother')}
                data-testid="nav-create-another-mobile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                  stroke="currentColor"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </a>
            )}
            <button
              type="button"
              className="lg:hidden p-2 rounded-full hover:bg-white/70 transition-all duration-200 text-[#3A2E5C]/75 hover:text-[#3A2E5C]"
              aria-label={t('nav.mobileMenuOpen')}
              aria-controls="mobile-menu-drawer"
              data-testid="nav-mobile-menu-trigger"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('onepass:mobile-menu:toggle'));
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  label: string;
  testId: string;
}

function NavLink({ href, active, label, testId }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
        active
          ? 'text-[#4A95FF]'
          : 'text-[#3A2E5C]/75 hover:text-[#3A2E5C] hover:bg-white/70'
      }`}
      data-testid={testId}
    >
      <span>{label}</span>
      {/* Bottom-bar highlight for active link. */}
      <span
        aria-hidden="true"
        className={`absolute left-1/2 -translate-x-1/2 bottom-0.5 h-[2px] rounded-full transition-all duration-200 ${
          active ? 'w-6 bg-[#4A95FF]' : 'w-0 bg-transparent'
        }`}
      />
    </a>
  );
}

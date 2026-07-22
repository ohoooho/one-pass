import { useConfig } from '../hooks/useConfig';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import SettingsMenu from './SettingsMenu';

/**
 * one-pass Navbar — minimal: brand on left, [About + Settings] on right.
 * one-pass is text-only and zero-config, so no upload / requests / receipts
 * links in the navbar (those Yopass features are not exposed).
 */
export default function Navbar() {
  const { APP_NAME, LOGO_URL } = useConfig();
  const { t } = useTranslation();
  const location = useLocation();
  const onAbout = location.pathname === '/about';

  return (
    <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-lg border-b border-base-300">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center min-w-0">
            <a
              className="flex items-center text-lg font-bold tracking-tight text-base-content hover:text-primary transition-colors duration-200 px-2 py-1 rounded-md hover:bg-base-200 min-w-0"
              href="#/"
            >
              <img
                src={LOGO_URL ?? '/onepass.svg'}
                alt={APP_NAME ?? 'one-pass'}
                className="h-8 w-8 mr-2 sm:mr-3 shrink-0"
              />
              <span className="truncate">
                {APP_NAME ?? t('header.appName')}
              </span>
            </a>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href="#/about"
              className={`flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                onAbout
                  ? 'text-base-content bg-base-200'
                  : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
              }`}
              data-testid="nav-about"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
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

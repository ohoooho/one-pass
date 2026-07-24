import { useState, useEffect } from 'react';
import FeaturesSection from '@shared/components/FeaturesSection';
import CreateSecret from '@features/CreateSecret';
import { Routes, Route, HashRouter } from 'react-router-dom';
import { useConfig } from '@shared/hooks/useConfig';
import { useAuth } from '@shared/hooks/useAuth';
import Navbar from '@shared/components/Navbar';
import Prefetcher from '@features/display-secret/Prefetcher';
import ReadOnlyLanding from '@features/ReadOnlyLanding';
import LoginRequired from '@features/LoginRequired';
import About from '@features/about/About';
import { useTranslation } from 'react-i18next';
import MobileMenu from '@shared/components/MobileMenu';

/**
 * App shell — v6 (2026-07-24).
 *
 *  - HashRouter routes: '/' = text mode, '/file' = file mode, '/about' = about.
 *    TextSecretMode and SelfEncryptedFileMode are decoupled — no in-card Tab
 *    anymore (the tab was blocking the Nav changes in v4/v5).
 *  - MobileMenu state lives here so the hamburger (rendered inside Navbar)
 *    can open it via a window CustomEvent.
 */
export default function App() {
  const {
    DISABLE_UPLOAD,
    READ_ONLY,
    PRIVACY_NOTICE_URL,
    IMPRINT_URL,
    REQUIRE_AUTH,
  } = useConfig();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [loginUnavailable, setLoginUnavailable] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('login_error')) {
      window.history.replaceState(
        {},
        '',
        window.location.pathname + window.location.hash,
      );
      return true;
    }
    return false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wire up the hamburger trigger inside Navbar to this state.
  useEffect(() => {
    function onToggle() {
      setMobileMenuOpen(o => !o);
    }
    window.addEventListener('onepass:mobile-menu:toggle', onToggle);
    return () => {
      window.removeEventListener('onepass:mobile-menu:toggle', onToggle);
    };
  }, []);

  // Read pathname once for MobileMenu "active" highlights.
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const hash = window.location.hash || '#/';
    return hash.replace(/^#/, '') || '/';
  });
  useEffect(() => {
    function onHashChange() {
      const hash = window.location.hash || '#/';
      setPathname(hash.replace(/^#/, '') || '/');
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onText = pathname === '/' || pathname === '';
  const onFile = pathname.startsWith('/file');
  const onAbout = pathname.startsWith('/about');

  // Whether creation pages must show the login gate instead of their content.
  const needsLogin = REQUIRE_AUTH && !authLoading && !isAuthenticated;
  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{
        background:
          'linear-gradient(180deg, #F4F8FE 0%, #F8FAF7 60%, #FAFAFA 100%)',
      }}
    >
      <button
        onClick={() => {
          const main = document.getElementById('main-content');
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: 'start' });
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-content focus:rounded-md"
      >
        {t('accessibility.skipToContent')}
      </button>
      <HashRouter>
        <Navbar />

        {/* Main Content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full max-w-5xl wide:max-w-none mx-auto mb-auto px-4 sm:px-6 lg:px-8 wide:px-12 py-10 sm:py-14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="card bg-base-100 shadow-sm border border-base-300 lg:border-0 lg:shadow-none">
            <div className="card-body p-5 sm:p-8 lg:p-0">
              {loginUnavailable && (
                <div role="alert" className="alert alert-warning mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 shrink-0 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{t('auth.loginUnavailable')}</span>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setLoginUnavailable(false)}
                    aria-label={t('accessibility.dismiss')}
                  >
                    &times;
                  </button>
                </div>
              )}
              <Routes>
                <Route
                  path="/"
                  element={
                    READ_ONLY ? (
                      <ReadOnlyLanding />
                    ) : needsLogin ? (
                      <LoginRequired />
                    ) : (
                      <CreateSecret mode="text" />
                    )
                  }
                />
                <Route
                  path="/file"
                  element={
                    READ_ONLY ? (
                      <ReadOnlyLanding />
                    ) : needsLogin ? (
                      <LoginRequired />
                    ) : (
                      <CreateSecret mode="file" />
                    )
                  }
                />
                {/* /about is always available, even in READ_ONLY mode */}
                <Route path="/about" element={<About />} />
                {READ_ONLY ? (
                  <Route path="/upload" element={<ReadOnlyLanding />} />
                ) : needsLogin ? (
                  <Route path="/upload" element={<LoginRequired />} />
                ) : (
                  !DISABLE_UPLOAD && (
                    <Route path="/upload" element={<CreateSecret mode="text" />} />
                  )
                )}
                <Route
                  path="/:format/:key/:password"
                  element={<Prefetcher />}
                />
                <Route path="/:format/:key" element={<Prefetcher />} />
              </Routes>
            </div>
          </div>
          <FeaturesSection />
        </main>
      </HashRouter>

      {/* Mobile drawer (outside router — just controlled by App state). */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        textActive={onText}
        fileActive={onFile}
        aboutActive={onAbout}
      />

      {/* Footer */}
      <footer className="bg-base-100/50 border-t border-base-300">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <a
                href="#/about"
                className="text-base-content/70 hover:text-primary transition-colors duration-200 underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                {t('header.buttonAbout')}
              </a>
              <span className="text-base-content/40">•</span>
              {PRIVACY_NOTICE_URL && PRIVACY_NOTICE_URL.trim() && (
                <>
                  <a
                    href={PRIVACY_NOTICE_URL}
                    className="text-base-content/70 hover:text-primary transition-colors duration-200 underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('footer.privacyNotice')}
                  </a>
                  <span className="text-base-content/40">•</span>
                </>
              )}
              {IMPRINT_URL && IMPRINT_URL.trim() && (
                <>
                  <a
                    href={IMPRINT_URL}
                    className="text-base-content/70 hover:text-primary transition-colors duration-200 underline decoration-dotted underline-offset-4 hover:decoration-solid"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('footer.imprint')}
                  </a>
                  <span className="text-base-content/40">•</span>
                </>
              )}
              <span className="text-base-content/70">
                &copy; 2026{' '}
                <a
                  href="https://git.dbhys.com/ohoooho/one-pass"
                  className="text-primary hover:text-primary-focus font-medium transition-colors duration-200 underline decoration-dotted underline-offset-4 hover:decoration-solid"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  one-pass
                </a>
                {' '}· Apache-2.0 (forked from jhaals/yopass)
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

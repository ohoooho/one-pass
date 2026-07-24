import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * one-pass MobileMenu — v6 (2026-07-24).
 *
 * Hamburger button + slide-in drawer for viewports < lg.
 *
 *  - Trigger lives in the top-right of the Navbar (rendered there by App.tsx).
 *  - Drawer slides in from the right; backdrop is the page gradient.
 *  - Closes on:
 *      • backdrop click
 *      • Esc key
 *      • clicking any nav link
 *  - aria-expanded + aria-controls + focus return to trigger on close.
 */

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  /** Pathname currently treated as "text mode". */
  textActive: boolean;
  /** Pathname currently treated as "file mode". */
  fileActive: boolean;
  /** Pathname currently treated as "about". */
  aboutActive: boolean;
}

export default function MobileMenu({
  open,
  onClose,
  textActive,
  fileActive,
  aboutActive,
}: MobileMenuProps) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus first link when opened; return focus to trigger on close.
  useEffect(() => {
    if (open) {
      const firstLink = drawerRef.current?.querySelector<HTMLAnchorElement>(
        'a, button',
      );
      firstLink?.focus();
    } else {
      triggerRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(58, 46, 92, 0.35)' }}
        data-testid="mobile-menu-backdrop"
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('nav.mobileMenuLabel')}
        data-testid="mobile-menu-drawer"
        className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[78%] max-w-sm transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '-24px 0 60px -12px rgba(58, 46, 92, 0.18)',
        }}
      >
        <div className="flex items-center justify-between px-6 h-20 border-b border-[#E0E6F0]">
          <span className="text-base font-semibold text-[#3A2E5C]/80">
            {t('nav.mobileMenuLabel')}
          </span>
          <button
            ref={triggerRef}
            type="button"
            onClick={onClose}
            aria-label={t('nav.mobileMenuClose')}
            className="p-2 rounded-full hover:bg-white/70 transition-colors text-[#3A2E5C]/75"
            data-testid="mobile-menu-close"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="px-4 py-4 space-y-1.5">
          <MobileLink
            href="#/"
            active={textActive}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
            }
            label={t('nav.menuText')}
            onSelect={onClose}
            testId="mobile-menu-text"
          />
          <MobileLink
            href="#/file"
            active={fileActive}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            }
            label={t('nav.menuFile')}
            onSelect={onClose}
            testId="mobile-menu-file"
          />
          <MobileLink
            href="#/about"
            active={aboutActive}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                />
              </svg>
            }
            label={t('header.buttonAbout')}
            onSelect={onClose}
            testId="mobile-menu-about"
          />
        </nav>
        <div className="px-6 py-4 mt-4 border-t border-[#E0E6F0] text-xs text-[#3A2E5C]/55 leading-relaxed">
          {t('footer.privacyNotice')} · {t('about.apacheLicense')}
        </div>
      </div>
    </>
  );
}

interface MobileLinkProps {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  testId: string;
}

function MobileLink({ href, active, icon, label, onSelect, testId }: MobileLinkProps) {
  return (
    <a
      href={href}
      onClick={onSelect}
      data-testid={testId}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
        active
          ? 'bg-[#4A95FF]/10 text-[#4A95FF]'
          : 'text-[#3A2E5C]/80 hover:bg-white/80'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {active && (
        <span
          aria-hidden="true"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-[#4A95FF]"
        />
      )}
    </a>
  );
}

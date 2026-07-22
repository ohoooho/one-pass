import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InfoPopoverProps {
  /** i18n key under create namespace for the title (e.g. "infoA1Title"). */
  titleKey: string;
  /** i18n key under create namespace for the body (e.g. "infoA1Body"). */
  bodyKey: string;
  /** Optional i18n key for a "Learn more" link (no link rendered if omitted). */
  learnMoreKey?: string;
  /** Override side — defaults to "right" (popover opens to the right of the button). */
  side?: 'right' | 'left' | 'top' | 'bottom';
  /** Optional extra classes for the trigger button. */
  className?: string;
}

/**
 * Soft, unobtrusive ⓘ info button. Renders a small circle in `text-gray-400`
 * that expands to a popover with a short explanation. The popover can be
 * opened on hover (desktop) or click (mobile / keyboard).
 *
 * Design contract:
 *  - 12-14px, gray, no border (distinguish from KeyBox red/strong warning style)
 *  - desktop: hover opens + click also opens (keyboard friendly)
 *  - mobile: tap-to-toggle, click-outside closes
 *  - popover: small title + 1-2 short paragraphs + optional "learn more" link
 *
 * Translations live in create.infoA1Title / create.infoA1Body etc.
 */
export function InfoPopover({
  titleKey,
  bodyKey,
  learnMoreKey,
  side = 'right',
  className = '',
}: InfoPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  // Click-outside / Escape to close
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Hover handlers: open on enter, close after a tiny delay on leave so the
  // user can move their cursor into the popover without it vanishing.
  function onMouseEnter() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function onMouseLeave() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  }

  const positionClasses: Record<NonNullable<InfoPopoverProps['side']>, string> =
    {
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    };

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        type="button"
        aria-label={t(titleKey)}
        aria-expanded={open}
        onClick={e => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-[12px] leading-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        data-testid={`info-${titleKey}`}
      >
        <span aria-hidden="true">ⓘ</span>
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 w-72 max-w-[80vw] bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-left text-sm text-gray-700 ${positionClasses[side]}`}
        >
          <strong className="block text-gray-900 text-sm font-semibold mb-1">
            {t(titleKey)}
          </strong>
          <span className="block text-sm leading-relaxed whitespace-pre-line">
            {t(bodyKey)}
          </span>
          {learnMoreKey && (
            <a
              href="/about"
              className="block mt-2 text-xs text-primary hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {t(learnMoreKey)} →
            </a>
          )}
        </span>
      )}
    </span>
  );
}

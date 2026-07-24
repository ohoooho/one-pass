import { useState, useRef, useEffect } from 'react';

/**
 * one-pass Disclosure — v6 (2026-07-24).
 *
 * Headless-style collapsible used on mobile to tuck the "how it works"
 * helper content behind a single tap. The brief (D) wanted the helper
 * copy (about / key concept / ciphertext concept) collapsed by default on
 * <lg viewports so the form stays the visual anchor.
 *
 * Built on a real <button> + aria-expanded; uses CSS grid for smooth
 * height animation without hard-coding a max-height value.
 */

interface DisclosureProps {
  /** Summary line shown in the trigger button (e.g. "▸ 原理说明"). */
  summary: React.ReactNode;
  children: React.ReactNode;
  /** Optional initial open state. */
  defaultOpen?: boolean;
  /** data-testid for the root; trigger + panel get -trigger / -panel suffixes. */
  testId?: string;
  /** Extra class on the outer wrapper (border / radius / bg etc.). */
  className?: string;
  /** Inline style applied to the outer wrapper (lets callers set gradients). */
  style?: React.CSSProperties;
}

export default function Disclosure({
  summary,
  children,
  defaultOpen = false,
  testId = 'disclosure',
  className = '',
  style,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panelRef.current) return;
    // Trigger reflow so the grid-rows animation can settle.
  }, [children, open]);

  return (
    <div
      className={`rounded-2xl ${className}`}
      style={style}
      data-testid={testId}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`${testId}-panel`}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-[#3A2E5C]"
        data-testid={`${testId}-trigger`}
      >
        <span className="flex-1">{summary}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 shrink-0 text-[#4A95FF] transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
      <div
        id={`${testId}-panel`}
        ref={panelRef}
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
        }}
        data-testid={`${testId}-panel`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 text-sm text-[#3A2E5C]/75 leading-relaxed space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepItemData {
  id: number;
  title: string;
  /** Small icon name (purely visual). */
  icon?: 'key' | 'lock' | 'envelope' | 'link';
  /** Optional sub-label under the title. */
  hint?: string;
}

interface StepBarProps {
  steps: StepItemData[];
  /** Index (0-based) of the step the user is currently on. */
  current: number;
  className?: string;
}

/**
 * Horizontal stepper — v3 redesign (2026-07-23).
 *
 *  ●━━━━━━━●━━━━━━━●━━━━━━━○   (current = 2, 2 steps done)
 *  1        2        3        4
 *  plaintext key      cipher   link
 *
 * - Current: brand blue ring + bold title
 * - Done:    green check, mint connector
 * - Future:  gray ring, faded title
 *
 * ≥md (≥768px): horizontal full layout.
 * <md (<768px): horizontal compact — number badge + title only, no hints,
 *                smaller circles, smaller gaps. Stays single row.
 */
export function StepBar({ steps, current, className = '' }: StepBarProps) {
  return (
    <ol
      className={`flex flex-row items-start justify-between gap-1 sm:gap-2 md:gap-0 ${className}`}
      aria-label="加密步骤"
      data-testid="step-bar"
    >
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isCurrent = idx === current;
        const isLast = idx === steps.length - 1;

        const circleBase =
          'inline-flex items-center justify-center rounded-full shrink-0 font-semibold transition-all duration-200';
        const circleSize = 'w-8 h-8 text-sm md:w-10 md:h-10 md:text-base';

        const circleStyle = isCurrent
          ? {
              background: '#4A95FF',
              color: 'white',
              boxShadow: '0 0 0 4px rgba(74, 149, 255, 0.18)',
            }
          : isDone
            ? { background: '#7DD3C0', color: 'white' }
            : {
                background: 'white',
                color: '#3A2E5C',
                border: '2px solid #E0E6F0',
              };

        return (
          <li
            key={step.id}
            className="flex md:flex-col md:flex-1 md:items-center md:text-center items-center gap-1.5 md:gap-2 min-w-0 flex-1"
            data-testid={`step-bar-item-${step.id}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="flex items-center md:flex-col md:items-center md:w-full shrink-0">
              <div
                className={`${circleBase} ${circleSize}`}
                style={circleStyle}
                aria-hidden="true"
              >
                {isDone ? '✓' : step.id}
              </div>
              {!isLast && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-colors duration-200 ${
                    isDone ? 'bg-[#7DD3C0]' : 'bg-[#E0E6F0]'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="md:max-w-[10rem] md:mx-auto min-w-0">
              <div
                className={`text-xs md:text-sm font-semibold leading-tight ${
                  isCurrent
                    ? 'text-[#3A2E5C]'
                    : isDone
                      ? 'text-[#3A2E5C]/70'
                      : 'text-[#3A2E5C]/40'
                }`}
              >
                {step.title}
              </div>
              {step.hint && (
                <div className="text-xs text-[#3A2E5C]/50 mt-0.5 hidden md:block">
                  {step.hint}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

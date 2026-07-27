import { useTranslation } from 'react-i18next';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface PlaintextStepProps {
  value: string;
  onChange: (v: string) => void;
  /** react-hook-form register return for the secret field (kept for ref/name/onBlur). */
  registration?: UseFormRegisterReturn;
  error?: string;
}

/**
 * Step 1 — plaintext textarea.
 * "Where you type the secret you want to share."
 *
 * Owns the textarea; parent just supplies value/onChange so it can know
 * whether to enable the encrypt button without subscribing to form state.
 */
export function PlaintextStep({
  value,
  onChange,
  registration,
  error,
}: PlaintextStepProps) {
  const { t } = useTranslation();
  return (
    <section data-testid="step-1">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
          style={{ background: '#4A95FF' }}
          aria-hidden="true"
        >
          1
        </span>
        <h3 className="font-semibold text-base m-0 text-[#3A2E5C]">
          {t('create.step1Title')}
        </h3>
      </div>
      {/* v8 (2026-07-27): <label>+<span> removed — it just repeated the h3
          "输入明文" above. Placeholder now carries the role. */}
      <textarea
        id="secret"
        {...registration}
        value={value}
        onChange={e => {
          registration?.onChange(e);
          onChange(e.target.value);
        }}
        className="textarea w-full min-h-[100px] text-base p-4 resize-y rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4A95FF]/30 border-2 border-[#E0E6F0] focus:border-[#4A95FF] bg-white text-[#3A2E5C] placeholder:text-[#3A2E5C]/30"
        placeholder={t('create.inputSecretPlaceholder')}
        rows={3}
        data-testid="plaintext-input"
      />
      {error && (
        <p className="mt-2 text-sm font-medium text-[#B91C1C]">{error}</p>
      )}
    </section>
  );
}

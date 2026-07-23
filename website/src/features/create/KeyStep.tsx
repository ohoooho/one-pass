import { useTranslation } from 'react-i18next';
import { KeyBox } from '@shared/components/KeyBox';
import { InfoPopover } from '@shared/components/InfoPopover';

interface KeyStepProps {
  /** Which key strategy is active. */
  mode: 'auto' | 'custom';
  setMode: (m: 'auto' | 'custom') => void;
  /** Current key to display (may be empty in 'auto' mode before encrypt). */
  keyValue: string;
  /** Custom key input value (only used when mode === 'custom'). */
  customKey: string;
  onCustomKeyChange: (v: string) => void;
  /** Whether the form has been submitted yet (controls whether we show the key). */
  isBeforeEncrypt: boolean;
  /** Handler for the regenerate button (only meaningful in 'auto' mode). */
  onRegenerate?: () => void;
}

/**
 * Step 2 — Key selection.
 *
 * Two sub-options:
 *   ○ Auto-generate (recommended) — key is generated when user clicks Encrypt
 *   ● Use my own key             — input box, takes effect immediately
 *
 * Display rules:
 *   mode=auto,  isBeforeEncrypt=true  → "等待加密" placeholder
 *   mode=auto,  isBeforeEncrypt=false → show the actual generated key
 *   mode=custom, isBeforeEncrypt=true  → show the typed custom key (or empty)
 *   mode=custom, isBeforeEncrypt=false → show the typed custom key
 */
export function KeyStep({
  mode,
  setMode,
  keyValue,
  customKey,
  onCustomKeyChange,
  isBeforeEncrypt,
  onRegenerate,
}: KeyStepProps) {
  const { t } = useTranslation();
  const showWaiting = mode === 'auto' && isBeforeEncrypt;
  return (
    <section data-testid="step-2">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
          style={{ background: '#FCA5A5' }}
          aria-hidden="true"
        >
          2
        </span>
        <h3 className="font-semibold text-base m-0 text-[#3A2E5C]">
          {t('create.step2Title')}
        </h3>
        <InfoPopover
          titleKey="create.infoA1Title"
          bodyKey="create.infoA1Body"
          learnMoreKey="create.infoLearnMore"
        />
      </div>

      {/* Sub-option picker */}
      <div
        className="flex flex-col sm:flex-row gap-2 mb-3"
        role="radiogroup"
        aria-label={t('create.keyModeLabel')}
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'auto'}
          onClick={() => setMode('auto')}
          className={`flex-1 text-left px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
            mode === 'auto'
              ? 'border-[#4A95FF] bg-[#4A95FF]/5 shadow-sm'
              : 'border-[#E0E6F0] bg-white hover:border-[#A5D8FF]'
          }`}
          data-testid="key-mode-auto"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                mode === 'auto'
                  ? 'border-[#4A95FF] bg-[#4A95FF]'
                  : 'border-[#E0E6F0]'
              }`}
              aria-hidden="true"
            />
            <span className="font-semibold text-sm text-[#3A2E5C]">
              {t('create.keyModeAuto')}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium ml-auto"
              style={{ background: '#A5D8FF', color: '#1E40AF' }}
            >
              {t('create.keyModeRecommended')}
            </span>
          </div>
          <div className="text-xs text-[#3A2E5C]/60 mt-1 ml-6">
            {t('create.keyModeAutoHint')}
          </div>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'custom'}
          onClick={() => setMode('custom')}
          className={`flex-1 text-left px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${
            mode === 'custom'
              ? 'border-[#4A95FF] bg-[#4A95FF]/5 shadow-sm'
              : 'border-[#E0E6F0] bg-white hover:border-[#A5D8FF]'
          }`}
          data-testid="key-mode-custom"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                mode === 'custom'
                  ? 'border-[#4A95FF] bg-[#4A95FF]'
                  : 'border-[#E0E6F0]'
              }`}
              aria-hidden="true"
            />
            <span className="font-semibold text-sm text-[#3A2E5C]">
              {t('create.keyModeCustom')}
            </span>
          </div>
          <div className="text-xs text-[#3A2E5C]/60 mt-1 ml-6">
            {t('create.keyModeCustomHint')}
          </div>
        </button>
      </div>

      {mode === 'custom' && (
        <div className="mb-3">
          <input
            id="customKey"
            type="text"
            value={customKey}
            onChange={e => onCustomKeyChange(e.target.value)}
            className="input w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4A95FF]/30 border-2 border-[#E0E6F0] focus:border-[#4A95FF] font-mono text-sm bg-white text-[#3A2E5C] placeholder:text-[#3A2E5C]/30 h-12 px-4"
            placeholder={t('create.inputCustomPasswordPlaceholder')}
            data-testid="custom-key-input"
            autoComplete="off"
          />
        </div>
      )}

      {/* Key display box */}
      <KeyBox
        password={keyValue}
        onRegenerate={mode === 'auto' ? onRegenerate : undefined}
        waitingForEncrypt={showWaiting}
      />
    </section>
  );
}

import { useTranslation } from 'react-i18next';
import { LockIcon } from '@shared/components/icons';
import { InfoPopover } from '@shared/components/InfoPopover';

interface EncryptButtonProps {
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

/**
 * The main "加密消息" button.
 *
 * v3 (2026-07-23): uses SVG LockIcon instead of inline SVG lock path so the
 * icon scales with the button. Slightly larger h-16 for better thumb target
 * on mobile.
 */
export function EncryptButton({ loading, disabled, onSubmit }: EncryptButtonProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
        style={{
          background: 'linear-gradient(135deg, #4A95FF 0%, #5BB5FF 100%)',
          color: 'white',
        }}
        data-testid="submit-create"
      >
        {loading ? (
          <>
            <span
              className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>{t('create.encryptingMessage')}</span>
          </>
        ) : (
          <>
            <LockIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span>{t('create.buttonEncrypt')}</span>
            <InfoPopover
              titleKey="create.infoA6Title"
              bodyKey="create.infoA6Body"
              className="ml-1"
            />
          </>
        )}
      </button>
      {!loading && disabled && (
        <p className="text-xs text-[#3A2E5C]/50 mt-2 text-center">
          {t('create.buttonDisabledHint')}
        </p>
      )}
    </div>
  );
}

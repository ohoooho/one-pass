import { useTranslation } from 'react-i18next';
import { InfoPopover } from '@shared/components/InfoPopover';

interface EncryptButtonProps {
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

/**
 * The main "加密消息" button.
 *
 * Lives on its own so the parent can keep its form logic tight and so we
 * can easily swap the spinner / label later.
 */
export function EncryptButton({ loading, disabled, onSubmit }: EncryptButtonProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="w-full h-14 text-base font-semibold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
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

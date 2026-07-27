import { useTranslation } from 'react-i18next';
import { LinkIcon } from '@shared/components/icons';
import { InfoPopover } from '@shared/components/InfoPopover';

interface EncryptButtonProps {
  loading: boolean;
  disabled: boolean;
  onSubmit: () => void;
}

/**
 * The main "生成分享链接" button.
 *
 * v5 (2026-07-24):
 *  - Renamed from 加密消息 → 生成链接 (Yopass original).
 *  - Switched LockIcon → LinkIcon to match the new wording.
 *  - Kept the InfoPopover (still useful — explains what the link will look like).
 *
 * v8.1 (2026-07-27): dropped `buttonDisabledHint` subtext — the disabled
 * button itself + the textarea placeholder are enough.
 */
export function EncryptButton({ loading, disabled, onSubmit }: EncryptButtonProps) {
  const { t } = useTranslation();
  return (
    <div className="mt-5">
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
            <span>{t('create.buttonSubmitLoading')}</span>
          </>
        ) : (
          <>
            <LinkIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span>{t('create.buttonSubmit')}</span>
            <InfoPopover
              titleKey="create.infoA6Title"
              bodyKey="create.infoA6Body"
              className="ml-1"
            />
          </>
        )}
      </button>
      {/* v8.1 (2026-07-27) — drop the "请先在上方输入明文" subtext. The
          disabled button itself + the placeholder text on the textarea
          already say it; the extra line was just noise. */}
    </div>
  );
}

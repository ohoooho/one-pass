import { useTranslation } from 'react-i18next';

interface Props {
  password: string;
  onRegenerate?: () => void;
  /** Hide the key contents (e.g. when user toggled "use my own key"). */
  hidden?: boolean;
  /** When true, show a "等待加密" placeholder instead of an empty field. */
  waitingForEncrypt?: boolean;
}

/**
 * Soft-red bordered box that displays the decryption key (or password).
 *
 * Visual contract: soft red border + 🛡️ caption = "this NEVER leaves the
 * browser". The key never appears in any network request body or header —
 * it travels to the recipient only via the URL fragment, which HTTP strips
 * at the server boundary (RFC 3986 §3.5).
 *
 * Border colour is intentionally soft (#FCA5A5, not #EF4444) so the box
 * reads as "informational boundary", not "error".
 */
export function KeyBox({ password, onRegenerate, hidden, waitingForEncrypt }: Props) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="key-box"
      className="rounded-2xl p-4"
      style={{
        border: '1.5px solid #FCA5A5',
        background:
          'linear-gradient(135deg, rgba(254, 226, 226, 0.6) 0%, rgba(255, 245, 245, 0.6) 100%)',
      }}
    >
      <div className="flex items-center gap-3">
        <code
          className="flex-1 font-mono text-sm sm:text-base break-all bg-white/80 rounded-xl px-3 py-2.5 border border-[#FCA5A5]/40 min-h-[2.75rem] flex items-center text-[#3A2E5C]"
          data-testid="decryption-key"
        >
          {hidden
            ? t('about.keyHidden')
            : waitingForEncrypt
              ? t('create.keyWaitingPlaceholder')
              : password || t('about.keyEmpty')}
        </code>
        {onRegenerate && !hidden && !waitingForEncrypt && (
          <button
            type="button"
            onClick={onRegenerate}
            className="text-xs px-3 py-2 rounded-xl border border-[#FCA5A5]/50 bg-white hover:bg-[#FEF2F2] text-[#B91C1C] font-medium transition-colors shrink-0"
            data-testid="regenerate-key"
          >
            {t('about.regenerate')}
          </button>
        )}
      </div>
      <p className="text-sm mt-3 font-medium flex items-center gap-1.5" style={{ color: '#B91C1C' }}>
        <span aria-hidden="true">🛡️</span>
        <span>{t('about.redCaption')}</span>
      </p>
    </div>
  );
}

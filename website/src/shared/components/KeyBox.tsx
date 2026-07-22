import { useTranslation } from 'react-i18next';

interface Props {
  password: string;
  onRegenerate?: () => void;
  /** Hide the key contents (e.g. when user toggled "use my own key"). */
  hidden?: boolean;
}

/**
 * Red-bordered box that displays the decryption key (or password).
 *
 * Visual contract: red border + ❌ caption = "this NEVER leaves the browser".
 * The key never appears in any network request body or header — it travels
 * to the recipient only via the URL fragment, which HTTP strips at the
 * server boundary (RFC 3986 §3.5).
 */
export function KeyBox({ password, onRegenerate, hidden }: Props) {
  const { t } = useTranslation();
  return (
    <div
      data-testid="key-box"
      className="rounded-lg p-4 mt-2"
      style={{
        border: '2px solid #EF4444',
        background: '#FEF2F2',
      }}
    >
      <div className="flex items-center gap-3">
        <code
          className="flex-1 font-mono text-sm sm:text-base break-all bg-white/60 rounded px-3 py-2 border border-red-200 min-h-[2.5rem] flex items-center"
          data-testid="decryption-key"
        >
          {hidden ? t('about.keyHidden') : password || t('about.keyEmpty')}
        </code>
        {onRegenerate && !hidden && (
          <button
            type="button"
            onClick={onRegenerate}
            className="text-xs px-3 py-1.5 rounded border border-red-300 bg-white hover:bg-red-50 text-red-700 font-medium transition-colors shrink-0"
            data-testid="regenerate-key"
          >
            {t('about.regenerate')}
          </button>
        )}
      </div>
      <p className="text-sm mt-3 font-medium" style={{ color: '#B91C1C' }}>
        ❌ {t('about.redCaption')}
      </p>
    </div>
  );
}

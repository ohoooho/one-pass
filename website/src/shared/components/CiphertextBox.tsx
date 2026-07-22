import { useTranslation } from 'react-i18next';

interface Props {
  ciphertext: string;
  redacted?: boolean;
  /** Whether to hide the actual ciphertext text (used during live re-encryption to avoid flicker). */
  placeholder?: boolean;
}

/**
 * Green-bordered box that displays an OpenPGP ciphertext.
 *
 * Visual contract: green border + ✅ caption = "this is the ONLY thing the
 * server ever sees". Anything inside this box is allowed in the POST body.
 */
export function CiphertextBox({ ciphertext, redacted, placeholder }: Props) {
  const { t } = useTranslation();
  const display = placeholder ? '\n\n\n' : ciphertext;
  return (
    <div
      data-testid="ciphertext-box"
      className="rounded-lg p-4 mt-2"
      style={{
        border: '2px solid #7DD3C0',
        background: '#F0FDF4',
      }}
    >
      <pre
        className="overflow-auto text-xs sm:text-sm whitespace-pre-wrap break-all font-mono text-base-content/80"
        style={{ minHeight: '4rem', maxHeight: '14rem' }}
      >
        {display || '\n\n\n'}
      </pre>
      <p className="text-sm mt-3 font-medium" style={{ color: '#15803D' }}>
        ✅ {t('about.greenCaption')}
      </p>
      {redacted && (
        <p className="text-xs mt-1 opacity-70">{t('about.serverNeverSees')}</p>
      )}
    </div>
  );
}

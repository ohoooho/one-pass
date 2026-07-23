import { useTranslation } from 'react-i18next';

interface Props {
  ciphertext: string;
  redacted?: boolean;
  /** Whether to show a "等待加密" placeholder instead of an empty field. */
  waitingForEncrypt?: boolean;
}

/**
 * Soft-green bordered box that displays an OpenPGP ciphertext.
 *
 * Visual contract: soft green border + ✅ caption = "this is the ONLY thing
 * the server ever sees". Anything inside this box is allowed in the POST
 * body.
 *
 * Border colour is intentionally soft (#B8E6C1, not #16A34A) so the box
 * reads as "informational boundary", not "alert".
 */
export function CiphertextBox({ ciphertext, redacted, waitingForEncrypt }: Props) {
  const { t } = useTranslation();
  const display = waitingForEncrypt ? '' : ciphertext;
  return (
    <div
      data-testid="ciphertext-box"
      className="rounded-2xl p-4"
      style={{
        border: '1.5px solid #B8E6C1',
        background:
          'linear-gradient(135deg, rgba(220, 252, 231, 0.6) 0%, rgba(240, 253, 244, 0.6) 100%)',
      }}
    >
      <pre
        className="overflow-auto text-xs sm:text-sm whitespace-pre-wrap break-all font-mono text-[#3A2E5C]/80"
        style={{ minHeight: '4rem', maxHeight: '14rem' }}
      >
        {display || (waitingForEncrypt ? t('create.cipherWaitingPlaceholder') : '\n\n\n')}
      </pre>
      <p className="text-sm mt-3 font-medium flex items-center gap-1.5" style={{ color: '#15803D' }}>
        <span aria-hidden="true">✅</span>
        <span>{t('about.greenCaption')}</span>
      </p>
      {redacted && (
        <p className="text-xs mt-1 opacity-70 text-[#15803D]/80">{t('about.serverNeverSees')}</p>
      )}
    </div>
  );
}

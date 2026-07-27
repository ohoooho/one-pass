import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfig } from '@shared/hooks/useConfig';
import { useCopy } from '@shared/hooks/useCopy';
import {
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  RefreshIcon,
} from '@shared/components/icons';
import { encryptMessage } from '@shared/lib/crypto';
import { postSecret } from '@shared/lib/api';
import { randomString } from '@shared/lib/random';
import ReceiptStatus from '@features/display-secret/ReceiptStatus';

interface ResultProps {
  password: string;
  uuid: string;
  prefix: string;
  customPassword: boolean;
  oneTime: boolean;
  receiptToken?: string;
  /**
   * Original plaintext (only used if user clicks "Regenerate").
   * The result page does NOT persist this for security; the parent must
   * pass it down if it wants to support regeneration.
   */
  plaintext?: string;
  /** Original options so we can re-POST with the same expiration. */
  expirationSeconds?: number;
  /** Original read-receipt flag so we can re-POST with the same flag. */
  readReceipt?: boolean;
}

function CopyButton({
  copied,
  onClick,
  title,
  copyLabel,
  copiedLabel,
}: {
  copied: boolean;
  onClick: () => void;
  title: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  return (
    <button
      className={`btn btn-sm font-medium transition-all duration-200 shrink-0 mt-1 ${
        copied ? 'btn-success' : 'btn-primary'
      }`}
      onClick={onClick}
      title={title}
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

function Result({
  password,
  uuid,
  prefix,
  customPassword,
  oneTime,
  receiptToken,
  plaintext,
  expirationSeconds,
  readReceipt,
}: ResultProps) {
  const { t } = useTranslation();
  const config = useConfig();
  const baseURL = config.PUBLIC_URL
    ? config.PUBLIC_URL.replace(/\/$/, '')
    : window.location.origin;
  const { copy, isCopied } = useCopy();

  // Regenerate state
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [regenPair, setRegenPair] = useState<{ uuid: string; password: string } | null>(null);

  async function regenerate() {
    if (!plaintext) {
      setRegenError(t('result.regenerateNoPlaintext'));
      return;
    }
    setRegenLoading(true);
    setRegenError(null);
    try {
      const newKey = randomString();
      const newCipher = await encryptMessage(plaintext, newKey, config.ARGON2);
      const { data, status } = await postSecret(
        {
          expiration: expirationSeconds ?? 3600,
          message: newCipher,
          one_time: oneTime,
          require_auth: false,
          receipt: !!readReceipt,
        },
        config.OIDC_ENABLED,
      );
      if (status !== 200) {
        setRegenError(data.message ?? t('result.regenerateFailed'));
        return;
      }
      // Replace current link with the new one
      setRegenPair({ uuid: data.message, password: newKey });
    } catch (e) {
      setRegenError((e as Error).message ?? t('result.regenerateFailed'));
    } finally {
      setRegenLoading(false);
    }
  }

  // Use regenerated values if present, otherwise the originals.
  const activeUuid = regenPair?.uuid ?? uuid;
  const activePassword = regenPair?.password ?? password;
  const activeOneClick = `${baseURL}/#/${prefix}/${activeUuid}/${activePassword}`;
  const activeShort = `${baseURL}/#/${prefix}/${activeUuid}`;

  // v7.1 (2026-07-27) — toolbar removed.
  //   The "← 返回首页" link was redundant (Navbar logo is already `href="#/"`).
  //   The "+ 再发一个" button now lives in the Navbar (right side, only
  //   visible on Result pages) — keeps the page uncluttered and avoids the
  //   visual conflict with the outer card container.
  return (
    <>
      <div className="flex items-center gap-3 mb-2">
        <CheckCircleIcon className="h-7 w-7 text-success" />
        <h2 className="text-2xl font-bold text-[#3A2E5C]">{t('result.title')}</h2>
      </div>
      <p className="mb-6 text-base text-[#3A2E5C]/70">{t('result.subtitle')}</p>

      {oneTime && (
        <div
          className="mb-6 rounded-2xl p-4 flex items-start gap-3"
          style={{
            background: 'rgba(255, 216, 156, 0.25)',
            border: '1.5px solid rgba(255, 184, 77, 0.5)',
          }}
        >
          <InfoIcon className="w-6 h-6 shrink-0 text-[#92400E]" />
          <div>
            <div className="font-semibold text-base mb-1 text-[#3A2E5C]">
              {t('result.reminderTitle')}
            </div>
            <div className="text-sm text-[#3A2E5C]/70">
              {t('result.subtitleDownloadOnce')}
            </div>
          </div>
        </div>
      )}

      {regenError && (
        <div
          className="mb-4 rounded-2xl px-4 py-3 text-sm font-medium"
          style={{
            background: 'rgba(254, 226, 226, 0.6)',
            border: '1.5px solid #FCA5A5',
            color: '#B91C1C',
          }}
          role="alert"
        >
          {regenError}
        </div>
      )}

      {/* v8 (2026-07-27) — Regenerate row moved to the TOP.
           Previously it sat at the bottom, after all the ResultRows, so users
           who wanted to regenerate missed it (had to scroll). High-frequency
           operation → put it where the eye lands first; button now uses the
           primary gradient style and full width, matching the Submit button
           weight on the create page. */}
      {plaintext && !customPassword && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(165, 216, 255, 0.20) 0%, rgba(184, 230, 193, 0.20) 100%)',
            border: '1.5px solid rgba(74, 149, 255, 0.28)',
          }}
        >
          <div className="font-semibold text-base mb-1 text-[#3A2E5C] flex items-center gap-2">
            <RefreshIcon className="h-5 w-5 shrink-0 text-[#4A95FF]" />
            {t('result.regenerateTitle')}
          </div>
          <div className="text-sm text-[#3A2E5C]/70 mb-4">
            {t('result.regenerateDescription')}
          </div>
          <button
            type="button"
            onClick={regenerate}
            disabled={regenLoading}
            className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background:
                'linear-gradient(135deg, #4A95FF 0%, #5BB5FF 100%)',
              color: 'white',
            }}
            data-testid="regenerate-and-reupload"
          >
            {regenLoading ? (
              <>
                <span
                  className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>{t('result.regenerating')}</span>
              </>
            ) : (
              <>
                <RefreshIcon className="h-5 w-5 shrink-0" />
                <span>{t('result.regenerateButton')}</span>
              </>
            )}
          </button>
        </div>
      )}

      <ResultRow
        title={t('result.rowLabelOneClick')}
        description={t('result.rowOneClickDescription')}
        value={activeOneClick}
        copyId="oneClick"
        copy={copy}
        isCopied={isCopied}
        t={t}
      />
      <ResultRow
        title={t('result.rowLabelShortLink')}
        description={t('result.rowShortLinkDescription')}
        value={activeShort}
        copyId="shortLink"
        copy={copy}
        isCopied={isCopied}
        t={t}
      />
      <ResultRow
        title={t('result.rowLabelDecryptionKey')}
        description={t('result.rowDecryptionKeyDescription')}
        value={activePassword}
        copyId="password"
        copy={copy}
        isCopied={isCopied}
        t={t}
        mono
      />

      {receiptToken && <ReceiptStatus uuid={activeUuid} token={receiptToken} />}

    </>
  );
}

interface ResultRowProps {
  title: string;
  description: string;
  value: string;
  copyId: string;
  copy: (text: string, id?: string) => void;
  isCopied: (id?: string) => boolean;
  t: ReturnType<typeof useTranslation>['t'];
  mono?: boolean;
}

function ResultRow({
  title,
  description,
  value,
  copyId,
  copy,
  isCopied,
  t,
  mono,
}: ResultRowProps) {
  return (
    <div
      className="mb-4 p-5 rounded-2xl"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
        border: '1.5px solid #E0E6F0',
      }}
    >
      <div className="font-semibold text-base mb-1 text-[#3A2E5C]">{title}</div>
      <div className="text-sm text-[#3A2E5C]/70 mb-4">{description}</div>
      <div className="flex items-start gap-3">
        <CopyButton
          copied={isCopied(copyId)}
          onClick={() => copy(value, copyId)}
          title={`Copy ${copyId}`}
          copyLabel={t('common.copy')}
          copiedLabel={t('common.copied')}
        />
        <div className="flex-1 bg-white border border-[#E0E6F0] rounded-xl px-4 py-3 min-h-[2.5rem] min-w-0">
          <code
            className={`text-sm text-[#3A2E5C]/80 break-words leading-relaxed ${
              mono ? 'font-mono' : ''
            }`}
          >
            {value}
          </code>
        </div>
      </div>
    </div>
  );
}

export default Result;

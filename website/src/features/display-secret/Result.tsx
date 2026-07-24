import { useTranslation } from 'react-i18next';
import { useConfig } from '@shared/hooks/useConfig';
import { useCopy } from '@shared/hooks/useCopy';
import {
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
} from '@shared/components/icons';
import ReceiptStatus from '@features/display-secret/ReceiptStatus';

interface ResultProps {
  password: string;
  uuid: string;
  prefix: string;
  oneTime: boolean;
  receiptToken?: string;
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

/**
 * Result screen shown after a secret has been uploaded.
 *
 * v5 (2026-07-24): removed the "regenerate" UI (and its parent `plaintext`
 * prop) — the key is never shown to the user anymore, so there is nothing
 * to regenerate. Custom-password mode still works the same way.
 */
function Result({
  password,
  uuid,
  prefix,
  oneTime,
  receiptToken,
}: ResultProps) {
  const { t } = useTranslation();
  const config = useConfig();
  const baseURL = config.PUBLIC_URL
    ? config.PUBLIC_URL.replace(/\/$/, '')
    : window.location.origin;
  const { copy, isCopied } = useCopy();

  const oneClick = `${baseURL}/#/${prefix}/${uuid}/${password}`;
  const short = `${baseURL}/#/${prefix}/${uuid}`;

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

      <ResultRow
        title={t('result.rowLabelOneClick')}
        description={t('result.rowOneClickDescription')}
        value={oneClick}
        copyId="oneClick"
        copy={copy}
        isCopied={isCopied}
        t={t}
      />
      <ResultRow
        title={t('result.rowLabelShortLink')}
        description={t('result.rowShortLinkDescription')}
        value={short}
        copyId="shortLink"
        copy={copy}
        isCopied={isCopied}
        t={t}
      />
      <ResultRow
        title={t('result.rowLabelDecryptionKey')}
        description={t('result.rowDecryptionKeyDescription')}
        value={password}
        copyId="password"
        copy={copy}
        isCopied={isCopied}
        t={t}
        mono
      />

      {receiptToken && <ReceiptStatus uuid={uuid} token={receiptToken} />}

      <div className="flex justify-center mt-8">
        <button
          className="btn btn-ghost px-8 font-medium transition-all duration-200 rounded-xl"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          {t('result.buttonCreateAnother')}
        </button>
      </div>
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

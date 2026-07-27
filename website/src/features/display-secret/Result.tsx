import { useMemo, useState } from 'react';
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

  // v8.2 (2026-07-27) — "Copy IM message" template.
  // v8.4 (2026-07-27) — Avoid putting the bare URL in the message body.
  //   IM clients (WeChat / Slack / DingTalk / Telegram) pattern-match
  //   `http(s)://...` server-side for link unfurls/previews, which:
  //     1. burns one-time secrets before the recipient clicks,
  //     2. renders a bare URL as an unscary/untrustworthy card,
  //     3. leaks to the recipient that "this is just a link", with no
  //        context that it's an encrypted secret.
  //   Strategy: strip the protocol from the URL, and tell the recipient
  //   to prepend `https://` themselves (or paste into a browser bar
  //   that auto-completes). IM auto-fetchers don't pattern-match a
  //   bare `one-pass.ohoooho.com/#/secret/...` string.
  //
  //   Sender sees:
  //     - title
  //     - "IM 会预检链接，阅后即焚会失效 / 不可信卡片" — *why* not
  //       paste the link raw
  //     - "这是 https 协议链接" — the missing piece
  //     - bare URL (no protocol) — the thing to paste
  //     - (oneTime warn | open hint)
  //     - footer
  const imMessage = useMemo(() => {
    const protocol = activeOneClick.startsWith('https://') ? 'https://' : 'http://';
    const bareLink = activeOneClick.slice(protocol.length);
    const lines: string[] = [
      t('result.imMessageTitle'),
      '',
      t('result.imMessageWhyNoLink'),
      '',
      t('result.imMessageProtocolHint', { protocol: protocol.replace('://', '') }),
      '',
      bareLink,
      '',
      oneTime
        ? t('result.imMessageOneTimeWarn')
        : t('result.imMessageOpenHint'),
      '',
      t('result.imMessageFooter'),
    ];
    return lines.join('\n');
  }, [t, activeOneClick, oneTime]);

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

      {/* v8.2 (2026-07-27) — Send via IM card.
          Recipient-friendly wrapper that fights IM URL unfurl/auto-fetch.
          Pastes title + link + oneTime/open hint + footer in one block. */}
      <div
        className="mt-6 rounded-2xl p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(125, 211, 192, 0.16) 0%, rgba(165, 216, 255, 0.18) 100%)',
          border: '1.5px solid rgba(125, 211, 192, 0.4)',
        }}
      >
        <div className="font-semibold text-base mb-1 text-[#3A2E5C] flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.7}
            stroke="currentColor"
            className="h-5 w-5 shrink-0 text-[#0E9F6E]"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.426 5.972 5.972 0 0 1-.426-.474 5.96 5.96 0 0 1-1.213-3.967c.003-.092.012-.184.022-.274a5.97 5.97 0 0 1 .135-1.32A5.96 5.96 0 0 1 5.41 11.07a9.776 9.776 0 0 1 1.092-2.413A9.954 9.954 0 0 1 12 3c4.97 0 9 3.694 9 8.25Z"
            />
          </svg>
          {t('result.imMessageCardTitle')}
        </div>
        <div className="text-sm text-[#3A2E5C]/70 mb-4">
          {t('result.imMessageCardDescription')}
        </div>

        {/* Preview block — monospace, scrollable if long. Lets the user
            inspect what they'll be pasting. */}
        <pre
          data-testid="im-message-preview"
          className="text-xs leading-relaxed text-[#3A2E5C]/80 bg-white/80 border border-[#E0E6F0] rounded-xl px-4 py-3 mb-4 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono"
        >
          {imMessage}
        </pre>

        <button
          type="button"
          onClick={() => copy(imMessage, 'imMessage')}
          className="w-full h-12 text-base font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
          style={{
            background:
              'linear-gradient(135deg, #0E9F6E 0%, #2DD4BF 100%)',
            color: 'white',
          }}
          data-testid="copy-im-message"
        >
          {isCopied('imMessage') ? (
            <>
              <CheckIcon className="h-5 w-5 shrink-0" />
              <span>{t('result.imMessageCopied')}</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-5 w-5 shrink-0" />
              <span>{t('result.imMessageCopyButton')}</span>
            </>
          )}
        </button>
      </div>

      {/* v8.3 (2026-07-27) — Regenerate moved to the BOTTOM, below IM
           message card and ReceiptStatus. Rationale:
             1. After sharing, the next thing a user does is *copy the
                link* / *paste to IM* / *check the receipt* — not
                regenerate. Regenerate is a low-frequency escape hatch.
             2. v8 put it at the top in a heavy blue-gradient card and it
                was being mistaken for "再发一个" (Navbar CTA). Different
                semantics, different visual weight.
             3. Style: outline card (no fill, no shadow) with a thin
                border so it reads as a secondary action, not the main
                CTA of the page.
           The "再发一个" Navbar CTA is the primary way to start fresh;
           this card is the niche "I want to keep the same plaintext but
           swap the key" option. */}
      {plaintext && !customPassword && (
        <details
          className="mt-6 rounded-2xl border border-[#E0E6F0] bg-white/60 group"
          data-testid="regenerate-disclosure"
        >
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center gap-2.5 text-sm font-medium text-[#3A2E5C]/75 hover:text-[#3A2E5C] transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              stroke="currentColor"
              className="h-5 w-5 shrink-0 text-[#3A2E5C]/55 group-open:rotate-90 transition-transform"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <RefreshIcon className="h-4 w-4 shrink-0 text-[#3A2E5C]/55" />
            <span>{t('result.regenerateTitle')}</span>
            <span className="ml-auto text-xs text-[#3A2E5C]/45 hidden sm:inline">
              {t('result.regenerateDisclosureHint')}
            </span>
          </summary>
          <div className="px-5 pb-5 pt-1">
            <div className="text-sm text-[#3A2E5C]/70 mb-4">
              {t('result.regenerateDescription')}
            </div>
            <button
              type="button"
              onClick={regenerate}
              disabled={regenLoading}
              className="w-full h-11 text-sm font-semibold rounded-xl transition-all duration-200 border border-[#4A95FF]/40 text-[#4A95FF] bg-white hover:bg-[#4A95FF]/5 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              data-testid="regenerate-and-reupload"
            >
              {regenLoading ? (
                <>
                  <span
                    className="inline-block w-4 h-4 border-2 border-[#4A95FF]/30 border-t-[#4A95FF] rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  <span>{t('result.regenerating')}</span>
                </>
              ) : (
                <>
                  <RefreshIcon className="h-4 w-4 shrink-0" />
                  <span>{t('result.regenerateButton')}</span>
                </>
              )}
            </button>
          </div>
        </details>
      )}

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

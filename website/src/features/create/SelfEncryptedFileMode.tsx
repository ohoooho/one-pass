import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { SecretOptions } from '@shared/components/SecretOptions';
import { ShieldIcon } from '@shared/components/icons';
import Result from '@features/display-secret/Result';
import HeroBand from '@shared/components/HeroBand';
import Disclosure from '@shared/components/Disclosure';

type FormValues = {
  expiration: string;
  oneTime: boolean;
};

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB hard client-side cap
const SERVER_SAFE_CIPHERTEXT_BYTES = 7000;

interface SelfEncryptedFileModeProps {
  resetSignal: number;
}

/**
 * File mode — user already encrypted the file themselves (gpg/age/openssl),
 * we just store the ciphertext verbatim and put their key in the URL #.
 *
 * v6 (2026-07-24):
 *  - HeroBand moved up to CreateSecret wrapper (single source for hero band).
 *  - Help block is now a Disclosure so on mobile it collapses by default.
 *  - Submit button is sticky-bottom on mobile.
 *  - Card padding tightened; still no inner Tab (mode swap happens at Nav).
 */
export default function SelfEncryptedFileMode({
  resetSignal,
}: SelfEncryptedFileModeProps) {
  void resetSignal;
  const { t } = useTranslation();
  const config = useConfig();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ciphertext, setCiphertext] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [filename, setFilename] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readReceipt, setReadReceipt] = useState(false);
  const [receiptToken, setReceiptToken] = useState<string | undefined>();
  const [oneTime, setOneTime] = useState(true);
  const [result, setResult] = useState<{
    password: string;
    uuid: string;
  } | null>(null);

  // v8.3 (2026-07-27) — Tell Navbar when we're showing the Result view
  // so the '再发一个' CTA appears (URL is still '/file', path detection
  // misses us).
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('onepass:result:show', {
        detail: { show: !!result?.uuid },
      }),
    );
  }, [result?.uuid]);

  // v8.3b (2026-07-27) — Navbar '再发一个' dispatches this when clicked.
  // A bare <a href="#/"> can't reset our state because the URL is
  // already 'file', so the browser doesn't reload or fire any event.
  // Listen and clear our own result so the create form comes back.
  // Also clear ciphertext/filename so the user isn't misled by the
  // old file name on the form.
  useEffect(() => {
    function onCreateAnother() {
      setResult(null);
      setReceiptToken(undefined);
      setError(null);
      setCiphertext('');
      setFilename(null);
    }
    window.addEventListener('onepass:create-another', onCreateAnother);
    return () =>
      window.removeEventListener('onepass:create-another', onCreateAnother);
  }, []);

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      expiration: String(config?.DEFAULT_EXPIRY ?? 3600),
      oneTime: true,
    },
  });

  function readFile(file: File) {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(t('upload.fileTooLarge', { maxSize: '50 MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const comma = resultStr.indexOf(',');
      const payload = comma >= 0 ? resultStr.slice(comma + 1) : resultStr;
      setCiphertext(payload);
      setFilename(file.name);
    };
    reader.onerror = () => setError(t('upload.errorFailedToRead'));
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }

  async function onSubmit(form: FormValues) {
    setError(null);
    if (!ciphertext) {
      setError(t('create.fileMode.errorNoCiphertext'));
      return;
    }
    if (!customKey) {
      setError(t('create.fileMode.errorNoKey'));
      return;
    }
    if (ciphertext.length > SERVER_SAFE_CIPHERTEXT_BYTES) {
      setError(
        t('create.fileMode.errorTooLargeForServer', {
          limit: SERVER_SAFE_CIPHERTEXT_BYTES,
        }),
      );
      return;
    }
    const { data, status } = await postSecret(
      {
        expiration: parseInt(form.expiration),
        message: ciphertext,
        one_time: config.FORCE_ONETIME_SECRETS || oneTime,
        require_auth: false,
        receipt: config.READ_RECEIPTS && readReceipt,
      },
      config.OIDC_ENABLED,
    );
    if (status !== 200) {
      setError(data.message);
      return;
    }
    if (data.receipt_token) {
      saveNewReceipt(
        data.message,
        data.receipt_token,
        config.FORCE_ONETIME_SECRETS || oneTime,
        parseInt(form.expiration),
        'file',
      );
    }
    setReceiptToken(data.receipt_token);
    setResult({ password: customKey, uuid: data.message });
  }

  if (result) {
    return (
      <Result
        password={result.password}
        uuid={result.uuid}
        prefix="s"
        customPassword
        oneTime={config.FORCE_ONETIME_SECRETS || oneTime}
        receiptToken={receiptToken}
      />
    );
  }

  return (
    <>
      {/* v7 (2026-07-26) — HeroBand here instead of CreateSecret wrapper,
          so the result page stops showing it. */}
      <HeroBand />
      {/* ── v6 small subtitle (replaces the giant title) ── */}
      <h2 className="text-base sm:text-lg text-[#3A2E5C]/70 leading-relaxed mb-6 sm:mb-8 font-normal">
        {t('create.fileMode.subtitle')}
      </h2>

      {/* Help block — Disclosure so mobile collapses by default. */}
      <div className="mb-6 sm:mb-8">
        <Disclosure
          testId="file-help"
          summary={
            <span className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-[#4A95FF]" />
              {t('create.fileMode.helpTitle')}
            </span>
          }
          className="border border-[#E0E6F0]"
          style={{
            background:
              'linear-gradient(135deg, rgba(165, 216, 255, 0.10) 0%, rgba(184, 230, 193, 0.10) 100%)',
          }}
        >
          <p>{t('create.fileMode.helpIntro')}</p>
          <div className="text-sm text-[#3A2E5C]/70">
            {t('create.fileMode.helpCommand')}
          </div>
          <pre
            className="bg-white/80 rounded-xl p-3 text-xs overflow-x-auto whitespace-pre border border-[#E0E6F0] text-[#3A2E5C]/80 font-mono"
            data-testid="file-mode-help-command"
          >{t('create.fileMode.helpCommandExample')}</pre>
          <p className="text-xs text-[#3A2E5C]/60">
            {t('create.fileMode.helpCommandNote')}
          </p>
          <p className="text-xs text-[#3A2E5C]/60">
            {t('create.fileMode.helpSizeNote', {
              limit: SERVER_SAFE_CIPHERTEXT_BYTES,
            })}
          </p>
        </Disclosure>
      </div>

      {error && (
        <div
          className="mb-4 rounded-2xl px-4 py-3 text-sm font-medium"
          style={{
            background: 'rgba(254, 226, 226, 0.6)',
            border: '1.5px solid #FCA5A5',
            color: '#B91C1C',
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ── Action card — v4 product-grade shell ── */}
      <div
        className="relative rounded-[2rem] p-6 sm:p-10 lg:p-12"
        style={{
          background:
            'linear-gradient(180deg, #FFFFFF 0%, #FBFBFD 100%)',
          boxShadow:
            '0 1px 2px rgba(58, 46, 92, 0.04), 0 8px 30px rgba(58, 46, 92, 0.06), 0 24px 60px -12px rgba(74, 149, 255, 0.08)',
          border: '1px solid rgba(224, 230, 240, 0.9)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2rem]"
          style={{
            boxShadow:
              'inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(58, 46, 92, 0.02)',
          }}
        />
        <div className="relative">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-7 sm:space-y-9">
              {/* Drop zone */}
              <section>
                <div
                  data-testid="file-drop-zone"
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                    dragActive ? 'border-[#4A95FF]' : 'border-[#E0E6F0]'
                  }`}
                  style={{
                    background: dragActive
                      ? 'rgba(74, 149, 255, 0.05)'
                      : 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) readFile(f);
                    }}
                  />
                  <button
                    type="button"
                    className="cursor-pointer block w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-12 h-12 text-[#3A2E5C]/50"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
                        />
                      </svg>
                      <div className="mt-2 font-semibold text-[#3A2E5C]">
                        {filename ?? t('create.fileMode.dropzoneText')}
                      </div>
                      <div className="text-sm text-[#3A2E5C]/60">
                        {t('create.fileMode.maxFileSize', { size: '50 MB' })}
                      </div>
                    </div>
                  </button>
                </div>
              </section>

              {/* Ciphertext preview textarea */}
              <section>
                <label className="label" htmlFor="ciphertext">
                  <span className="label-text text-sm font-semibold text-[#3A2E5C]">
                    {t('create.fileMode.ciphertextLabel')}
                  </span>
                </label>
                <textarea
                  id="ciphertext"
                  data-testid="file-ciphertext"
                  value={ciphertext}
                  onChange={e => {
                    setCiphertext(e.target.value);
                    setFilename(null);
                  }}
                  className="textarea w-full min-h-[120px] text-xs font-mono p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4A95FF]/30 border-2 border-[#E0E6F0] focus:border-[#4A95FF] bg-white text-[#3A2E5C]"
                  placeholder={t('create.fileMode.ciphertextPlaceholder')}
                />
                {ciphertext && (
                  <p className="text-xs text-[#3A2E5C]/60 mt-1">
                    {t('create.fileMode.ciphertextSize', {
                      size: ciphertext.length.toLocaleString(),
                      limit: SERVER_SAFE_CIPHERTEXT_BYTES.toLocaleString(),
                    })}
                  </p>
                )}
              </section>

              {/* Custom key (REQUIRED — never generated in this mode) */}
              <section>
                <label className="label" htmlFor="customKey">
                  <span className="label-text text-sm font-semibold text-[#3A2E5C]">
                    {t('create.fileMode.keyLabel')}
                  </span>
                </label>
                <input
                  id="customKey"
                  type="text"
                  value={customKey}
                  onChange={e => setCustomKey(e.target.value)}
                  className="input w-full rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4A95FF]/30 border-2 border-[#E0E6F0] focus:border-[#4A95FF] font-mono text-sm bg-white text-[#3A2E5C] h-12 px-4"
                  placeholder={t('create.fileMode.keyPlaceholder')}
                  data-testid="file-key"
                />
                <p className="text-xs text-[#3A2E5C]/60 mt-1">
                  {t('create.fileMode.keyHint')}
                </p>
              </section>

              <SecretOptions
                register={register}
                setValue={setValue}
                oneTime={oneTime}
                setOneTime={setOneTime}
                requireAuth={false}
                setRequireAuth={() => {
                  /* noop */
                }}
                readReceipt={readReceipt}
                setReadReceipt={setReadReceipt}
                expirationLabel={t('create.fileMode.expirationLabel')}
              />
            </div>

            {/* Sticky bottom submit on mobile. */}
            <div className="fixed bottom-0 left-0 right-0 z-20 lg:static lg:z-auto">
              <div
                className="lg:bg-transparent"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  boxShadow:
                    '0 -8px 24px -8px rgba(58, 46, 92, 0.12), 0 -1px 0 rgba(224, 230, 240, 0.8) inset',
                }}
              >
                <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] lg:p-0 lg:pt-8">
                  <button
                    type="submit"
                    disabled={!ciphertext || !customKey}
                    className="w-full h-14 text-base font-semibold rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #4A95FF 0%, #5BB5FF 100%)',
                      color: 'white',
                    }}
                    data-testid="file-submit"
                  >
                    {t('create.fileMode.submit')}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-5 flex items-start gap-2.5 text-sm text-[#3A2E5C]/65 leading-relaxed">
            <ShieldIcon className="h-5 w-5 shrink-0 text-[#4A95FF] mt-0.5" />
            <p>{t('create.reassurance')}</p>
          </div>
        </div>
      </div>
    </>
  );
}

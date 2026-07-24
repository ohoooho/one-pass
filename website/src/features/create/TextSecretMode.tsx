import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { encryptMessage } from '@shared/lib/crypto';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { CiphertextBox } from '@shared/components/CiphertextBox';
import { randomString } from '@shared/lib/random';
import { ShieldIcon } from '@shared/components/icons';
import Result from '@features/display-secret/Result';
import { PlaintextStep } from './PlaintextStep';
import { KeyStep } from './KeyStep';
import { EncryptButton } from './EncryptButton';
import { SecretOptions } from '@shared/components/SecretOptions';

type KeyMode = 'auto' | 'custom';

type Secret = {
  secret: string;
  expiration: string;
  oneTime: boolean;
};

/**
 * 4-step transparent encryption UI for plain text — v4 layout (2026-07-24).
 *
 * v4 redesign (vs v3):
 *  - Removed top StepBar (duplicates "① plaintext" badge in form below).
 *  - Added ≥1920px (2K/4K) two-column layout:
 *      left 5/12  → title + tagline + 3 trust bullets + trust strip
 *      right 7/12 → form card
 *  - <1920px keeps the v3 single-column flow: title above card,
 *    but card stays max-w-3xl (tighter than v3's max-w-5xl).
 *  - Mobile (<768px): stacks naturally, no two-column.
 *
 * Each form step (plaintext / key / ciphertext / options) still carries its
 * own step badge so users have a local anchor; only the redundant top
 * stepper is gone.
 */
export default function TextSecretMode() {
  const { t } = useTranslation();
  const config = useConfig();

  const {
    register,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Secret>({
    defaultValues: { expiration: String(config.DEFAULT_EXPIRY ?? 3600) },
  });

  // Mirror form values into plain state so the parent owns encrypt timing.
  const plaintext = watch('secret') ?? '';
  const expiration = watch('expiration') ?? String(config.DEFAULT_EXPIRY ?? 3600);

  // Key strategy is now plain useState — no more react-hook-form coupling.
  const [keyMode, setKeyMode] = useState<KeyMode>('auto');
  const [customKey, setCustomKey] = useState('');
  // Generate a fresh random key on mount so it's visible immediately in auto mode.
  const [generatedKey, setGeneratedKey] = useState(() => randomString());
  const regenerateKey = () => setGeneratedKey(randomString());
  const [ciphertextPreview, setCiphertextPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [requireAuth, setRequireAuth] = useState(false);
  const [readReceipt, setReadReceipt] = useState(false);
  const [oneTime, setOneTime] = useState(true);

  const [result, setResult] = useState<{
    password: string;
    uuid: string;
    customPassword: boolean;
  } | null>(null);
  const [receiptToken, setReceiptToken] = useState<string | undefined>();

  async function onSubmit() {
    if (!plaintext) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const pw = keyMode === 'auto' ? randomString() : customKey;
      if (!pw) {
        setServerError(t('create.errorNoKey'));
        setSubmitting(false);
        return;
      }
      const ct = await encryptMessage(plaintext, pw, config.ARGON2);
      const { data, status } = await postSecret(
        {
          expiration: parseInt(expiration, 10),
          message: ct,
          one_time: config.FORCE_ONETIME_SECRETS || oneTime,
          require_auth: requireAuth,
          receipt: config.READ_RECEIPTS && readReceipt,
        },
        config.OIDC_ENABLED,
      );
      if (status !== 200) {
        setServerError(data.message ?? t('create.errorGeneric'));
        return;
      }
      setReceiptToken(data.receipt_token);
      if (data.receipt_token) {
        saveNewReceipt(
          data.message,
          data.receipt_token,
          config.FORCE_ONETIME_SECRETS || oneTime,
          parseInt(expiration, 10),
        );
      }
      setGeneratedKey(pw);
      setCiphertextPreview(ct);
      setResult({ password: pw, uuid: data.message, customPassword: keyMode === 'custom' });
    } catch (e) {
      setServerError((e as Error).message ?? t('create.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }

  if (result?.uuid) {
    return (
      <Result
        password={result.password}
        uuid={result.uuid}
        prefix="s"
        customPassword={result.customPassword}
        oneTime={config.FORCE_ONETIME_SECRETS || oneTime}
        receiptToken={receiptToken}
        plaintext={keyMode === 'auto' ? plaintext : undefined}
        expirationSeconds={parseInt(expiration, 10)}
        readReceipt={config.READ_RECEIPTS && readReceipt}
      />
    );
  }

  const submitDisabled =
    !plaintext || (keyMode === 'custom' && !customKey) || submitting;

  return (
    <>
      {/* ── Hero band (single-column only; on wide layouts it lives in the sidebar) ── */}
      <div className="text-center mb-6 sm:mb-8 wide:hidden">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-[#3A2E5C] tracking-tight">
          {t('create.title')}
        </h2>
        <p className="text-base sm:text-lg text-[#3A2E5C]/70 max-w-2xl mx-auto leading-relaxed">
          {t('create.subtitle')}
        </p>
      </div>

      {/* ── v4 responsive grid ────────────────────────────────────
            <1920px: stays single column (max-w-3xl wraps the form card below)
            ≥1920px : 5/7 two-column with sidebar copy on the left
       */}
      <div className="wide:grid wide:grid-cols-12 wide:gap-10 wide:items-start">
        {/* Sidebar (≥1920px only) — fills the empty real estate. */}
        <aside className="hidden wide:block wide:col-span-5 wide:sticky wide:top-8">
          <div className="space-y-7">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold mb-4 text-[#3A2E5C] tracking-tight leading-tight">
                {t('create.title')}
              </h2>
              <p className="text-base xl:text-lg text-[#3A2E5C]/70 leading-relaxed">
                {t('create.subtitle')}
              </p>
            </div>

            <ul className="space-y-5">
              <li className="flex gap-3">
                <ShieldIcon className="h-6 w-6 text-[#4A95FF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#3A2E5C] text-base">
                    {t('create.benefit1Title')}
                  </p>
                  <p className="text-sm text-[#3A2E5C]/70 leading-relaxed mt-1">
                    {t('create.benefit1Desc')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-6 w-6 text-[#4A95FF] shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-[#3A2E5C] text-base">
                    {t('create.benefit2Title')}
                  </p>
                  <p className="text-sm text-[#3A2E5C]/70 leading-relaxed mt-1">
                    {t('create.benefit2Desc')}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-6 w-6 text-[#4A95FF] shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 12.75a1.5 1.5 0 0 0 1.5-1.5V7.5a1.5 1.5 0 0 0-3 0v3.75a1.5 1.5 0 0 0 1.5 1.5Z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-[#3A2E5C] text-base">
                    {t('create.benefit3Title')}
                  </p>
                  <p className="text-sm text-[#3A2E5C]/70 leading-relaxed mt-1">
                    {t('create.benefit3Desc')}
                  </p>
                </div>
              </li>
            </ul>

            <div className="pt-6 border-t border-[#E0E6F0] space-y-1.5">
              <p className="text-sm font-semibold text-[#3A2E5C]/80">
                {t('create.trustStrip')}
              </p>
              <p className="text-xs text-[#3A2E5C]/60 leading-relaxed">
                {t('create.trustNote')}
              </p>
            </div>
          </div>
        </aside>

        {/* Form column — single-column on small/medium, 7/12 on ≥1920. */}
        <div className="wide:col-span-7">
          {errors.secret && (
            <div className="mb-4 text-[#B91C1C] text-sm font-medium">
              {errors.secret.message?.toString()}
            </div>
          )}
          {serverError && (
            <div
              className="mb-4 rounded-2xl px-4 py-3 text-sm font-medium"
              style={{
                background: 'rgba(254, 226, 226, 0.6)',
                border: '1.5px solid #FCA5A5',
                color: '#B91C1C',
              }}
              role="alert"
            >
              {serverError}
            </div>
          )}

          {/* Action card */}
          <div
            className="rounded-3xl p-5 sm:p-8 lg:p-10 shadow-sm"
            style={{
              background:
                'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
              border: '1.5px solid #E0E6F0',
            }}
          >
            <div className="space-y-7 sm:space-y-9">
              <PlaintextStep
                value={plaintext}
                onChange={(v) => {
                  setValue('secret', v, { shouldValidate: false, shouldDirty: true });
                }}
                registration={register('secret')}
                error={errors.secret?.message?.toString()}
              />

              <KeyStep
                mode={keyMode}
                setMode={setKeyMode}
                keyValue={keyMode === 'custom' ? customKey : generatedKey || ''}
                customKey={customKey}
                onCustomKeyChange={setCustomKey}
                isBeforeEncrypt={false}
                onRegenerate={regenerateKey}
              />

              <section data-testid="step-3">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
                    style={{ background: '#7DD3C0' }}
                    aria-hidden="true"
                  >
                    3
                  </span>
                  <h3 className="font-semibold text-base m-0 text-[#3A2E5C]">
                    {t('create.step3Title')}
                  </h3>
                </div>
                <CiphertextBox
                  ciphertext={ciphertextPreview}
                  waitingForEncrypt={!ciphertextPreview}
                />
              </section>

              <SecretOptions
                register={register}
                setValue={setValue}
                oneTime={oneTime}
                setOneTime={setOneTime}
                requireAuth={requireAuth}
                setRequireAuth={setRequireAuth}
                readReceipt={readReceipt}
                setReadReceipt={setReadReceipt}
              />
            </div>

            <EncryptButton
              loading={submitting}
              disabled={submitDisabled}
              onSubmit={() => {
                if (!plaintext) {
                  setError('secret', { type: 'required', message: t('create.errorNoPlaintext') });
                  return;
                }
                onSubmit();
              }}
            />

            <div className="mt-5 flex items-start gap-2.5 text-sm text-[#3A2E5C]/65 leading-relaxed">
              <ShieldIcon className="h-5 w-5 shrink-0 text-[#4A95FF] mt-0.5" />
              <p>{t('create.reassurance')}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
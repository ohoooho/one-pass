import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { encryptMessage } from '@shared/lib/crypto';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { randomString } from '@shared/lib/random';
import { ShieldIcon, KeyIcon, LockIcon } from '@shared/components/icons';
import Result from '@features/display-secret/Result';
import { PlaintextStep } from './PlaintextStep';
import { EncryptButton } from './EncryptButton';
import { SecretOptions } from '@shared/components/SecretOptions';

type Secret = {
  secret: string;
  expiration: string;
  oneTime: boolean;
};

/**
 * 4-step transparent encryption UI for plain text — v5 layout (2026-07-24).
 *
 * v5 redesign (vs v4):
 *  - Swapped columns: left = primary action (form), right = auxiliary info
 *    (about + "key generated locally" + "ciphertext created locally" + trust).
 *  - Killed the giant "加密消息" h1 — replaced with a small one-line subtitle
 *    in the action card header (i18n: create.heroSubtitle).
 *  - Button text back to "生成链接" / "Generate link" (create.buttonSubmit).
 *  - Removed KeyStep + KeyBox + CiphertextBox + Result-regenerate: the key is
 *    now auto-generated internally on submit and never shown to the user.
 *  - ≥1920px (wide): two-column. Left form card is the visual anchor; right
 *    sidebar is a quieter "concept" column (smaller headings, lighter bg,
 *    no boxed step badges).
 *  - <1920px: single column, form first then auxiliary info stacked below.
 *
 * Each form step (plaintext / options) still carries its own step badge so
 * users have a local anchor; only the redundant top stepper stays gone.
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

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [requireAuth, setRequireAuth] = useState(false);
  const [readReceipt, setReadReceipt] = useState(false);
  const [oneTime, setOneTime] = useState(true);

  const [result, setResult] = useState<{
    password: string;
    uuid: string;
  } | null>(null);
  const [receiptToken, setReceiptToken] = useState<string | undefined>();

  async function onSubmit() {
    if (!plaintext) return;
    setSubmitting(true);
    setServerError(null);
    try {
      // Auto-generate a fresh random key — never displayed to the user.
      // The key is appended to the URL fragment when sharing, so the
      // server can never see it (RFC 3986 §3.5).
      const pw = randomString();
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
      setResult({ password: pw, uuid: data.message });
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
        oneTime={config.FORCE_ONETIME_SECRETS || oneTime}
        receiptToken={receiptToken}
      />
    );
  }

  const submitDisabled = !plaintext || submitting;

  return (
    <>
      {/* ── v5 responsive grid ────────────────────────────────────
            <1920px: single column, form first, auxiliary info below
            ≥1920px : 7/5 two-column with form on the LEFT (visual anchor) */}
      <div className="wide:grid wide:grid-cols-12 wide:gap-10 wide:items-start">
        {/* ── LEFT (form) — primary action ─────────────────────── */}
        <div className="wide:col-span-7 wide:order-1">
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

          {/* Action card — v4 product-grade shell. */}
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
            {/* Subtle inner highlight ring (Stripe-style). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[2rem]"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(58, 46, 92, 0.02)',
              }}
            />
            <div className="relative">
              {/* Small hero subtitle — replaces the giant "加密消息" h1. */}
              <h2 className="text-base sm:text-lg text-[#3A2E5C]/70 leading-relaxed mb-6 sm:mb-8 font-normal">
                {t('create.heroSubtitle')}
              </h2>

              <div className="space-y-7 sm:space-y-9">
                <PlaintextStep
                  value={plaintext}
                  onChange={(v) => {
                    setValue('secret', v, { shouldValidate: false, shouldDirty: true });
                  }}
                  registration={register('secret')}
                  error={errors.secret?.message?.toString()}
                />

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

        {/* ── RIGHT (auxiliary) — quieter concept column ───────── */}
        <aside className="wide:col-span-5 wide:order-2 mt-8 wide:mt-0 wide:sticky wide:top-8 space-y-5 wide:space-y-6">
          {/* About one-pass — short, plain text block. */}
          <div>
            <h3 className="text-base font-semibold text-[#3A2E5C] mb-2 flex items-center gap-2">
              <LockIcon className="h-5 w-5 text-[#4A95FF] shrink-0" />
              {t('create.sidebar.aboutTitle')}
            </h3>
            <p className="text-sm text-[#3A2E5C]/70 leading-relaxed">
              {t('create.sidebar.aboutBody')}
            </p>
          </div>

          {/* Key generated in your browser — concept only, no key shown. */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(165, 216, 255, 0.10)',
              border: '1px solid rgba(165, 216, 255, 0.30)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <KeyIcon className="h-5 w-5 text-[#4A95FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-[#3A2E5C]">
                  {t('create.sidebar.keyTitle')}
                </p>
                <p className="text-xs text-[#3A2E5C]/65 leading-relaxed mt-1">
                  {t('create.sidebar.keyBody')}
                </p>
              </div>
            </div>
          </div>

          {/* Ciphertext created in your browser — concept only, no ct shown. */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(184, 230, 193, 0.15)',
              border: '1px solid rgba(125, 211, 192, 0.30)',
            }}
          >
            <div className="flex items-start gap-2.5">
              <LockIcon className="h-5 w-5 text-[#4A95FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-[#3A2E5C]">
                  {t('create.sidebar.cipherTitle')}
                </p>
                <p className="text-xs text-[#3A2E5C]/65 leading-relaxed mt-1">
                  {t('create.sidebar.cipherBody')}
                </p>
              </div>
            </div>
          </div>

          {/* Trust strip — GitHub + license, kept from v4. */}
          <div className="pt-4 border-t border-[#E0E6F0] space-y-1.5">
            <p className="text-sm font-semibold text-[#3A2E5C]/80">
              {t('create.trustStrip')}
            </p>
            <p className="text-xs text-[#3A2E5C]/60 leading-relaxed">
              {t('create.trustNote')}
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

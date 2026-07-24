import { useState, useEffect } from 'react';
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
import Disclosure from '@shared/components/Disclosure';

type KeyMode = 'auto' | 'custom';

type Secret = {
  secret: string;
  expiration: string;
  oneTime: boolean;
};

/**
 * 4-step transparent encryption UI for plain text — v6 layout (2026-07-24).
 *
 * v6 redesign (vs v5):
 *  - Two-column grid activates at ≥lg (1024px), not ≥wide (1920px).
 *      v5:  only 2K/4K got two columns; 1280-1919 still stacked.
 *      v6:  every "PC" — including iPad landscape — gets the two-column
 *           layout, matching the user's brief A.
 *  - In-card Tab removed (now lives as top-bar Nav links).
 *  - On <lg the right column's transparency content (about + KeyStep +
 *    CiphertextBox + trust strip) collapses into a single Disclosure
 *    ("原理说明") so the form stays the visual anchor on mobile.
 *  - The main "生成链接" button sticks to the bottom on mobile so it's
 *    always within thumb reach.
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

  const plaintext = watch('secret') ?? '';
  const expiration = watch('expiration') ?? String(config.DEFAULT_EXPIRY ?? 3600);

  // Key strategy — default 'auto' so the user can ignore the right column.
  const [keyMode, setKeyMode] = useState<KeyMode>('auto');
  const [customKey, setCustomKey] = useState('');
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

  // Live encrypt → CiphertextBox (only in auto mode and with a plaintext).
  useEffect(() => {
    let cancelled = false;
    async function liveEncrypt() {
      const pw = keyMode === 'auto' ? generatedKey : customKey;
      if (!plaintext || !pw) {
        setCiphertextPreview('');
        return;
      }
      try {
        const ct = await encryptMessage(plaintext, pw, config.ARGON2);
        if (!cancelled) setCiphertextPreview(ct);
      } catch {
        if (!cancelled) setCiphertextPreview('');
      }
    }
    const timer = setTimeout(liveEncrypt, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [plaintext, keyMode, generatedKey, customKey, config.ARGON2]);

  async function onSubmit() {
    if (!plaintext) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const pw = keyMode === 'auto' ? generatedKey : customKey;
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

  // The "form column" body — primary action.
  const formColumn = (
    <div>
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

      {/* Small hero subtitle inside the action card (lg+ the big HeroBand
          already sits above; this keeps a one-line label for context). */}
      <h2 className="hidden lg:block text-base sm:text-lg text-[#3A2E5C]/70 leading-relaxed mb-6 sm:mb-8 font-normal">
        {t('create.heroSubtitle')}
      </h2>
      {/* On <lg the HeroBand is hidden, so we still need a short label. */}
      <h2 className="lg:hidden text-base font-medium text-[#3A2E5C]/75 mb-4">
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

      {/* On mobile, sticky bottom so the button is always in thumb reach. */}
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
          <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] lg:p-0">
            <EncryptButton
              loading={submitting}
              disabled={submitDisabled}
              onSubmit={() => {
                if (!plaintext) {
                  setError('secret', {
                    type: 'required',
                    message: t('create.errorNoPlaintext'),
                  });
                  return;
                }
                onSubmit();
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2.5 text-sm text-[#3A2E5C]/65 leading-relaxed">
        <ShieldIcon className="h-5 w-5 shrink-0 text-[#4A95FF] mt-0.5" />
        <p>{t('create.reassurance')}</p>
      </div>
    </div>
  );

  // The "transparency column" body — demo UI the user sees but normally
  // doesn't touch (key + ciphertext blocks). Rendered on the right at
  // ≥lg, but collapsed into a Disclosure on <lg.
  const transparencyContent = (
    <>
      {/* About one-pass — plain text block. */}
      <div>
        <h3 className="text-base font-semibold text-[#3A2E5C] mb-2 flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-[#4A95FF] shrink-0" />
          {t('create.sidebar.aboutTitle')}
        </h3>
        <p className="text-sm text-[#3A2E5C]/70 leading-relaxed">
          {t('create.sidebar.aboutBody')}
        </p>
      </div>

      {/* Step 2 — KeyStep (radio + key string + regenerate). */}
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(254, 226, 226, 0.18) 0%, rgba(255, 247, 237, 0.55) 100%)',
          border: '1.5px solid rgba(252, 165, 165, 0.35)',
        }}
      >
        <KeyStep
          mode={keyMode}
          setMode={setKeyMode}
          keyValue={keyMode === 'custom' ? customKey : generatedKey || ''}
          customKey={customKey}
          onCustomKeyChange={setCustomKey}
          isBeforeEncrypt={false}
          onRegenerate={regenerateKey}
        />
      </div>

      {/* Step 3 — CiphertextBox (live ciphertext preview). */}
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

      {/* Trust strip — kept from v4. */}
      <div className="pt-4 border-t border-[#E0E6F0] space-y-1.5">
        <p className="text-sm font-semibold text-[#3A2E5C]/80">
          {t('create.trustStrip')}
        </p>
        <p className="text-xs text-[#3A2E5C]/60 leading-relaxed">
          {t('create.trustNote')}
        </p>
      </div>
    </>
  );

  // On <lg wrap the transparency content in a single Disclosure so it
  // collapses behind a tap and the form stays the visual anchor.
  const transparencyColumn = (
    <>
      {/* lg+ : always visible as a right column. */}
      <aside className="hidden lg:block space-y-6">{transparencyContent}</aside>
      {/* <lg : collapsed behind the "原理说明" disclosure. */}
      <div className="lg:hidden mt-6">
        <Disclosure
          testId="text-disclosure"
          summary={
            <span className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4 text-[#4A95FF]" />
              {t('disclosure.principlesTitle')}
            </span>
          }
          className="border border-[#E0E6F0] bg-white/60"
        >
          <p className="text-sm text-[#3A2E5C]/70">
            {t('disclosure.principlesIntro')}
          </p>
          <div className="space-y-4 pt-2">{transparencyContent}</div>
        </Disclosure>
      </div>
    </>
  );

  return (
    <>
      {/* ── v6 responsive grid ────────────────────────────────────
            <lg: the grid doesn't activate, so the children stack
                 vertically — form first, transparency column below.
            ≥lg: 12-col grid → form (col-span-7, left) +
                 transparency column (col-span-5, right, sticky).
       */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
        {/* ── LEFT — form (primary action) ─────────────────────── */}
        <div className="lg:col-span-7 lg:order-1">
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
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[2rem]"
              style={{
                boxShadow:
                  'inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(58, 46, 92, 0.02)',
              }}
            />
            <div className="relative">{formColumn}</div>
          </div>
        </div>

        {/* ── RIGHT — transparency UI demo (lighter visual weight) ── */}
        <div className="mt-8 lg:col-span-5 lg:order-2 lg:mt-0 lg:sticky lg:top-8">
          {transparencyColumn}
        </div>
      </div>
    </>
  );
}

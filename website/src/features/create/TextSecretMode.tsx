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

type KeyMode = 'auto' | 'custom';

type Secret = {
  secret: string;
  expiration: string;
  oneTime: boolean;
};

/**
 * 4-step transparent encryption UI for plain text — v5 layout (2026-07-24).
 *
 * v5 redesign (vs v4):
 *  - Swapped columns at ≥1920px (2K/4K):
 *      v4:  left=marketing copy + benefits + trust strip
 *           right=form card
 *      v5:  left=FORM (primary action — textarea + options + button)
 *           right=transparency UI demo (about + KeyStep + CiphertextBox + trust)
 *  - Killed the giant "加密消息" h1; replaced with a small one-line subtitle
 *    (create.heroSubtitle) in the form card header.
 *  - Button text back to "生成链接" / "Generate link" (create.buttonSubmit) —
 *    Yopass original. The KeyStep + CiphertextBox in the right column are
 *    TRANSPARENCY UI only: the user does not normally interact with them
 *    (default mode = auto). They show the user that encryption is real:
 *      - KeyStep: see the key being generated in their browser.
 *      - CiphertextBox: see the ciphertext being produced live.
 *  - ≥1920px (wide): two-column. Form card on the LEFT (visual anchor).
 *    Right column is a lighter "transparency demo" column.
 *  - <1920px: single column. Form first; the KeyStep + CiphertextBox stay
 *    BELOW the form (inside the same action card) so users can scroll down
 *    and see the demo without losing the form above.
 *  - Result page: v4's "Regenerate key and re-upload" box is BACK in.
 *
 * Each step (PlaintextStep / KeyStep / CiphertextBox) still carries its own
 * step badge (① ② ③) so users have a local anchor.
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
    // Small debounce so we don't burn CPU while the user is still typing.
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
      // (keyMode=auto: the live-encrypt effect has already encrypted with the
      //  same key; we re-encrypt to be safe and so the upload payload matches
      //  the key we send. For large plaintexts this is the only encryption.)
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

  // The "form column" body — primary action (used on left of the ≥1920 grid,
  // and as the only column at <1920).
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

      {/* Small hero subtitle (replaces the giant "加密消息" h1). */}
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
  );

  // The "transparency column" body — demo UI the user sees but normally
  // doesn't touch (key + ciphertext blocks). Rendered on the right at
  // ≥1920px, stacked below the form on narrower viewports.
  const transparencyColumn = (
    <aside className="space-y-6">
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
    </aside>
  );

  return (
    <>
      {/* ── v5 responsive grid ────────────────────────────────────
            <1920px: the grid below doesn't activate, so the children stack
                      vertically — form first, transparency column below.
            ≥1920px : 12-col grid → form (col-span-7, left) +
                      transparency column (col-span-5, right, sticky).
       */}
      <div className="wide:grid wide:grid-cols-12 wide:gap-10 wide:items-start">
        {/* ── LEFT — form (primary action) ─────────────────────── */}
        <div className="wide:col-span-7 wide:order-1">
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
            <div className="relative">{formColumn}</div>
          </div>
        </div>

        {/* ── RIGHT — transparency UI demo (lighter visual weight) ── */}
        <div className="mt-8 wide:col-span-5 wide:order-2 wide:mt-0 wide:sticky wide:top-8">
          {transparencyColumn}
        </div>
      </div>
    </>
  );
}
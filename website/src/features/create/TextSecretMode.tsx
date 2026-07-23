import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { encryptMessage } from '@shared/lib/crypto';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { CiphertextBox } from '@shared/components/CiphertextBox';
import { StepBar } from '@shared/components/StepBar';
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
 * 4-step transparent encryption UI for plain text — v3 layout (2026-07-23).
 *
 * v3 redesign: removed left sidebar (was wasting 1/3 of 1920 viewport on
 * "zero-knowledge" copy that users don't need to read). Now single-column:
 *
 *   hero band (centered title + subtitle)
 *   horizontal stepper (4 steps, full-width)
 *   action card (full-width, max-w-5xl)
 *     ① plaintext
 *     ② key choice + key box
 *     ③ ciphertext preview
 *     ④ options
 *     [encrypt button]
 *     reassurance strip
 *
 * Mobile (<768px): stacks to single column. Stepper collapses to compact.
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

  const stepIndex =
    !plaintext ? 0 : keyMode === 'custom' && !customKey ? 1 : 2;

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
      {/* ── Hero band: title + subtitle ─────────────────────────── */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 text-[#3A2E5C] tracking-tight">
          {t('create.title')}
        </h2>
        <p className="text-base sm:text-lg text-[#3A2E5C]/70 max-w-2xl mx-auto leading-relaxed">
          {t('create.subtitle')}
        </p>
      </div>

      <StepBar
        steps={[
          { id: 1, title: t('create.stepTitle1'), hint: t('create.stepHint1') },
          { id: 2, title: t('create.stepTitle2'), hint: t('create.stepHint2') },
          { id: 3, title: t('create.stepTitle3'), hint: t('create.stepHint3') },
          { id: 4, title: t('create.stepTitle4'), hint: t('create.stepHint4') },
        ]}
        current={stepIndex}
        className="mb-8 sm:mb-10"
      />

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

      {/* ── Action card — single column, generous spacing ──────── */}
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
            // validate plaintext manually since we skip RHF submit
            if (!plaintext) {
              setError('secret', { type: 'required', message: t('create.errorNoPlaintext') });
              return;
            }
            onSubmit();
          }}
        />

        {/* Reassurance strip below button — what users actually need to know */}
        <div className="mt-5 flex items-start gap-2.5 text-sm text-[#3A2E5C]/65 leading-relaxed">
          <ShieldIcon className="h-5 w-5 shrink-0 text-[#4A95FF] mt-0.5" />
          <p>{t('create.reassurance')}</p>
        </div>
      </div>
    </>
  );
}

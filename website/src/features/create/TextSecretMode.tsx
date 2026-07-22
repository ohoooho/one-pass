import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { encryptMessage } from '@shared/lib/crypto';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { useSecretForm } from '@shared/hooks/useSecretForm';
import { SecretOptions } from '@shared/components/SecretOptions';
import { CiphertextBox } from '@shared/components/CiphertextBox';
import { KeyBox } from '@shared/components/KeyBox';
import { InfoPopover } from '@shared/components/InfoPopover';
import { randomString } from '@shared/lib/random';
import Result from '@features/display-secret/Result';

/**
 * 4-step transparent encryption UI for plain text.
 *
 * Step 1: input plaintext
 * Step 2: key (red box, never leaves browser — visible BEFORE submit)
 * Step 3: ciphertext (green box, only this is POSTed to server — visible BEFORE submit)
 * Step 4: link + copy buttons (after submit)
 *
 * The key and ciphertext are recomputed live (debounced) as the user types
 * so they can SEE the encryption happen on their own machine.
 */
export default function TextSecretMode() {
  const { t } = useTranslation();
  const config = useConfig();

  const [requireAuth, setRequireAuth] = useState(false);
  const [readReceipt, setReadReceipt] = useState(false);
  const [receiptToken, setReceiptToken] = useState<string | undefined>();

  const {
    oneTime,
    setOneTime,
    generateKey,
    setGenerateKey,
    customPassword,
    setCustomPassword,
    result,
    setResult,
    isCustomPassword,
  } = useSecretForm();

  type Secret = {
    secret: string;
    expiration: string;
    oneTime: boolean;
    generateKey: boolean;
    customPassword: string;
  };
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Secret>({
    defaultValues: {
      expiration: String(config.DEFAULT_EXPIRY ?? 3600),
    },
  });

  // Live preview: regenerate key + ciphertext whenever plaintext changes
  const plaintext = watch('secret') ?? '';
  const customKey = watch('customPassword') ?? '';

  // Compute current key + ciphertext reactively
  const [liveKey, setLiveKey] = useState('');
  const [liveCipher, setLiveCipher] = useState('');
  const [encrypting, setEncrypting] = useState(false);

  // When "generate key" is off, the user supplies their own key
  const useCustomKey = !generateKey;
  const effectiveKey = useCustomKey ? customKey : liveKey || randomString();

  useEffect(() => {
    if (useCustomKey) {
      // Don't compute anything; user is typing their own key
      setLiveCipher('');
      return;
    }
    if (!plaintext) {
      setLiveCipher('');
      setLiveKey('');
      return;
    }
    // Debounced recompute
    setEncrypting(true);
    const key = randomString();
    setLiveKey(key);
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const ct = await encryptMessage(plaintext, key, config.ARGON2);
        if (!cancelled) {
          setLiveCipher(ct);
        }
      } catch (e) {
        if (!cancelled) setLiveCipher('');
      } finally {
        if (!cancelled) setEncrypting(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plaintext, useCustomKey, config.ARGON2]);

  async function onSubmit(form: Secret) {
    if (!form.secret) {
      return;
    }
    const pw = effectiveKey;
    const { data, status } = await postSecret(
      {
        expiration: parseInt(form.expiration),
        message: await encryptMessage(form.secret, pw, config.ARGON2),
        one_time: config.FORCE_ONETIME_SECRETS || oneTime,
        require_auth: requireAuth,
        receipt: config.READ_RECEIPTS && readReceipt,
      },
      config.OIDC_ENABLED,
    );
    if (status !== 200) {
      setError('secret', { type: 'submit', message: data.message });
    } else {
      setReceiptToken(data.receipt_token);
      if (data.receipt_token) {
        // Persist the receipt locally so it stays reachable from the
        // Receipts page after navigating away. The secret link and
        // decryption key are intentionally not stored.
        saveNewReceipt(
          data.message,
          data.receipt_token,
          config.FORCE_ONETIME_SECRETS || oneTime,
          parseInt(form.expiration),
        );
      }
      setResult({
        password: pw,
        uuid: data.message,
        customPassword: isCustomPassword(),
      });
    }
  }

  if (result.uuid) {
    return (
      <Result
        password={result.password}
        uuid={result.uuid}
        prefix="s"
        customPassword={result.customPassword}
        oneTime={config.FORCE_ONETIME_SECRETS || oneTime}
        receiptToken={receiptToken}
      />
    );
  }

  return (
    <>
      <h2 className="text-3xl font-bold mb-2">{t('create.title')}</h2>
      <p className="text-base-content/70 mb-6">{t('create.subtitle')}</p>
      <form onSubmit={handleSubmit(onSubmit)}>
        {errors.secret && (
          <div className="mb-4 text-red-600 text-sm font-medium">
            {errors.secret.message?.toString()}
          </div>
        )}

        {/* Step 1: Plaintext input */}
        <section className="mb-6" data-testid="step-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: '#4A95FF' }}
            >
              1
            </span>
            <h3 className="font-semibold text-base m-0">
              {t('create.step1Title')}
            </h3>
          </div>
          <label className="label" htmlFor="secret">
            <span className="label-text text-sm text-base-content/70">
              {t('create.inputSecretLabel')}
            </span>
          </label>
          <textarea
            id="secret"
            {...register('secret')}
            className="textarea textarea-bordered w-full min-h-[120px] text-base p-4 resize-y rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-100"
            placeholder={t('create.inputSecretPlaceholder')}
            rows={4}
            data-testid="plaintext-input"
          />
        </section>

        {/* Step 2: Key (red box) */}
        <section className="mb-6" data-testid="step-2">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: '#EF4444' }}
            >
              2
            </span>
            <h3 className="font-semibold text-base m-0">
              {t('create.step2Title')}
            </h3>
            <InfoPopover
              titleKey="create.infoA1Title"
              bodyKey="create.infoA1Body"
              learnMoreKey="create.infoLearnMore"
            />
          </div>
          <KeyBox
            password={effectiveKey}
            onRegenerate={
              useCustomKey || !plaintext
                ? undefined
                : () => {
                    setLiveKey(randomString());
                  }
            }
            hidden={useCustomKey}
          />
        </section>

        {/* Step 3: Ciphertext (green box) */}
        <section className="mb-6" data-testid="step-3">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold text-white shrink-0"
              style={{ background: '#7DD3C0' }}
            >
              3
            </span>
            <h3 className="font-semibold text-base m-0">
              {t('create.step3Title')}
            </h3>
            <InfoPopover
              titleKey="create.infoA2Title"
              bodyKey="create.infoA2Body"
              learnMoreKey="create.infoLearnMore"
            />
          </div>
          <CiphertextBox
            ciphertext={liveCipher}
            redacted
            placeholder={
              encrypting ||
              !plaintext ||
              useCustomKey ||
              !effectiveKey
            }
          />
        </section>

        {/* Options */}
        <SecretOptions
          register={register}
          setValue={setValue}
          oneTime={oneTime}
          setOneTime={setOneTime}
          generateKey={generateKey}
          setGenerateKey={setGenerateKey}
          customPassword={customPassword}
          setCustomPassword={setCustomPassword}
          requireAuth={requireAuth}
          setRequireAuth={setRequireAuth}
          readReceipt={readReceipt}
          setReadReceipt={setReadReceipt}
        />

        {/* Submit */}
        <div className="form-control mt-8">
          <button
            className="btn btn-primary w-full h-12 text-base font-semibold rounded-lg transition-all duration-200"
            type="submit"
            disabled={!plaintext || (!generateKey && !customKey)}
            data-testid="submit-create"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {t('create.buttonEncrypt')}
            <InfoPopover
              titleKey="create.infoA6Title"
              bodyKey="create.infoA6Body"
              className="ml-2"
            />
          </button>
        </div>
      </form>
    </>
  );
}

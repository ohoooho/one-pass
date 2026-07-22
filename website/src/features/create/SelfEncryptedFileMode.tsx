import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { postSecret } from '@shared/lib/api';
import { saveNewReceipt } from '@shared/lib/receiptStore';
import { useConfig } from '@shared/hooks/useConfig';
import { SecretOptions } from '@shared/components/SecretOptions';
import Result from '@features/display-secret/Result';

type FormValues = {
  expiration: string;
  oneTime: boolean;
  // Required by SecretOptions' generic constraint but unused in file mode.
  generateKey: boolean;
  customPassword: string;
};

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB hard client-side cap
// Server --max-length defaults to 10000 bytes. We base64-encode ciphertext
// before submit so raw ciphertext must stay < ~7000 bytes to be safe.
// Documented in help text — anything bigger than ~7 KB plaintext will be
// rejected by the server. Bigger files: compress before encrypting.
const SERVER_SAFE_CIPHERTEXT_BYTES = 7000;

interface SelfEncryptedFileModeProps {
  /** Parent increments this on tab switch to remount us with clean state. */
  resetSignal: number;
}

/**
 * "I already encrypted my file" mode.
 *
 * The user uploads a ciphertext blob (or pastes base64). We don't touch it —
 * we hand it to the server as the secret message. The user types the key
 * they used, which becomes the #fragment in the URL.
 *
 * The server cannot tell which tool made the ciphertext (gpg/age/openssl/etc).
 * We become a "zero-knowledge pastebin with URL fragment for the key".
 *
 * Why no auto-encrypt: the user picked the tool. They own the trust model.
 */
export default function SelfEncryptedFileMode({
  resetSignal,
}: SelfEncryptedFileModeProps) {
  void resetSignal; // used by parent key remount
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

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      expiration: String(config?.DEFAULT_EXPIRY ?? 3600),
      oneTime: true,
    },
  });

  function readFile(file: File) {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError(
        t('upload.fileTooLarge', {
          maxSize: '50 MB',
        }),
      );
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
      <h2 className="text-3xl font-bold mb-2">
        {t('create.fileMode.title')}
      </h2>
      <p className="text-base-content/70 mb-4">
        {t('create.fileMode.subtitle')}
      </p>

      {/* Help: how to encrypt a file yourself */}
      <details className="mb-6 bg-base-200 rounded-lg p-4">
        <summary className="cursor-pointer font-semibold text-sm">
          {t('create.fileMode.helpTitle')}
        </summary>
        <div className="mt-3 text-sm space-y-3">
          <p className="text-base-content/80">
            {t('create.fileMode.helpIntro')}
          </p>
          <pre className="bg-base-100 rounded p-3 text-xs overflow-x-auto whitespace-pre">{`# gpg (AES-256)
gpg --symmetric --cipher-algo AES256 your-file.txt

# age (modern, simple)
age -p < your-file.txt > encrypted.age

# openssl
openssl enc -aes-256-gcm -salt -pbkdf2 \\
  -in your-file.txt -out encrypted.bin`}</pre>
          <p className="text-xs text-base-content/60">
            {t('create.fileMode.helpSizeNote', {
              limit: SERVER_SAFE_CIPHERTEXT_BYTES,
            })}
          </p>
        </div>
      </details>

      {error && (
        <div
          className="alert alert-error mb-4 cursor-pointer"
          onClick={() => setError(null)}
        >
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Drop zone */}
        <section className="mb-6">
          <div
            data-testid="file-drop-zone"
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-base-200'
                : 'border-base-300 bg-base-100'
            }`}
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
                  className="w-12 h-12 text-base-content/60"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
                  />
                </svg>
                <div className="mt-2 font-semibold">
                  {filename ?? t('create.fileMode.dropzoneText')}
                </div>
                <div className="text-sm text-base-content/60">
                  {t('create.fileMode.maxFileSize', {
                    size: '50 MB',
                  })}
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Ciphertext preview textarea */}
        <section className="mb-6">
          <label className="label" htmlFor="ciphertext">
            <span className="label-text text-sm font-semibold">
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
            className="textarea textarea-bordered w-full min-h-[120px] text-xs font-mono p-3 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-base-100"
            placeholder={t('create.fileMode.ciphertextPlaceholder')}
          />
          {ciphertext && (
            <p className="text-xs text-base-content/60 mt-1">
              {t('create.fileMode.ciphertextSize', {
                size: ciphertext.length.toLocaleString(),
                limit: SERVER_SAFE_CIPHERTEXT_BYTES.toLocaleString(),
              })}
            </p>
          )}
        </section>

        {/* Custom key (REQUIRED — never generated in this mode) */}
        <section className="mb-6">
          <label className="label" htmlFor="customKey">
            <span className="label-text text-sm font-semibold">
              {t('create.fileMode.keyLabel')}
            </span>
          </label>
          <input
            id="customKey"
            type="text"
            value={customKey}
            onChange={e => setCustomKey(e.target.value)}
            className="input input-bordered w-full rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-mono text-sm"
            placeholder={t('create.fileMode.keyPlaceholder')}
            data-testid="file-key"
          />
          <p className="text-xs text-base-content/60 mt-1">
            {t('create.fileMode.keyHint')}
          </p>
        </section>

        <SecretOptions
          register={register}
          setValue={setValue}
          oneTime={oneTime}
          setOneTime={setOneTime}
          generateKey={false}
          setGenerateKey={() => {
            /* noop — this mode always requires user-supplied key */
          }}
          customPassword={customKey}
          setCustomPassword={setCustomKey}
          requireAuth={false}
          setRequireAuth={() => {
            /* noop — keep behavior parity with text mode */
          }}
          readReceipt={readReceipt}
          setReadReceipt={setReadReceipt}
          expirationLabel={t('create.fileMode.expirationLabel')}
        />

        <div className="form-control mt-8">
          <button
            type="submit"
            className="btn btn-primary w-full h-12 text-base font-semibold rounded-lg transition-all duration-200"
            disabled={!ciphertext || !customKey}
            data-testid="file-submit"
          >
            {t('create.fileMode.submit')}
          </button>
        </div>
      </form>
    </>
  );
}

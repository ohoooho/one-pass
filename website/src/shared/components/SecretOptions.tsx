import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useConfig } from '@shared/hooks/useConfig';
import { InfoPopover } from '@shared/components/InfoPopover';

type SecretFormFields = {
  expiration: string;
  oneTime: boolean;
};

interface SecretOptionsProps<T extends SecretFormFields> {
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  oneTime: boolean;
  setOneTime: (value: boolean) => void;
  requireAuth: boolean;
  setRequireAuth: (value: boolean) => void;
  readReceipt?: boolean;
  setReadReceipt?: (value: boolean) => void;
  expirationLabel?: string;
}

/**
 * Options panel for the create flow.
 *
 * v3 change (2026-07-23): removed `generateKey` and `customPassword` props/UI.
 * Those controls were duplicates of the radio + custom-key input that live
 * inside the KeyStep component above (the "Auto-generate / Use my own" radio).
 * Having two UIs controlling the same state was confusing.
 *
 * Now: this component only owns expiration + oneTime + (optional) requireAuth +
 * (optional) readReceipt.
 */
export function SecretOptions<T extends SecretFormFields>({
  register: registerProp,
  setValue: setValueProp,
  oneTime,
  setOneTime,
  requireAuth,
  setRequireAuth,
  readReceipt,
  setReadReceipt,
  expirationLabel,
}: SecretOptionsProps<T>) {
  const register = registerProp as unknown as UseFormRegister<SecretFormFields>;
  const setValue = setValueProp as unknown as UseFormSetValue<SecretFormFields>;
  const { t } = useTranslation();
  const config = useConfig();

  const forceExpiration = config?.FORCE_EXPIRATION;
  const forcedExpirationLabel = forceExpiration
    ? forceExpiration === 3600
      ? t('expiration.optionOneHourLabel')
      : forceExpiration === 86400
        ? t('expiration.optionOneDayLabel')
        : forceExpiration === 604800
          ? t('expiration.optionOneWeekLabel')
          : t('expiration.optionOneHourLabel')
    : undefined;

  useEffect(() => {
    if (forceExpiration) {
      setValue('expiration', String(forceExpiration));
    }
  }, [forceExpiration, setValue]);

  return (
    <fieldset className="form-control">
      {!forcedExpirationLabel && (
        <div className="flex items-center gap-1.5">
          <legend className="label-text font-semibold text-base text-balance">
            {expirationLabel || t('expiration.legend')}
          </legend>
          <InfoPopover
            titleKey="create.infoA5Title"
            bodyKey="create.infoA5Body"
            side="right"
          />
        </div>
      )}
      {forcedExpirationLabel ? (
        <p className="mt-2 text-sm font-medium text-base-content/70">
          {t('expiration.forced', {
            expiration: forcedExpirationLabel.toLowerCase(),
            defaultValue: `Secret will expire in {{expiration}}`,
          })}
        </p>
      ) : (
        <div className="join w-full mt-2">
          {[
            { value: '3600', label: t('expiration.optionOneHourLabel') },
            { value: '86400', label: t('expiration.optionOneDayLabel') },
            { value: '604800', label: t('expiration.optionOneWeekLabel') },
          ].map(option => (
            <input
              key={option.value}
              type="radio"
              {...register('expiration')}
              className="join-item btn btn-sm flex-1"
              value={option.value}
              aria-label={option.label}
            />
          ))}
        </div>
      )}
      <div className="mt-5 space-y-2">
        {!config?.FORCE_ONETIME_SECRETS && (
          <>
            <label className="cursor-pointer flex items-center space-x-3 p-2 rounded-md hover:bg-base-200 transition-colors">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                {...register('oneTime')}
                checked={oneTime}
                onChange={() => setOneTime(!oneTime)}
              />
              <span className="label-text font-medium">
                {t('create.inputOneTimeLabel')}
              </span>
              <InfoPopover
                titleKey="create.infoA3Title"
                bodyKey="create.infoA3Body"
                side="right"
              />
            </label>
            {/* v8.5 (2026-07-27) — Inline IM warning.
                 Burn-after-reading links shared via chat apps get
                 pre-fetched server-side by the IM client (link-unfurl
                 preview), which burns the secret on the very first GET
                 — the recipient opens an already-gone link. Inline
                 warning (not a modal) so the user sees it before
                 clicking the Submit button without interrupting flow. */}
            {oneTime && (
              <div
                role="alert"
                className="ml-8 mt-1 mb-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: 'rgba(254, 226, 226, 0.55)',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                }}
                data-testid="onetime-im-warning"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-4 w-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <span>{t('create.inputOneTimeIMWarning')}</span>
              </div>
            )}
          </>
        )}
        {config?.OIDC_ENABLED && (
          <label className="cursor-pointer flex items-center space-x-3 p-2 rounded-md hover:bg-base-200 transition-colors">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={requireAuth}
              onChange={() => setRequireAuth(!requireAuth)}
            />
            <span className="label-text font-medium">
              {t('create.inputRequireAuthLabel')}
            </span>
          </label>
        )}
        {config?.READ_RECEIPTS && setReadReceipt && (
          <label className="cursor-pointer flex items-center space-x-3 p-2 rounded-md hover:bg-base-200 transition-colors">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={readReceipt}
              onChange={() => setReadReceipt(!readReceipt)}
            />
            <span className="label-text font-medium">
              {t('create.inputReadReceiptLabel')}
            </span>
          </label>
        )}
      </div>
    </fieldset>
  );
}

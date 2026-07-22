import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextSecretMode from '@features/create/TextSecretMode';
import SelfEncryptedFileMode from '@features/create/SelfEncryptedFileMode';

type Mode = 'text' | 'file';

/**
 * Wrapper with a Tab switcher between two create modes:
 *
 *  - text  : default. Browser auto-encrypts via OpenPGP. (Original flow.)
 *  - file  : user already encrypted with their own tool (gpg / age / openssl).
 *            We store the ciphertext verbatim and put their key in #fragment.
 *
 * Switching tabs remounts the active mode (via `key`) so any partial state
 * is cleared.
 */
export default function CreateSecret() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('text');
  const [resetSignal, setResetSignal] = useState(0);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResetSignal(s => s + 1);
  }

  return (
    <>
      {/* Tab switcher (per brief B1: "在标题下加 Tab 切换") */}
      <div
        role="tablist"
        aria-label={t('create.tabsLabel')}
        className="flex gap-2 mb-6 border-b border-base-300"
      >
        <button
          role="tab"
          aria-selected={mode === 'text'}
          data-testid="tab-text"
          onClick={() => switchMode('text')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            mode === 'text'
              ? 'bg-base-100 border border-base-300 border-b-base-100 -mb-px text-primary'
              : 'text-base-content/60 hover:text-base-content'
          }`}
        >
          {t('create.tabText')}
        </button>
        <button
          role="tab"
          aria-selected={mode === 'file'}
          data-testid="tab-file"
          onClick={() => switchMode('file')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            mode === 'file'
              ? 'bg-base-100 border border-base-300 border-b-base-100 -mb-px text-primary'
              : 'text-base-content/60 hover:text-base-content'
          }`}
        >
          {t('create.tabFile')}
        </button>
      </div>

      {mode === 'text' ? (
        <TextSecretMode key={`text-${resetSignal}`} />
      ) : (
        <SelfEncryptedFileMode key={`file-${resetSignal}`} resetSignal={resetSignal} />
      )}
    </>
  );
}

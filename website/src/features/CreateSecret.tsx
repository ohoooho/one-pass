import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TextSecretMode from '@features/create/TextSecretMode';
import SelfEncryptedFileMode from '@features/create/SelfEncryptedFileMode';
import HeroBand from '@shared/components/HeroBand';

/**
 * CreateSecret — v6 (2026-07-24).
 *
 * No in-card Tab anymore. The mode switch is now done at the router level
 * via the URL (App.tsx maps '/' -> mode="text", '/file' -> mode="file"),
 * and the Navbar's center menu drives the swap. The mode prop here is just
 * what the router decided; we don't carry a local toggle anymore.
 *
 * Each creation page renders its own HeroBand on lg+ so the Navbar's changes
 * actually surface (per the v6 brief E — container style was "unchanged"
 * in v4/v5 because the Tab was covering the Nav).
 */
export default function CreateSecret({ mode }: { mode: 'text' | 'file' }) {
  // resetSignal is no longer strictly needed (mode change forces remount via
  // key on the wrapper) but we keep a counter so a re-click on the same
  // menu item resets the inner state.
  const [resetSignal, setResetSignal] = useState(0);
  const location = useLocation();
  useEffect(() => {
    setResetSignal(s => s + 1);
  }, [mode, location.pathname]);

  return (
    <>
      <HeroBand />
      {mode === 'text' ? (
        <TextSecretMode key={`text-${resetSignal}`} />
      ) : (
        <SelfEncryptedFileMode
          key={`file-${resetSignal}`}
          resetSignal={resetSignal}
        />
      )}
    </>
  );
}

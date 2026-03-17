import { useState, useEffect, useRef } from 'react';

export function useAutoSaveView(
  activeViewId: string | null,
  config: object,
  updateView: (viewId: string, updates: { config: string }) => void
) {
  const [pendingSave, setPendingSave] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevConfigRef = useRef<string>('');

  const configStr = JSON.stringify(config);

  useEffect(() => {
    // Skip initial render
    if (prevConfigRef.current === '' || prevConfigRef.current === configStr) {
      prevConfigRef.current = configStr;
      return;
    }
    prevConfigRef.current = configStr;

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!activeViewId) {
      // No active view - flag as pending so parent can prompt "Save as new view?"
      setPendingSave(true);
      return;
    }

    // Debounce: save after 2 seconds of inactivity
    timerRef.current = setTimeout(() => {
      updateView(activeViewId, { config: configStr });
      timerRef.current = null;
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [configStr, activeViewId, updateView]);

  const clearPendingSave = () => setPendingSave(false);

  return { pendingSave, clearPendingSave };
}

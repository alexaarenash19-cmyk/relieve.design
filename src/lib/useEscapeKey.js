// Audit 10 ago 2026 — CartDrawer.jsx and ProductPanel.jsx each hand-rolled
// the exact same window keydown listener to close on Escape. Extracted
// once here instead of a third copy landing in the next overlay component.
import { useEffect } from 'react';

export function useEscapeKey(onEscape) {
  useEffect(() => {
    function onKeydown(e) {
      if (e.key === 'Escape') onEscape();
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [onEscape]);
}

import { useEffect, useRef, useCallback } from "react";
import { KEYBOARD_SHORTCUTS } from "@/lib/constants";

export function useSearchShortcut(
  onOpen: () => void,
): React.RefObject<() => void> {
  const callbackRef = useRef(onOpen);
  callbackRef.current = onOpen;

  const shortcutHandler = useCallback((event: KeyboardEvent) => {
    const shortcut = KEYBOARD_SHORTCUTS.SEARCH_MODAL;
    const metaOrCtrl = event.metaKey || event.ctrlKey;

    if (event.key === shortcut.key && metaOrCtrl) {
      event.preventDefault();
      callbackRef.current();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", shortcutHandler);
    return () => {
      document.removeEventListener("keydown", shortcutHandler);
    };
  }, [shortcutHandler]);

  return callbackRef as React.RefObject<() => void>;
}

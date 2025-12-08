import { useEffect } from "react";

/**
 * Hook to handle keyboard shortcuts
 * @param {Object} handlers - Map of key combinations to handler functions
 * @param {Array} deps - Dependencies array for the effect
 */
export function useKeyboardShortcuts(handlers, deps = []) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Build key combination string
      let combo = "";
      if (ctrl) combo += "ctrl+";
      if (shift) combo += "shift+";
      if (alt) combo += "alt+";
      combo += key;

      // Check if we have a handler for this combination
      if (handlers[combo]) {
        e.preventDefault();
        handlers[combo](e);
      } else if (handlers[key]) {
        e.preventDefault();
        handlers[key](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers, ...deps]);
}





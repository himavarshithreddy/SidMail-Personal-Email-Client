import { useEffect, useState } from "react";

export function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className="rounded-md bg-emerald-600/90 text-white px-4 py-3 text-sm border border-emerald-500 shadow-lg">
        {message}
      </div>
    </div>
  );
}

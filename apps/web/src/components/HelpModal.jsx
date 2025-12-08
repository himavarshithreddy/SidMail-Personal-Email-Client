export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "C", description: "Compose new message" },
    { key: "J", description: "Next message" },
    { key: "K", description: "Previous message" },
    { key: "ESC", description: "Close modal/compose" },
    { key: "?", description: "Show this help" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
    >
      <div
        className="max-w-md w-full p-6 rounded-lg border border-border bg-popover space-y-4 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 id="help-title" className="text-xl font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <button
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-3 px-3 rounded-md hover:bg-muted transition-colors"
            >
              <span className="text-base text-foreground">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/30 rounded-md shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border text-center">
          <p className="text-base text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded font-mono font-semibold">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

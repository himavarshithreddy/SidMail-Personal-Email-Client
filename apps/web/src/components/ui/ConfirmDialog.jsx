export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", variant = "default" }) {
    if (!isOpen) return null;
  
    const variantStyles = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    };
  
    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div
          className="max-w-md w-full p-6 rounded-lg border border-border bg-popover space-y-4 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <h2 id="confirm-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
          </div>
  
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="btn-ghost cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${variantStyles[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }
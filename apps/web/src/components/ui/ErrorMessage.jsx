export function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="px-4 py-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:no-underline cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}

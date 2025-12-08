export function Loading({ className = "" }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin"></div>
    </div>
  );
}

export function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3 px-3 py-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted/50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

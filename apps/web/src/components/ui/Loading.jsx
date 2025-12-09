export function Loading({ className = "" }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="relative w-12 h-12">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/60 border-r-primary/40 animate-spin" style={{ animationDuration: '1s' }}></div>
        {/* Middle ring */}
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-b-accent/60 border-l-accent/40 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        {/* Inner pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        </div>
      </div>
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

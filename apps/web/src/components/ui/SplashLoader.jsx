export function SplashLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo with glow and enlarged orbit */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute inset-2 rounded-full bg-accent/25 blur-xl" />
          <img
            src="/logo-mark.svg"
            alt="SidMail logo"
            className="w-16 h-16 relative z-20 drop-shadow-[0_0_12px_rgba(19,191,226,0.5)]"
          />

          {/* Orbiting system */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {/* Central pulsing orb */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary animate-pulse" />

              {/* Orbiting particles */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary/80" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent/80" />
              </div>

              {/* Outer ring particles */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDirection: "reverse" }}>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent/60" />
              </div>

              {/* Glowing rings */}
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-3 rounded-full border border-accent/20 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
            </div>
          </div>
        </div>

        {/* Futuristic Progress Bar */}
        <div className="w-72 h-1.5 bg-muted/30 rounded-full overflow-hidden relative mt-25">
          <div 
            className="h-full bg-linear-to-r from-primary via-accent to-primary rounded-full animate-loading-bar relative"
            style={{ width: "40%" }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SplashLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-2xl">S</span>
        </div>

        {/* App Name */}
        <div className="text-center space-y-2 mt-16">
          <h1 className="text-4xl font-bold font-futuristic relative">
            <span className="text-primary">SID</span><span className="text-white">MAIL</span>
          </h1>
    
        </div>

        {/* Futuristic Orbiting Particles */}
        <div className="relative w-20 h-20 flex items-center justify-center mt-16">
          {/* Central pulsing orb */}
          <div className="absolute w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          
          {/* Orbiting particles */}
          <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '2s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/80"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-accent/80"></div>
          </div>
          
          {/* Outer ring particles */}
          <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}>
            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/60"></div>
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent/60"></div>
          </div>
          
          {/* Glowing rings */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-2 rounded-full border border-accent/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        </div>

        {/* Futuristic Progress Bar */}
        <div className="w-72 h-1.5 bg-muted/30 rounded-full overflow-hidden relative mt-16">
          <div 
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-loading-bar relative"
            style={{ width: "40%" }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

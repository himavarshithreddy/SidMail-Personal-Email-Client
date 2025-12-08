export function SplashLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
          <span className="text-primary-foreground font-bold text-2xl">S</span>
        </div>

        {/* App Name */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            SidMail
          </h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>

        {/* Animated Shapes */}
        <div className="flex items-center justify-center gap-3 h-12">
          {/* Circle */}
          <div 
            className="w-3 h-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          ></div>
          
          {/* Triangle */}
          <div 
            className="w-0 h-0 animate-bounce"
            style={{ 
              animationDelay: "120ms", 
              animationDuration: "1s",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "10px solid hsl(var(--accent))"
            }}
          ></div>
          
          {/* Square */}
          <div 
            className="w-3 h-3 bg-primary animate-bounce"
            style={{ animationDelay: "240ms", animationDuration: "1s" }}
          ></div>
          
          {/* Diamond */}
          <div 
            className="w-3 h-3 bg-accent animate-bounce"
            style={{ 
              animationDelay: "360ms", 
              animationDuration: "1s",
              transform: "rotate(45deg)"
            }}
          ></div>
          
          {/* Pentagon (using hexagon approximation) */}
          <div 
            className="w-3 h-3 bg-primary animate-bounce"
            style={{ 
              animationDelay: "480ms", 
              animationDuration: "1s",
              clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"
            }}
          ></div>
          
          {/* Hexagon */}
          <div 
            className="w-3 h-3 bg-accent animate-bounce"
            style={{ 
              animationDelay: "600ms", 
              animationDuration: "1s",
              clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)"
            }}
          ></div>
        </div>

        {/* Progress Bar */}
        <div className="w-72 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-loading-bar"
            style={{ width: "40%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

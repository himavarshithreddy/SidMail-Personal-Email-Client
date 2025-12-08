export function GlassPanel({ children, className = "", variant = "default" }) {
  const variantClasses = {
    default: "bg-white/5",
    glossy: "gradient-glossy",
    matte: "bg-card/50"
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 ${variantClasses[variant]} backdrop-blur-xl shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function PaneTitle({ children }) {
  return (
    <div className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-foreground/70 border-b border-white/5">
      {children}
    </div>
  );
}




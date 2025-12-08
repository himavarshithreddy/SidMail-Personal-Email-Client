import { useState } from "react";
import { ErrorMessage } from "./ui/ErrorMessage";

const defaultLogin = {
  username: "",
  password: "",
  imapHost: "mail.sidmail.app",
  imapPort: 993,
  imapSecure: true,
  smtpHost: "mail.sidmail.app",
  smtpPort: 465,
  smtpSecure: true,
};

export function LoginForm({ onLogin }) {
  const [login, setLogin] = useState(defaultLogin);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(login);
    } catch (err) {
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="text-2xl font-semibold text-foreground">
          Login to your mailbox
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primary Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-base font-medium text-foreground">
              Email Address
            </label>
            <input
              id="username"
              className="input"
              type="email"
              placeholder="user@example.com"
              value={login.username}
              onChange={(e) => setLogin({ ...login, username: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-base font-medium text-foreground">
              Password
            </label>
            <div className="relative">
            <input
              id="password"
                className="input pr-10"
                type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              required
              disabled={loading}
            />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            disabled={loading}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Settings
          </button>
          </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-border animate-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
                <label htmlFor="imapHost" className="text-base font-medium text-foreground">
              IMAP Host
            </label>
            <input
              id="imapHost"
              className="input"
              value={login.imapHost}
              onChange={(e) => setLogin({ ...login, imapHost: e.target.value })}
                  placeholder="mail.sidmail.app"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
                <label htmlFor="imapPort" className="text-base font-medium text-foreground">
              IMAP Port
            </label>
            <input
              id="imapPort"
              className="input"
              type="number"
              value={login.imapPort}
              onChange={(e) => setLogin({ ...login, imapPort: Number(e.target.value) })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
                <label htmlFor="smtpHost" className="text-base font-medium text-foreground">
              SMTP Host
            </label>
            <input
              id="smtpHost"
              className="input"
              value={login.smtpHost}
              onChange={(e) => setLogin({ ...login, smtpHost: e.target.value })}
                  placeholder="mail.sidmail.app"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
                <label htmlFor="smtpPort" className="text-base font-medium text-foreground">
              SMTP Port
            </label>
            <input
              id="smtpPort"
              className="input"
              type="number"
              value={login.smtpPort}
              onChange={(e) => setLogin({ ...login, smtpPort: Number(e.target.value) })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="imapSecure"
              type="checkbox"
              checked={login.imapSecure}
              onChange={(e) => setLogin({ ...login, imapSecure: e.target.checked })}
              disabled={loading}
                  className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
            />
                <label htmlFor="imapSecure" className="text-base text-foreground cursor-pointer">
              IMAP Secure (TLS)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="smtpSecure"
              type="checkbox"
              checked={login.smtpSecure}
              onChange={(e) => setLogin({ ...login, smtpSecure: e.target.checked })}
              disabled={loading}
                  className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
            />
                <label htmlFor="smtpSecure" className="text-base text-foreground cursor-pointer">
              SMTP Secure (TLS)
            </label>
          </div>
        </div>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        <div className="pt-2">
          <button
            className="btn-primary w-full px-8 py-3 cursor-pointer"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { LoginForm } from "../../components/LoginForm";
import { HelpModal } from "../../components/HelpModal";
import { SplashLoader } from "../../components/ui/SplashLoader";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addMode = searchParams?.get("add") === "1";
  const { isAuthed, checking, login } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (!checking && isAuthed && !addMode) {
      router.replace("/webmail");
    }
  }, [checking, isAuthed, router, addMode]);

  const handleLogin = async (credentials) => {
    try {
      if (addMode && isAuthed) {
        await login(credentials, true); // in add mode, append account
      } else {
        await login(credentials);
      }
      router.replace("/webmail");
    } catch (err) {
      throw err;
    }
  };

  if (checking) {
    return <SplashLoader />;
  }

  if (isAuthed && !addMode) {
    // Avoid flashing the login UI while redirecting authed users
    return <SplashLoader />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <header className="text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img
              src="/logo-mark.svg"
              alt="SidMail logo"
              className="w-10 h-10"
            />
            <h1 className="text-3xl font-semibold font-futuristic relative">
              <span className="text-primary">SID</span>
              <span className="text-white">MAIL</span>
            </h1>
          </div>
        </header>

        <LoginForm onLogin={handleLogin} />

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <a
              href="https://mail.sidmail.app/admin/user/settings"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              aria-label="Open server"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" />
                <path d="M3.5 9h17" />
                <path d="M3.5 15h17" />
                <path d="M11 3a17 17 0 0 0 0 18" />
                <path d="M13 3a17 17 0 0 1 0 18" />
              </svg>
              <span>Server</span>
            </a>
            <a
              href="https://mail.sidmail.app/webmail/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
              aria-label="Open webmail"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16v12H4z" />
                <path d="m4 6 8 7 8-7" />
              </svg>
              <span>Client</span>
            </a>
          </div>
          <div className="text-center">
            <button
              onClick={() => setHelpOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Keyboard shortcuts (Press ?)"
            >
              Keyboard shortcuts (?)
            </button>
          </div>
        </div>
      </div>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}


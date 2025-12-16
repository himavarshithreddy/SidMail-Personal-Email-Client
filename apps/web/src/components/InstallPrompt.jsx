"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallButton, setShowInstallButton] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            return;
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            setDeferredPrompt(e);
            // Show the install button
            setShowInstallButton(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Check if app was successfully installed
        window.addEventListener("appinstalled", () => {
            setShowInstallButton(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt
        setDeferredPrompt(null);
        setShowInstallButton(false);
    };

    const handleDismiss = () => {
        setShowInstallButton(false);
        // Store dismissal in localStorage to not show again for a while
        localStorage.setItem("installPromptDismissed", Date.now().toString());
    };

    // Check if user dismissed recently (within 7 days)
    useEffect(() => {
        const dismissed = localStorage.getItem("installPromptDismissed");
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDaysInMs) {
                setShowInstallButton(false);
            }
        }
    }, []);

    if (!showInstallButton) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <div className="p-4 pb-safe">
                <div className="bg-primary text-primary-foreground rounded-lg shadow-2xl p-4 flex items-center justify-between gap-4 animate-slide-up max-w-md mx-auto">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Install SidMail</p>
                            <p className="text-xs opacity-90">
                                Get quick access from your home screen
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="bg-background text-primary px-4 py-2 rounded-lg font-medium text-sm hover:bg-muted transition-colors duration-200 whitespace-nowrap cursor-pointer"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-white/80 hover:text-white p-2 transition-colors duration-200 cursor-pointer"
                            aria-label="Dismiss"
                        >
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

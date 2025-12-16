"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);
    const [showOffline, setShowOffline] = useState(false);

    useEffect(() => {
        // Set initial online status
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setShowOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowOffline(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Auto-hide the "back online" message after 3 seconds
    useEffect(() => {
        if (isOnline && showOffline) {
            const timer = setTimeout(() => {
                setShowOffline(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, showOffline]);

    if (!showOffline && isOnline) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-50">
            <div
                className={`${isOnline
                        ? "bg-green-600"
                        : "bg-gradient-to-r from-orange-500 to-red-500"
                    } text-white px-4 py-3 shadow-lg transition-all duration-300 ease-in-out`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                    {isOnline ? (
                        <>
                            <svg
                                className="w-5 h-5 animate-bounce"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-sm font-medium">
                                You're back online! Syncing your emails...
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="relative">
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
                                        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                                    />
                                </svg>
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold">No internet connection</p>
                                <p className="text-xs text-white/90">
                                    You can still view cached emails. New messages will sync when
                                    you're back online.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

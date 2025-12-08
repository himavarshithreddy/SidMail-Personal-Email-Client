import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const startTime = Date.now();
    
    try {
      await apiFetch("/mail/folders");
      setIsAuthed(true);
      // Try to get stored email from localStorage
      const storedEmail = localStorage.getItem("userEmail");
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    } catch (err) {
      setIsAuthed(false);
      setUserEmail("");
    } finally {
      // Ensure minimum display time of 800ms for smooth animation
      const elapsed = Date.now() - startTime;
      const minDelay = 800;
      
      if (elapsed < minDelay) {
        setTimeout(() => setChecking(false), minDelay - elapsed);
      } else {
        setChecking(false);
      }
    }
  };

  const login = async (credentials) => {
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setIsAuthed(true);
    setUserEmail(credentials.username);
    // Store email in localStorage for persistence
    localStorage.setItem("userEmail", credentials.username);
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setIsAuthed(false);
    setUserEmail("");
    localStorage.removeItem("userEmail");
  };

  return { isAuthed, checking, userEmail, login, logout };
}


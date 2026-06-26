import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

export function useAuth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);

  const loadAccounts = async () => {
    try {
      const data = await apiFetch("/auth/accounts");
      const list = data.accounts || [];
      setAccounts(list);
      const stored = localStorage.getItem("activeAccountId");
      const nextActive = stored && list.some((a) => String(a.id) === stored) ? stored : list[0]?.id || null;
      setActiveAccountId(nextActive);
      const activeAcc = list.find((a) => String(a.id) === String(nextActive)) || list[0];
      if (activeAcc?.username) {
        setUserEmail(activeAcc.username);
        localStorage.setItem("userEmail", activeAcc.username);
      }
      if (nextActive) {
        localStorage.setItem("activeAccountId", nextActive);
      } else {
        localStorage.removeItem("activeAccountId");
      }
    } catch (err) {
      setAccounts([]);
      setActiveAccountId(null);
    }
  };

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
      await loadAccounts();
    } catch (err) {
      setIsAuthed(false);
      setUserEmail("");
      setAccounts([]);
      setActiveAccountId(null);
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

  const login = async (credentials, append = false) => {
    if (append) {
      const data = await apiFetch("/auth/add-account", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      const newAcc = data.accounts?.find(a => a.username === credentials.username) || data.accounts?.[data.accounts.length - 1];
      if (newAcc?.id) {
        localStorage.setItem("activeAccountId", newAcc.id);
        localStorage.setItem("userEmail", newAcc.username);
        setUserEmail(newAcc.username);
      }
      await loadAccounts();
      return;
    }
    await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    setIsAuthed(true);
    setUserEmail(credentials.username);
    // Store email in localStorage for persistence
    localStorage.setItem("userEmail", credentials.username);
    await loadAccounts();
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setIsAuthed(false);
    setUserEmail("");
    setAccounts([]);
    setActiveAccountId(null);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("activeAccountId");
  };

  const changeActiveAccount = (id) => {
    setActiveAccountId(id);
    if (id) {
      localStorage.setItem("activeAccountId", id);
      const activeAcc = accounts.find((a) => String(a.id) === String(id));
      if (activeAcc?.username) {
        setUserEmail(activeAcc.username);
        localStorage.setItem("userEmail", activeAcc.username);
      }
    } else {
      localStorage.removeItem("activeAccountId");
      localStorage.removeItem("userEmail");
    }
  };

  return { isAuthed, checking, userEmail, accounts, activeAccountId, changeActiveAccount, login, logout, loadAccounts };
}


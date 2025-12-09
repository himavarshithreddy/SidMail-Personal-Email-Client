import { useState, useRef, useEffect } from "react";

export function TopBar({ 
  onSearch, 
  onLogout,
  userEmail = "",
  onAddAccount,
  accounts = [],
  activeAccountId = null,
  onAccountChange,
  searchQuery = "", 
  resultCount = 0,
  isSearching = false 
}) {
  const activeAccount = accounts.find((a) => String(a.id) === String(activeAccountId)) || accounts[0] || null;
  const seen = new Set();
  const uniqueAccounts = accounts.filter((acc) => {
    const key = String(acc.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const getInitials = (text) => {
    if (!text) return "A";
    return text.trim().charAt(0).toUpperCase();
  };

  const renderAccountRow = (acc, isActive = false) => {
    if (!acc) return null;
    const primary = acc?.label || acc?.username || userEmail || "Account";
    const secondary = acc?.username && acc.username !== primary ? acc.username : null;
    return (
      <div
        className={`group w-full text-left px-3 py-2.5 text-base rounded-lg transition-colors flex items-center gap-3 ${
          isActive ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70"
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-muted/70 text-sm font-semibold text-foreground/90 flex items-center justify-center uppercase ring-1 ring-border">
          {getInitials(primary)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{primary}</div>
          {secondary && <div className="text-sm text-muted-foreground truncate">{secondary}</div>}
        </div>
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_4px] shadow-green-500/20" />
        )}
      </div>
    );
  };
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [searchFilter, setSearchFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const filterRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilters(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    onSearch(value, searchFilter);
  };

  const handleFilterChange = (filter) => {
    setSearchFilter(filter);
    setShowFilters(false);
    if (localQuery) {
      onSearch(localQuery, filter);
    }
  };

  const filterLabels = {
    all: "All fields",
    subject: "Subject",
    from: "From",
    to: "To",
    body: "Body",
    attachments: "Has attachments"
  };

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-background">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <img
            src="/logo-mark.svg"
            alt="SidMail logo"
            className="w-8 h-8"
          />
          <span className="text-lg font-semibold tracking-tight font-futuristic relative">
            <span className="text-primary">SID</span><span className="text-white">MAIL</span>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative group">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          
          <input
            type="text"
            value={localQuery}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/50 border border-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted focus:border-border transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center cursor-pointer ring-1 ring-border hover:ring-primary/50 transition-all shadow-sm hover:shadow-md"
            aria-label="User menu"
            aria-expanded={showProfileMenu}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-5 h-5 text-muted-foreground"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Accounts
                  </div>
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {activeAccount && (
                      <div className="cursor-default">{renderAccountRow(activeAccount, true)}</div>
                    )}
                    {uniqueAccounts
                      .filter((acc) => String(acc.id) !== String(activeAccountId))
                      .map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            onAccountChange?.(acc.id);
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left cursor-pointer"
                        >
                          {renderAccountRow(acc, false)}
                        </button>
                      ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onAddAccount?.();
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-foreground hover:bg-muted transition-colors flex items-center gap-3 text-sm font-semibold cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>Add account</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors text-sm font-semibold cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

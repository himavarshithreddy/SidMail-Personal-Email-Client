import { useState, useRef, useEffect } from "react";

export function TopBar({ 
  onSearch, 
  onLogout,
  userEmail = "",
  searchQuery = "", 
  resultCount = 0,
  isSearching = false 
}) {
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
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">S</span>
          </div>
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
      <div className="flex items-center gap-2">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center cursor-pointer ring-1 ring-border hover:ring-primary/50 transition-all"
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
              className="w-4 h-4 text-muted-foreground"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-base font-medium text-foreground truncate">
                  {userEmail || "User"}
                </p>
                <p className="text-base text-muted-foreground mt-0.5">
                  Account
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-base text-foreground hover:bg-muted transition-colors cursor-pointer flex items-center gap-2"
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
                    className="w-4 h-4 text-muted-foreground"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
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

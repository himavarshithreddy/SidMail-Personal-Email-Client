import { memo } from "react";
import { LoadingSkeleton } from "./ui/Loading";

const folderIcons = {
  "INBOX": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  "Inbox": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  "Starred": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  ),
  "Sent": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  ),
  "Archive": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  "Trash": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  "Spam": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  "Junk": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

export const FolderList = memo(function FolderList({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCompose,
  loading 
}) {
  if (loading) {
    return (
      <aside className="w-64 h-full bg-sidebar flex flex-col">
        <div className="p-4">
          <LoadingSkeleton count={5} />
        </div>
      </aside>
    );
  }

  // Define core folders for ordering (they'll appear first)
  const coreFolderNames = ["INBOX", "Inbox", "Starred", "Sent", "Archive", "Trash", "Spam", "Junk"];
  
  // Sort folders: core folders first, then others
  const sortedFolders = (folders || []).filter(f => f != null).sort((a, b) => {
    if (!a || !b) return 0;
    const aIsCore = coreFolderNames.some(name => (a.path && a.path.includes(name)) || a.name === name);
    const bIsCore = coreFolderNames.some(name => (b.path && b.path.includes(name)) || b.name === name);
    
    if (aIsCore && !bIsCore) return -1;
    if (!aIsCore && bIsCore) return 1;
    
    // Within same category, sort alphabetically
    const aName = (a.name || a.path || '').toLowerCase();
    const bName = (b.name || b.path || '').toLowerCase();
    return aName.localeCompare(bName);
  });

  const getFolderIcon = (folder) => {
    const defaultIcon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
    
    if (!folder || !folderIcons || typeof folderIcons !== 'object') {
      return defaultIcon;
    }
    
    try {
      const entries = Object.entries(folderIcons);
      if (!entries || entries.length === 0) {
        return defaultIcon;
      }
      for (const [key, icon] of entries) {
        if ((folder.name === key) || (folder.path && folder.path.includes(key))) {
          return icon;
        }
      }
    } catch (error) {
      console.error('Error getting folder icon:', error);
      return defaultIcon;
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  };

  return (
    <aside className="w-64 h-full bg-sidebar flex flex-col">
      {/* Compose Button */}
      <div className="p-3">
        <button 
          onClick={onCompose}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          aria-label="Compose new message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Compose
        </button>
      </div>

      {/* Folders */}
      <nav className="flex-1 px-2">
        {folders.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-lg text-sidebar-foreground">
            No folders found
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* All Folders */}
            {sortedFolders.map((folder) => {
              const isSelected = selectedFolder === folder.path;
              return (
                <button
                  key={folder.path}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-base transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                  }`}
                  onClick={() => onSelectFolder(folder.path)}
                  aria-current={isSelected ? "page" : undefined}
                >
                  <span className={isSelected ? "text-primary" : ""}>
                    {getFolderIcon(folder)}
                  </span>
                  <span className="flex-1 text-left capitalize">
                    {(() => {
                      const folderName = (folder.name || folder.path).toLowerCase();
                      // Replace "junk" with "spam" for display
                      if (folderName.includes("junk")) {
                        return folderName.replace(/junk/g, "spam");
                      }
                      return folderName;
                    })()}
                  </span>
                  {folder.count > 0 && (
                    <span className="text-sm text-muted-foreground tabular-nums">{folder.count}</span>
                  )}
                </button>
              );
            })}

          </div>
        )}
      </nav>

      {/* Links + Settings */}
      <div className="p-2 border-t border-sidebar-border space-y-2">
        <a
          href="https://mail.sidmail.app/admin/user/settings"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
          aria-label="Open server"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
          aria-label="Open webmail"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16v12H4z" />
            <path d="m4 6 8 7 8-7" />
          </svg>
          <span>Client</span>
        </a>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors cursor-pointer"
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
});

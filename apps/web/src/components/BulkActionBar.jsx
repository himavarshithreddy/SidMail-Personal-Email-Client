export function BulkActionBar({ 
  selectedCount, 
  onDelete, 
  onMarkRead, 
  onMarkUnread,
  onRemoveFromSpam,
  selectedFolder,
  onClearSelection 
}) {
  if (selectedCount === 0) return null;

  // Check if current folder is spam/junk
  const isSpamFolder = selectedFolder && (
    selectedFolder.toLowerCase().includes("spam") ||
    selectedFolder.toLowerCase().includes("junk")
  );

  return (
    <div className="px-4 py-2.5 bg-primary/10 border-b border-border animate-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm sm:text-base font-medium text-foreground whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {isSpamFolder && onRemoveFromSpam ? (
              <button
                onClick={onRemoveFromSpam}
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground bg-transparent hover:bg-muted rounded-md border border-border hover:border-border transition-colors cursor-pointer whitespace-nowrap"
                title="Remove from spam (move to inbox)"
              >
                Remove from spam
              </button>
            ) : null}
            <button
              onClick={onMarkRead}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground bg-transparent hover:bg-muted rounded-md border border-border hover:border-border transition-colors cursor-pointer whitespace-nowrap"
              title="Mark as read"
            >
              Mark read
            </button>
            <button
              onClick={onMarkUnread}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground bg-transparent hover:bg-muted rounded-md border border-border hover:border-border transition-colors cursor-pointer whitespace-nowrap"
              title="Mark as unread"
            >
              Mark unread
            </button>
            <button
              onClick={onDelete}
              className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-destructive-foreground bg-destructive/10 hover:bg-destructive/20 rounded-md border border-destructive/20 hover:border-destructive/30 transition-colors cursor-pointer whitespace-nowrap"
              title="Delete selected"
            >
              Delete
            </button>
          </div>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          aria-label="Clear selection"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

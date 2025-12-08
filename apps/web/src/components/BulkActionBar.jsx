export function BulkActionBar({ 
  selectedCount, 
  onDelete, 
  onMarkRead, 
  onMarkUnread,
  onClearSelection 
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="px-4 py-2.5 bg-primary/10 border-b border-border animate-in slide-in-from-top-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-foreground">
            {selectedCount} selected
          </span>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkRead}
              className="px-3 py-1.5 text-base font-medium text-foreground bg-transparent hover:bg-muted rounded-md border border-border hover:border-border transition-colors cursor-pointer"
              title="Mark as read"
            >
              Mark read
            </button>
            <button
              onClick={onMarkUnread}
              className="px-3 py-1.5 text-base font-medium text-foreground bg-transparent hover:bg-muted rounded-md border border-border hover:border-border transition-colors cursor-pointer"
              title="Mark as unread"
            >
              Mark unread
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-base font-medium text-destructive-foreground bg-destructive/10 hover:bg-destructive/20 rounded-md border border-destructive/20 hover:border-destructive/30 transition-colors cursor-pointer"
              title="Delete selected"
            >
              Delete
            </button>
          </div>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-base text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Clear selection"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

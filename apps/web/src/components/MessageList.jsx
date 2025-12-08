import { memo, useState, useEffect } from "react";
import { LoadingSkeleton } from "./ui/Loading";
import { ErrorMessage } from "./ui/ErrorMessage";
import { BulkActionBar } from "./BulkActionBar";

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

function highlightText(text, query) {
  if (!query || !text) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? `<mark class="bg-primary/30 text-foreground">${part}</mark>` 
      : part
  ).join('');
}

export const MessageList = memo(function MessageList({
  messages,
  selectedMessage,
  selectedFolder,
  selectedEmails,
  onSelectMessage,
  onToggleSelection,
  onSelectAll,
  onRefresh,
  onLoadMore,
  onBulkDelete,
  onBulkMarkRead,
  onBulkMarkUnread,
  hasMore,
  loading,
  error,
  searchQuery,
}) {
  const [isRotating, setIsRotating] = useState(false);

  const allSelected = messages.length > 0 && messages.every(msg => selectedEmails?.has(msg.uid));
  const someSelected = messages.some(msg => selectedEmails?.has(msg.uid)) && !allSelected;

  const handleSelectAll = () => {
    onSelectAll(!allSelected);
  };

  const handleRefresh = () => {
    setIsRotating(true);
    onRefresh();
    // Ensure animation plays for at least 600ms (one full rotation)
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  // Stop animation when loading completes, but only after minimum duration
  useEffect(() => {
    if (!loading && isRotating) {
      // Animation will be stopped by the timeout
    }
  }, [loading, isRotating]);

  return (
    <div className="w-full lg:w-[28rem] h-full flex flex-col border-r border-border bg-card/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                aria-label="Select all messages"
              />
            </label>
          )}
          <h2 className="text-base font-medium text-foreground capitalize">
            {selectedFolder.toLowerCase()}
          </h2>
          <span className="text-base text-muted-foreground tabular-nums">{messages.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRefresh}
            disabled={isRotating}
            aria-label="Refresh messages"
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
              className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors ${isRotating ? 'animate-spin' : ''}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedEmails?.size || 0}
        onDelete={onBulkDelete}
        onMarkRead={onBulkMarkRead}
        onMarkUnread={onBulkMarkUnread}
        onClearSelection={() => onSelectAll(false)}
      />

      {/* Message List */}
      <div className="flex-1 overflow-auto">
        {loading && messages.length === 0 ? (
          <LoadingSkeleton count={6} />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8 text-center text-base text-muted-foreground">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p>No messages in this folder</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const seen = msg.flags?.includes("\\Seen");
              const flagged = msg.flags?.includes("\\Flagged");
              const isViewing = selectedMessage?.uid === msg.uid;
              const isChecked = selectedEmails?.has(msg.uid);

              return (
                <div
                  key={msg.uid}
                  className={`relative transition-colors ${
                    isChecked ? "bg-primary/10" : ""
                  } ${
                    isViewing && !isChecked ? "bg-muted/30" : ""
                  } hover:bg-muted/30 border-b border-border last:border-b-0`}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    {/* Checkbox */}
                    <label className="flex items-center pt-0.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggleSelection(msg.uid)}
                        className="w-4 h-4 rounded border-border bg-transparent text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
                        aria-label={`Select ${msg.subject || 'message'}`}
                      />
                    </label>

                    {/* Star Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Future: Add star toggle functionality
                      }}
                      className="flex-shrink-0 pt-0.5 hover:scale-110 transition-transform cursor-pointer"
                      aria-label={flagged ? "Starred" : "Not starred"}
                    >
                      {flagged ? (
                        <svg className="w-4 h-4 text-amber-400 fill-amber-400" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-muted-foreground hover:text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      )}
                    </button>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectMessage(msg)}>
                      <div className="flex items-center gap-2 mb-0.5">
                        {!seen && (
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary" />
                        )}
                        <span
                          className={`text-base truncate ${
                            seen ? "text-muted-foreground font-normal" : "font-semibold text-foreground"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: highlightText(
                              (msg.from || []).map((f) => f.name || f.address).join(", ") || "Unknown sender",
                              searchQuery
                            )
                          }}
                        />
                        <span className={`text-sm whitespace-nowrap ml-auto ${
                          seen ? "text-muted-foreground" : "text-foreground/90 font-medium"
                        }`}>
                          {formatDate(msg.date)}
                        </span>
                      </div>

                      <div 
                        className={`text-base truncate mb-0.5 ${
                          seen ? "text-muted-foreground font-normal" : "font-medium text-foreground"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: highlightText(msg.subject || "(No subject)", searchQuery)
                        }}
                      />

                      {msg.hasAttachments && (
                        <div className="flex items-center gap-1">
                          <svg className={`w-3 h-3 ${seen ? "text-muted-foreground/70" : "text-muted-foreground"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && messages.length > 0 && (
              <div className="py-4">
                <LoadingSkeleton count={2} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {error && (
        <div className="p-3 border-t border-border">
          <ErrorMessage message={error} onRetry={onRefresh} />
        </div>
      )}
      {hasMore && !loading && !error && (
        <div className="p-3 border-t border-border">
          <button className="btn-ghost w-full cursor-pointer" onClick={onLoadMore}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
});

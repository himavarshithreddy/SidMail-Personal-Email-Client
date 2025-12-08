import { Loading } from "./ui/Loading";
import { API_BASE } from "../lib/api";
import { sanitizeHTMLLength, formatFileSize, truncate } from "../lib/validation";

export function MessageDetail({
  message,
  detail,
  loading,
  selectedFolder,
  onCompose,
  onStar,
  onMarkUnread,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        <div className="flex items-center justify-center p-6 border-b border-border">
          <span className="text-lg text-muted-foreground">Loading...</span>
        </div>
        <Loading />
      </div>
    );
  }

  if (!message || !detail) {
    return (
      <div className="flex-1 flex flex-col bg-background h-full">
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base text-muted-foreground">Select an email to read</p>
          </div>
        </div>
      </div>
    );
  }

  const isFlagged = (message.flags || []).includes("\\Flagged");

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Header with Actions */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-foreground capitalize">
            {truncate(detail.message.subject || "(No subject)", 50)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={onStar}
            aria-label={isFlagged ? "Unstar message" : "Star message"}
            title={isFlagged ? "Unstar" : "Star"}
          >
            {isFlagged ? (
              <svg className="w-5 h-5 text-amber-400 fill-amber-400" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={() => {
              onCompose();
            }}
            aria-label="Reply"
            title="Reply"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={onMarkUnread}
            aria-label="Mark as unread"
            title="Mark as unread"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-muted hover:text-destructive transition-colors cursor-pointer"
            onClick={onDelete}
            aria-label="Delete message"
            title="Delete"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Message Content */}
      <article className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Message Header */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-foreground break-words capitalize">
                {detail.message.subject || "(No subject)"}
              </h1>

                <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-foreground font-semibold">
                    {(detail.message.from[0]?.name || detail.message.from[0]?.address || "?").charAt(0).toUpperCase()}
                  </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-base capitalize">
                      {detail.message.from.map((f) => f.name || f.address).join(", ")}
                    </div>
                    <div className="text-muted-foreground text-base break-all mt-0.5">
                      {detail.message.from.map((f) => f.address).join(", ")}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-base whitespace-nowrap">
                      {new Date(detail.date).toLocaleString()}
                  </div>
                </div>
                
                <div className="mt-3 space-y-1 text-base">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-8">To:</span>
                    <span className="text-foreground/80 break-words">
                      {detail.message.to.map((f) => f.address || f.name).join(", ")}
                    </span>
                  </div>
                  {detail.message.cc && detail.message.cc.length > 0 && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-8">CC:</span>
                      <span className="text-foreground/80 break-words">
                        {detail.message.cc.map((f) => f.address || f.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message Body */}
        <div
          className="prose prose-invert prose-sm max-w-none text-foreground/90 leading-relaxed"
          style={{
            wordBreak: "break-word"
          }}
          dangerouslySetInnerHTML={{
            __html: sanitizeHTMLLength(
              detail.message.html || detail.message.text?.replace(/\n/g, "<br>") || "",
              100000
            ),
          }}
        />

          {/* Attachments */}
        {detail.attachments && detail.attachments.length > 0 && (
            <section className="space-y-3 pt-6 border-t border-border">
              <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attachments ({detail.attachments.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {detail.attachments.map((att) => (
                <a
                  key={att.part}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/50 border border-border hover:border-primary/50 text-base transition-all group cursor-pointer capitalize"
                  href={`${API_BASE}/mail/attachments/${detail.uid}/${att.part}?folder=${encodeURIComponent(
                    selectedFolder
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  title={att.filename}
                >
                    <svg className="w-5 h-5 text-primary group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate max-w-[150px] sm:max-w-xs text-foreground group-hover:text-foreground">
                    {truncate(att.filename, 30)}
                  </span>
                    <span className="text-base text-muted-foreground group-hover:text-foreground/70">
                    ({formatFileSize(att.size)})
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
        </div>
      </article>
    </div>
  );
}

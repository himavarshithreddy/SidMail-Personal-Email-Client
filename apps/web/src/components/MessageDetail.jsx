import { useState } from "react";
import { AttachmentCard } from "./AttachmentCard";
import { downloadAllAttachments } from "../lib/attachments";
import { EmailBody } from "./EmailBody";

const AVATAR_GRADIENTS = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
  "from-lime-500 to-emerald-600",
];

function getAvatarGradient(name) {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function ActionButton({ onClick, label, title, children, variant = "default" }) {
  return (
    <button
      className={`p-2 rounded-lg transition-all duration-150 cursor-pointer group/btn ${
        variant === "destructive"
          ? "hover:bg-destructive/10 hover:text-destructive"
          : "hover:bg-muted"
      }`}
      onClick={onClick}
      aria-label={label}
      title={title}
    >
      <div className="transition-transform duration-150 group-hover/btn:scale-110">
        {children}
      </div>
    </button>
  );
}

export function MessageDetail({
  message,
  detail,
  loading,
  selectedFolder,
  onReply,
  onCompose,
  onForward,
  onStar,
  onMarkUnread,
  onMarkAsSpam,
  onUnmarkSpam,
  onRestoreFromTrash,
  onDelete,
  onBack,
}) {
  if (loading) {
    return (
      <>
        <div className="border-b border-border bg-background/40">
          <div className="px-6 py-4 space-y-3">
            <div className="h-5 w-3/4 bg-muted/40 rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted/40 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted/40 rounded animate-pulse" />
                <div className="h-3 w-1/4 bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
          <div className="h-3 w-5/6 bg-muted/30 rounded animate-pulse" />
          <div className="h-3 w-4/6 bg-muted/30 rounded animate-pulse" />
          <div className="h-3 w-full bg-muted/20 rounded animate-pulse mt-4" />
          <div className="h-3 w-3/4 bg-muted/20 rounded animate-pulse" />
        </div>
      </>
    );
  }

  if (!message || !detail) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground/60">Select a message</p>
            <p className="text-xs text-muted-foreground mt-1">Choose an email from the list to read it</p>
          </div>
        </div>
      </div>
    );
  }

  const isFlagged = (message.flags || []).includes("\\Flagged");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showFullRecipients, setShowFullRecipients] = useState(false);

  const isSpamFolder = selectedFolder && (
    selectedFolder.toLowerCase().includes("spam") ||
    selectedFolder.toLowerCase().includes("junk")
  );
  const isTrashFolder = selectedFolder && (
    selectedFolder.toLowerCase().includes("trash") ||
    selectedFolder.toLowerCase().includes("bin") ||
    selectedFolder.toLowerCase().includes("deleted")
  );

  const senderName = detail.message.from[0]?.name || detail.message.from[0]?.address || "?";
  const senderGradient = getAvatarGradient(senderName);
  const toList = detail.message.to || [];
  const ccList = detail.message.cc || [];
  const totalRecipients = toList.length + ccList.length;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${detail.message.subject || "Email"}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #ddd;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .subject {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .body {
              margin-top: 20px;
            }
            .attachments {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
            }
            .attachments h3 {
              font-size: 16px;
              margin-bottom: 10px;
            }
            .attachment-item {
              margin: 5px 0;
              color: #666;
            }
            @media print {
              body {
                margin: 0;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="subject">${detail.message.subject || "(No subject)"}</div>
            <div class="meta"><strong>From:</strong> ${detail.message.from.map(f => f.name || f.address).join(", ")}</div>
            <div class="meta"><strong>To:</strong> ${detail.message.to.map(f => f.address || f.name).join(", ")}</div>
            ${detail.message.cc && detail.message.cc.length > 0 ? `<div class="meta"><strong>CC:</strong> ${detail.message.cc.map(f => f.address || f.name).join(", ")}</div>` : ""}
            <div class="meta"><strong>Date:</strong> ${new Date(detail.date).toLocaleString()}</div>
          </div>
          <div class="body">
            ${detail.message.html || detail.message.text?.replace(/\n/g, "<br>") || ""}
          </div>
          ${detail.attachments && detail.attachments.length > 0 ? `
            <div class="attachments">
              <h3>Attachments (${detail.attachments.length})</h3>
              ${detail.attachments.map(att => `<div class="attachment-item">${att.filename} (${(att.size / 1024).toFixed(2)} KB)</div>`).join("")}
            </div>
          ` : ""}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadAll = async () => {
    if (!detail.attachments || detail.attachments.length === 0) return;

    setDownloadingAll(true);
    try {
      await downloadAllAttachments(
        detail.attachments,
        detail.uid,
        selectedFolder,
        (current, total) => {
          console.log(`Downloading: ${current}/${total}`);
        }
      );
    } catch (error) {
      console.error("Failed to download all attachments:", error);
      alert(`Failed to download attachments: ${error.message}`);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <article className="flex-1 overflow-auto min-w-0 w-full flex flex-col">
      {/* Action Bar */}
      <header className="flex items-center px-2 sm:px-4 py-1.5 border-b border-border bg-background/40 min-w-0 w-full shrink-0 overflow-x-auto scrollbar-hidden">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {onBack && (
            <div className="lg:hidden flex items-center mr-1">
              <ActionButton onClick={onBack} label="Back" title="Back to messages">
                <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </ActionButton>
              <div className="w-px h-5 bg-border mx-1" />
            </div>
          )}

          <ActionButton onClick={onStar} label={isFlagged ? "Unstar" : "Star"} title={isFlagged ? "Unstar" : "Star"}>
            {isFlagged ? (
              <svg className="w-4.5 h-4.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.4)]" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
          </ActionButton>

          <div className="w-px h-5 bg-border mx-0.5" />

          <ActionButton onClick={() => (onReply || onCompose)()} label="Reply" title="Reply">
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </ActionButton>

          <ActionButton onClick={() => onForward?.()} label="Forward" title="Forward">
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
            </svg>
          </ActionButton>

          <ActionButton onClick={handlePrint} label="Print" title="Print">
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </ActionButton>

          <ActionButton onClick={onMarkUnread} label="Mark unread" title="Mark as unread">
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </ActionButton>

          <div className="w-px h-5 bg-border mx-0.5" />

          {isSpamFolder ? (
            <ActionButton onClick={onUnmarkSpam} label="Not spam" title="Not spam (move to inbox)">
              <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </ActionButton>
          ) : (
            <ActionButton onClick={onMarkAsSpam} label="Spam" title="Mark as spam">
              <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </ActionButton>
          )}

          {isTrashFolder && (
            <ActionButton onClick={onRestoreFromTrash} label="Restore" title="Move to inbox">
              <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5 5 12l7 7" />
              </svg>
            </ActionButton>
          )}

          <ActionButton onClick={onDelete} label="Delete" title="Delete" variant="destructive">
            <svg className="w-4.5 h-4.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </ActionButton>
        </div>
      </header>

      {/* Message Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 min-w-0 w-full flex-1">
          {/* Subject / Title Area */}
          <div className="border-l-4 border-primary pl-3 sm:pl-4 py-1 flex flex-col gap-1.5 min-w-0 w-full">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shadow-2xs uppercase tracking-wider">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {selectedFolder || "Message"}
              </span>
              {isFlagged && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs uppercase tracking-wider">
                  Starred
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-foreground via-foreground/90 to-muted-foreground leading-tight sm:leading-snug tracking-tight" style={{ wordBreak: "break-word" }}>
              {detail.message.subject || "(No subject)"}
            </h1>
          </div>

          {/* Subheader: Sender & Recipients Glassmorphism Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/20 border border-border/40 backdrop-blur-xs shadow-sm hover:shadow-md hover:bg-muted/30 transition-all duration-200 min-w-0 w-full flex items-start gap-3.5 sm:gap-4">
            <div className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-linear-to-br ${senderGradient} sender-avatar text-white text-base font-bold flex items-center justify-center shadow-lg ring-2 ring-primary/20 hover:ring-primary/40 transition-all`}>
              {senderName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="font-bold text-foreground text-sm sm:text-base tracking-tight truncate">
                    {detail.message.from.map((f) => f.name || f.address).join(", ")}
                  </span>
                  <span className="hidden sm:inline text-muted-foreground text-xs truncate shrink-0 bg-background/60 px-2 py-0.5 rounded-md border border-border/40">
                    &lt;{detail.message.from.map((f) => f.address).join(", ")}&gt;
                  </span>
                </div>
                <time className="text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-md bg-background/60 border border-border/40 shadow-2xs whitespace-nowrap tabular-nums shrink-0" title={new Date(detail.date).toLocaleString()}>
                  {formatDate(detail.date)}
                </time>
              </div>

              <div className="mt-1 text-xs text-muted-foreground/80 min-w-0 w-full">
                <button
                  onClick={() => setShowFullRecipients(!showFullRecipients)}
                  className="hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1 max-w-full min-w-0 py-0.5"
                >
                  <span className="truncate font-medium">to {toList.length > 0 ? (toList[0].name || toList[0].address) : "me"}</span>
                  {totalRecipients > 1 && (
                    <span className="shrink-0 font-medium"> and {totalRecipients - 1} other{totalRecipients - 1 > 1 ? "s" : ""}</span>
                  )}
                  <svg className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${showFullRecipients ? "rotate-180 text-primary" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showFullRecipients && (
                  <div className="mt-2.5 p-3.5 rounded-xl bg-background/80 border border-border/60 shadow-inner space-y-2 text-xs backdrop-blur-sm animate-in fade-in-50 duration-150">
                    <div className="flex gap-2.5">
                      <span className="text-muted-foreground font-medium w-9 shrink-0 text-right">From</span>
                      <span className="text-foreground font-medium" style={{ wordBreak: "break-word" }}>
                        {detail.message.from.map((f) => f.name ? `${f.name} <${f.address}>` : f.address).join(", ")}
                      </span>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="text-muted-foreground font-medium w-9 shrink-0 text-right">To</span>
                      <span className="text-foreground/90" style={{ wordBreak: "break-word" }}>
                        {toList.map((f) => f.name ? `${f.name} <${f.address}>` : f.address).join(", ")}
                      </span>
                    </div>
                    {ccList.length > 0 && (
                      <div className="flex gap-2.5">
                        <span className="text-muted-foreground font-medium w-9 shrink-0 text-right">Cc</span>
                        <span className="text-foreground/90" style={{ wordBreak: "break-word" }}>
                          {ccList.map((f) => f.name ? `${f.name} <${f.address}>` : f.address).join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2.5">
                      <span className="text-muted-foreground font-medium w-9 shrink-0 text-right">Date</span>
                      <span className="text-foreground/90 font-medium">
                        {new Date(detail.date).toLocaleString([], { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Message Body */}
          <EmailBody html={detail.message.html} text={detail.message.text} />

          {/* Attachments */}
          {detail.attachments && detail.attachments.length > 0 && (
            <section className="space-y-3 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>{detail.attachments.length} attachment{detail.attachments.length > 1 ? "s" : ""}</span>
                </h2>
                {detail.attachments.length > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloadingAll}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 hover:shadow-sm"
                    title="Download all attachments as ZIP"
                  >
                    {downloadingAll ? (
                      <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Creating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        <span>Download All</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {detail.attachments.map((att, idx) => (
                  <AttachmentCard
                    key={att.part || att.filename || idx}
                    attachment={att}
                    uid={detail.uid}
                    folder={selectedFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Quick Reply/Forward bar at bottom */}
          <div className="pt-4 border-t border-border/30 flex gap-2">
            <button
              onClick={() => (onReply || onCompose)()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border/60 hover:bg-muted/40 text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
            <button
              onClick={() => onForward?.()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border/60 hover:bg-muted/40 text-sm text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
              </svg>
              Forward
            </button>
          </div>
        </div>
    </article>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMail } from "../hooks/useMail";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { LoginForm } from "../components/LoginForm";
import { TopBar } from "../components/TopBar";
import { FolderList } from "../components/FolderList";
import { MessageList } from "../components/MessageList";
import { MessageDetail } from "../components/MessageDetail";
import { ComposeModal } from "../components/ComposeModal";
import { MobileNav } from "../components/MobileNav";
import { HelpModal } from "../components/HelpModal";
import { Toast } from "../components/ui/Toast";
import { SplashLoader } from "../components/ui/SplashLoader";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

export default function Home() {
  const { isAuthed, checking, userEmail, login, logout } = useAuth();
  const {
    folders,
    messages,
    selectedFolder,
    selectedMessage,
    messageDetail,
    nextCursor,
    loading,
    loadFolders,
    loadMessages,
    loadMessageDetail,
    markSeen,
    toggleFlag,
    deleteMessage,
    sendMail,
    selectFolder,
  } = useMail();

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState("folders");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [selectedEmails, setSelectedEmails] = useState(new Set());

  // Keyboard shortcuts
  useKeyboardShortcuts({
    "c": () => isAuthed && setComposeOpen(true),
    "?": () => setHelpOpen(true),
    "escape": () => {
      if (composeOpen) setComposeOpen(false);
      else if (helpOpen) setHelpOpen(false);
    },
    "j": () => {
      // Navigate to next message
      if (isAuthed && messages.length > 0) {
        const currentIndex = messages.findIndex(m => m.uid === selectedMessage?.uid);
        const nextIndex = Math.min(currentIndex + 1, messages.length - 1);
        if (nextIndex > currentIndex && messages[nextIndex]) {
          handleSelectMessage(messages[nextIndex]);
        }
      }
    },
    "k": () => {
      // Navigate to previous message
      if (isAuthed && messages.length > 0) {
        const currentIndex = messages.findIndex(m => m.uid === selectedMessage?.uid);
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex < currentIndex && messages[prevIndex]) {
          handleSelectMessage(messages[prevIndex]);
        }
      }
    },
  }, [isAuthed, messages, selectedMessage, composeOpen, helpOpen]);

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    
    const query = searchQuery.toLowerCase();
    return messages.filter(msg => {
      if (searchFilter === "subject") {
        return msg.subject?.toLowerCase().includes(query);
      } else if (searchFilter === "from") {
        return msg.from?.some(f => 
          f.address?.toLowerCase().includes(query) || 
          f.name?.toLowerCase().includes(query)
        );
      } else if (searchFilter === "to") {
        return msg.to?.some(f => 
          f.address?.toLowerCase().includes(query) || 
          f.name?.toLowerCase().includes(query)
        );
      } else if (searchFilter === "body") {
        return msg.text?.toLowerCase().includes(query);
      } else if (searchFilter === "attachments") {
        return msg.hasAttachments;
      } else {
        // Search all fields
        return (
          msg.subject?.toLowerCase().includes(query) ||
          msg.from?.some(f => 
            f.address?.toLowerCase().includes(query) || 
            f.name?.toLowerCase().includes(query)
          ) ||
          msg.to?.some(f => 
            f.address?.toLowerCase().includes(query) || 
            f.name?.toLowerCase().includes(query)
          ) ||
          msg.text?.toLowerCase().includes(query)
        );
      }
    });
  }, [messages, searchQuery, searchFilter]);

  const showToast = (msg) => {
    setToast(msg);
  };

  const handleError = (err) => {
    setError(err.message || "An error occurred");
    setTimeout(() => setError(""), 5000);
  };

  const handleSearch = (query, filter) => {
    setSearchQuery(query);
    setSearchFilter(filter);
  };

  const handleToggleSelection = (uid) => {
    setSelectedEmails(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handleSelectAll = (selectAll) => {
    if (selectAll) {
      setSelectedEmails(new Set(filteredMessages.map(msg => msg.uid)));
    } else {
      setSelectedEmails(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) return;
    try {
      // Delete each selected message
      const deletePromises = Array.from(selectedEmails).map(uid => {
        const msg = messages.find(m => m.uid === uid);
        return msg ? deleteMessage(msg, selectedFolder) : Promise.resolve();
      });
      await Promise.all(deletePromises);
      showToast(`Deleted ${selectedEmails.size} message(s)`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkMarkRead = async () => {
    if (selectedEmails.size === 0) return;
    try {
      const markPromises = Array.from(selectedEmails).map(uid => {
        const msg = messages.find(m => m.uid === uid);
        return msg ? markSeen(msg, true, selectedFolder) : Promise.resolve();
      });
      await Promise.all(markPromises);
      showToast(`Marked ${selectedEmails.size} message(s) as read`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkMarkUnread = async () => {
    if (selectedEmails.size === 0) return;
    try {
      const markPromises = Array.from(selectedEmails).map(uid => {
        const msg = messages.find(m => m.uid === uid);
        return msg ? markSeen(msg, false, selectedFolder) : Promise.resolve();
      });
      await Promise.all(markPromises);
      showToast(`Marked ${selectedEmails.size} message(s) as unread`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  // Load folders only once when authenticated
  useEffect(() => {
    if (isAuthed) {
      loadFolders().catch(handleError);
    }
  }, [isAuthed]);

  // Load messages when folder changes
  useEffect(() => {
    if (isAuthed) {
      loadMessages(selectedFolder, null, true).catch(handleError);
      // Clear selections when changing folders
      setSelectedEmails(new Set());
      setSearchQuery("");
    }
  }, [isAuthed, selectedFolder]);

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      showToast("Logged in successfully");
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out");
    } catch (err) {
      handleError(err);
    }
  };

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleSelectFolder = (folder) => {
    selectFolder(folder);
    // Auto-switch to messages view on mobile
    setMobileView("messages");
  };

  const handleRefreshMessages = () => {
    loadMessages(selectedFolder, null, true).catch(handleError);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      loadMessages(selectedFolder, nextCursor, false).catch(handleError);
    }
  };

  const handleSelectMessage = (message) => {
    loadMessageDetail(message, selectedFolder)
      .catch((err) => {
        if (err.message && err.message.includes("not found")) {
          showToast("Message not found. It may have been deleted.");
          handleRefreshMessages();
        } else {
          handleError(err);
        }
      });
    // Auto-switch to detail view on mobile
    setMobileView("detail");
  };

  const handleStar = async () => {
    if (!selectedMessage) return;
    try {
      const isFlagged = (selectedMessage.flags || []).includes("\\Flagged");
      await toggleFlag(selectedMessage, "\\Flagged", !isFlagged, selectedFolder);
      showToast(isFlagged ? "Unstarred" : "Starred");
    } catch (err) {
      handleError(err);
    }
  };

  const handleMarkUnread = async () => {
    if (!selectedMessage) return;
    try {
      await markSeen(selectedMessage, false, selectedFolder);
      showToast("Marked as unread");
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    try {
      await deleteMessage(selectedMessage, selectedFolder);
      showToast("Message deleted");
    } catch (err) {
      handleError(err);
    }
  };

  const handleForward = () => {
    if (!messageDetail) return;
    
    // Format the forwarded message
    const forwardText = `\n\n---------- Forwarded message ----------\n` +
      `From: ${messageDetail.message.from.map(f => f.name || f.address).join(", ")}\n` +
      `Date: ${new Date(messageDetail.date).toLocaleString()}\n` +
      `To: ${messageDetail.message.to.map(f => f.address || f.name).join(", ")}\n` +
      `Subject: ${messageDetail.message.subject || "(No subject)"}\n\n` +
      `${messageDetail.message.text || messageDetail.message.html?.replace(/<[^>]*>/g, "") || ""}`;
    
    const forwardSubject = `Fwd: ${messageDetail.message.subject || "(No subject)"}`;
    
    setComposeInitialData({
      to: "",
      subject: forwardSubject,
      text: forwardText,
      isForward: true,
    });
    setComposeOpen(true);
  };

  const handleSendMail = async (mailData) => {
    try {
      await sendMail(mailData);
      showToast("Message sent");
      setComposeInitialData(null);
      // Refresh messages after sending
      setTimeout(() => {
        loadMessages(selectedFolder, null, true).catch(handleError);
      }, 1000);
    } catch (err) {
      throw err;
    }
  };

  if (checking) {
    return <SplashLoader />;
  }

  // Not authenticated - show login
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-6">
          <header className="text-center">
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-base">S</span>
              </div>
              <h1 className="text-2xl font-semibold text-foreground">SidMail</h1>
            </div>
          </header>

          <LoginForm onLogin={handleLogin} />

          <div className="text-center">
            <button
              onClick={() => setHelpOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Keyboard shortcuts (Press ?)"
            >
              Keyboard shortcuts (?)
            </button>
          </div>
        </div>

        <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    );
  }

  // Authenticated - show main app
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar
        onSearch={handleSearch}
        onLogout={handleLogoutClick}
        userEmail={userEmail}
        searchQuery={searchQuery}
        resultCount={filteredMessages.length}
        isSearching={!!searchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <div className={`${mobileView === "folders" ? "block" : "hidden"} lg:block`}>
          <FolderList
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCompose={() => setComposeOpen(true)}
            loading={loading.folders}
          />
        </div>

        {/* Message List */}
        <div className={`${mobileView === "messages" ? "block" : "hidden"} lg:block h-full`}>
          <MessageList
            messages={filteredMessages}
            selectedMessage={selectedMessage}
            selectedFolder={selectedFolder}
            selectedEmails={selectedEmails}
            onSelectMessage={handleSelectMessage}
            onToggleSelection={handleToggleSelection}
            onSelectAll={handleSelectAll}
            onRefresh={handleRefreshMessages}
            onLoadMore={handleLoadMore}
            onBulkDelete={handleBulkDelete}
            onBulkMarkRead={handleBulkMarkRead}
            onBulkMarkUnread={handleBulkMarkUnread}
            hasMore={!!nextCursor}
            loading={loading.messages}
            error={error}
            searchQuery={searchQuery}
          />
        </div>

        {/* Message Detail */}
        <div className={`${mobileView === "detail" ? "block" : "hidden"} lg:block flex-1`}>
          <MessageDetail
            message={selectedMessage}
            detail={messageDetail}
            loading={loading.detail}
            selectedFolder={selectedFolder}
            onCompose={() => {
              setComposeInitialData(null);
              setComposeOpen(true);
            }}
            onForward={handleForward}
            onStar={handleStar}
            onMarkUnread={handleMarkUnread}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav currentView={mobileView} onViewChange={setMobileView} />

      {/* Compose Modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setComposeInitialData(null);
        }}
        onSend={handleSendMail}
        initialData={composeInitialData}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />

      {/* Toast Notification */}
      <Toast message={toast} onClose={() => setToast("")} />

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout? Any unsaved changes will be lost."
        confirmText="Logout"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

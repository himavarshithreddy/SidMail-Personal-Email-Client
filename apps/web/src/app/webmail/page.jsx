"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useMail } from "../../hooks/useMail";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { TopBar } from "../../components/TopBar";
import { FolderList } from "../../components/FolderList";
import { MessageList } from "../../components/MessageList";
import { DetailView } from "../../components/DetailView";
import { HelpModal } from "../../components/HelpModal";
import { Toast } from "../../components/ui/Toast";
import { SplashLoader } from "../../components/ui/SplashLoader";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";

export default function WebmailPage() {
  return (
    <Suspense fallback={<SplashLoader />}>
      <WebmailPageContent />
    </Suspense>
  );
}

function WebmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastSyncedParams = useRef(searchParams.toString());
  const suppressUrlApplyRef = useRef(false);
  const { isAuthed, checking, userEmail, accounts, activeAccountId, changeActiveAccount, logout, loadAccounts } = useAuth();
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
    markAsSpam,
    moveMessage,
    sendMail,
    selectFolder,
    resetMailState,
  } = useMail();

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeInitialData, setComposeInitialData] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [selectedEmails, setSelectedEmails] = useState(new Set());
  const recentlyRemovedUids = useRef(new Set());
  const [activeAccount, setActiveAccount] = useState(null);

  const trackRemovedUid = (uid) => {
    if (!uid && uid !== 0) return;
    const key = String(uid);
    recentlyRemovedUids.current.add(key);
    // Clean up after a short window to avoid stale suppression
    setTimeout(() => recentlyRemovedUids.current.delete(key), 10000);
  };

  useEffect(() => {
    if (!checking && !isAuthed) {
      router.replace("/login");
    }
  }, [checking, isAuthed, router]);

  useEffect(() => {
    if (!isAuthed || checking) return;
    const current =
      accounts.find((a) => String(a.id) === String(activeAccountId)) ||
      accounts[0] ||
      null;
    setActiveAccount(current);
  }, [accounts, activeAccountId, isAuthed, checking]);

  // Keep URL in sync with current UI state
  useEffect(() => {
    if (!isAuthed || checking) return;

    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (selectedFolder && params.get("folder") !== selectedFolder) {
      params.set("folder", selectedFolder);
      changed = true;
    }

    const uidString = selectedMessage?.uid ? String(selectedMessage.uid) : null;
    if (uidString) {
      if (params.get("uid") !== uidString) {
        params.set("uid", uidString);
        changed = true;
      }
    } else if (params.has("uid")) {
      params.delete("uid");
      changed = true;
    }

    if (composeOpen) {
      if (params.get("compose") !== "1") {
        params.set("compose", "1");
        changed = true;
      }
    } else if (params.has("compose")) {
      params.delete("compose");
      changed = true;
    }

    const qs = params.toString();
    if (qs === lastSyncedParams.current) return;

    if (changed) {
      lastSyncedParams.current = qs;
      router.replace(qs ? `/webmail?${qs}` : "/webmail", { scroll: false });
    }
  }, [selectedFolder, selectedMessage?.uid, composeOpen, isAuthed, checking, searchParams, router]);

  // Apply URL state to UI (for deep links / back-forward)
  useEffect(() => {
    if (!isAuthed || checking) return;

    if (suppressUrlApplyRef.current) {
      suppressUrlApplyRef.current = false;
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    let sanitized = false;

    // Sanitize compose
    const composeRaw = params.get("compose");
    if (composeRaw && composeRaw !== "1") {
      params.delete("compose");
      sanitized = true;
    }

    // Sanitize uid (must be numeric)
    const uidRaw = params.get("uid");
    if (uidRaw && !/^\d+$/.test(uidRaw)) {
      params.delete("uid");
      sanitized = true;
    }

    // Sanitize folder (must exist once folders are loaded)
    const folderRaw = params.get("folder");
    const hasFolders = Array.isArray(folders) && folders.length > 0;
    if (folderRaw && hasFolders && !folders.some((f) => f?.path === folderRaw)) {
      params.delete("folder");
      params.delete("uid"); // drop uid tied to invalid folder
      sanitized = true;
    }

    if (sanitized) {
      const sanitizedQs = params.toString();
      lastSyncedParams.current = sanitizedQs;
      router.replace(sanitizedQs ? `/webmail?${sanitizedQs}` : "/webmail", { scroll: false });
      return;
    }

    // Track latest params to prevent replace loops
    const currentQs = params.toString();
    if (currentQs !== lastSyncedParams.current) {
      lastSyncedParams.current = currentQs;
    }

    const folderParam = params.get("folder");
    if (folderParam && folderParam !== selectedFolder) {
      if (params.has("uid")) {
        params.delete("uid");
        const sanitizedQs = params.toString();
        if (sanitizedQs !== lastSyncedParams.current) {
          lastSyncedParams.current = sanitizedQs;
          router.replace(sanitizedQs ? `/webmail?${sanitizedQs}` : "/webmail", { scroll: false });
        }
      }
      selectFolder(folderParam);
      return; // wait for folder to update before applying other URL-driven state
    }

    const composeParam = params.get("compose") === "1";
    if (composeParam !== composeOpen) {
      setComposeOpen(composeParam);
      if (!composeParam) {
        setComposeInitialData(null);
      } else {
        setMobileView("detail");
      }
    }

    const uidParam = params.get("uid");
    if (uidParam && (!selectedMessage || String(selectedMessage.uid) !== uidParam)) {
      if (recentlyRemovedUids.current.has(uidParam)) {
        // UID was just removed (delete/spam); clean up URL silently
        const nextParams = new URLSearchParams(params.toString());
        nextParams.delete("uid");
        const sanitizedQs = nextParams.toString();
        lastSyncedParams.current = sanitizedQs;
        router.replace(sanitizedQs ? `/webmail?${sanitizedQs}` : "/webmail", { scroll: false });
        handleRefreshMessages();
        return;
      }

      const found = messages.find((m) => String(m.uid) === uidParam);
      if (found) {
        handleSelectMessage(found, true);
      } else if (selectedFolder) {
        // Fallback: fetch detail for the UID even if not in the current page
        loadMessageDetail({ uid: Number(uidParam), flags: [] }, selectedFolder).catch((err) => {
          if (err.message && err.message.toLowerCase().includes("not found")) {
            if (!recentlyRemovedUids.current.has(uidParam)) {
              showToast("Message not found. It may have been deleted.");
            }
            // Remove stale uid from URL to prevent repeated lookups
            const nextParams = new URLSearchParams(params.toString());
            nextParams.delete("uid");
            const sanitizedQs = nextParams.toString();
            lastSyncedParams.current = sanitizedQs;
            router.replace(sanitizedQs ? `/webmail?${sanitizedQs}` : "/webmail", { scroll: false });
            handleRefreshMessages();
            return;
          }
          handleError(err);
        });
      }
    }
  }, [
    checking,
    isAuthed,
    searchParams,
    folders,
    selectedFolder,
    composeOpen,
    selectedMessage,
    messages,
    selectFolder,
    loadMessageDetail,
  ]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
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
        return msg ? deleteMessage(msg, selectedFolder, activeAccountId) : Promise.resolve(null);
      });
      const results = await Promise.all(deletePromises);

      selectedEmails.forEach((uid) => trackRemovedUid(uid));

      const movedCount = results.filter((r) => r?.movedToTrash).length;
      const deletedCount = results.filter((r) => r?.permanentlyDeleted || r?.deleted).length;

      if (movedCount && deletedCount) {
        showToast(`Moved ${movedCount} to trash, deleted ${deletedCount}`);
      } else if (movedCount) {
        showToast(`Moved ${movedCount} to trash`);
      } else {
        showToast(`Deleted ${deletedCount || selectedEmails.size} message(s)`);
      }
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
        return msg ? markSeen(msg, true, selectedFolder, activeAccountId) : Promise.resolve();
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
        return msg ? markSeen(msg, false, selectedFolder, activeAccountId) : Promise.resolve();
      });
      await Promise.all(markPromises);
      showToast(`Marked ${selectedEmails.size} message(s) as unread`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkRemoveFromSpam = async () => {
    if (selectedEmails.size === 0) return;
    try {
      const movePromises = Array.from(selectedEmails).map(uid => {
        const msg = messages.find(m => m.uid === uid);
        return msg ? markAsSpam(msg, selectedFolder, false, activeAccountId) : Promise.resolve();
      });
      await Promise.all(movePromises);
      selectedEmails.forEach((uid) => trackRemovedUid(uid));
      showToast(`Moved ${selectedEmails.size} message(s) to inbox`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  const handleBulkRestoreFromTrash = async () => {
    if (selectedEmails.size === 0) return;
    try {
      const movePromises = Array.from(selectedEmails).map(uid => {
        const msg = messages.find(m => m.uid === uid);
        return msg ? moveMessage(msg, selectedFolder, "INBOX", activeAccountId) : Promise.resolve();
      });
      await Promise.all(movePromises);
      selectedEmails.forEach((uid) => trackRemovedUid(uid));
      showToast(`Moved ${selectedEmails.size} message(s) to inbox`);
      setSelectedEmails(new Set());
    } catch (err) {
      handleError(err);
    }
  };

  // Load folders only once when authenticated
  useEffect(() => {
    if (isAuthed) {
      loadFolders(activeAccountId).catch(handleError);
    }
  }, [isAuthed, activeAccountId, loadFolders]);

  // Load messages when folder changes
  useEffect(() => {
    if (isAuthed) {
      loadMessages(selectedFolder, null, true, activeAccountId).catch(handleError);
      // Clear selections when changing folders
      setSelectedEmails(new Set());
      setSearchQuery("");
    }
  }, [isAuthed, selectedFolder, activeAccountId, loadMessages]);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out");
      router.replace("/login");
    } catch (err) {
      handleError(err);
    }
  };

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleAddAccount = async () => {
    // Simple flow: send user to login to add another account, then reload accounts on return
    router.push("/login?add=1");
  };

  const handleAccountChange = async (accountId) => {
    changeActiveAccount(accountId);
    suppressUrlApplyRef.current = true;
    resetMailState("INBOX");
    try {
      await loadFolders(accountId);
      await loadMessages("INBOX", null, true, accountId);
      setSelectedEmails(new Set());
      setComposeOpen(false);
      setComposeInitialData(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleSelectFolder = (folder) => {
    // Clear compose/detail state before switching
    setComposeOpen(false);
    setComposeInitialData(null);
    suppressUrlApplyRef.current = true;
    selectFolder(folder);
    // Auto-switch to messages view on mobile
    setMobileView("messages");
    setSelectedEmails(new Set());
  };

  const handleRefreshMessages = () => {
    loadMessages(selectedFolder, null, true, activeAccountId).catch(handleError);
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      loadMessages(selectedFolder, nextCursor, false, activeAccountId).catch(handleError);
    }
  };

  const handleSelectMessage = (message, skipUrlSync = false) => {
    // Close compose if open
    if (composeOpen) {
      setComposeOpen(false);
      setComposeInitialData(null);
    }
    loadMessageDetail(message, selectedFolder, activeAccountId)
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
    if (!skipUrlSync) {
      // URL sync handled by effect; nothing else to do here
    }
  };

  const handleStar = async () => {
    if (!selectedMessage) return;
    try {
      const isFlagged = (selectedMessage.flags || []).includes("\\Flagged");
      await toggleFlag(selectedMessage, "\\Flagged", !isFlagged, selectedFolder, activeAccountId);
      showToast(isFlagged ? "Unstarred" : "Starred");
    } catch (err) {
      handleError(err);
    }
  };

  const handleMarkUnread = async () => {
    if (!selectedMessage) return;
    try {
      await markSeen(selectedMessage, false, selectedFolder, activeAccountId);
      showToast("Marked as unread");
    } catch (err) {
      handleError(err);
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    try {
      const result = await deleteMessage(selectedMessage, selectedFolder, activeAccountId);
      trackRemovedUid(selectedMessage.uid);
      if (result?.movedToTrash) {
        showToast("Moved to trash");
      } else {
        showToast("Message deleted");
      }
    } catch (err) {
      handleError(err);
    }
  };

  const handleMarkAsSpam = async () => {
    if (!selectedMessage) return;
    try {
      await markAsSpam(selectedMessage, selectedFolder, true, activeAccountId);
      trackRemovedUid(selectedMessage.uid);
      showToast("Message marked as spam");
    } catch (err) {
      handleError(err);
    }
  };

  const handleUnmarkSpam = async () => {
    if (!selectedMessage) return;
    try {
      await markAsSpam(selectedMessage, selectedFolder, false, activeAccountId);
      trackRemovedUid(selectedMessage.uid);
      showToast("Message moved to inbox");
    } catch (err) {
      handleError(err);
    }
  };

  const handleRestoreFromTrash = async () => {
    if (!selectedMessage) return;
    try {
      await moveMessage(selectedMessage, selectedFolder, "INBOX", activeAccountId);
      trackRemovedUid(selectedMessage.uid);
      showToast("Message moved to inbox");
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
    setMobileView("detail");
  };

  const handleSendMail = async (mailData) => {
    try {
      await sendMail({ ...mailData, accountId: activeAccountId || null });
      showToast("Message sent");
      setComposeInitialData(null);
      setComposeOpen(false);
      // If on mobile, go back to messages view
      if (window.innerWidth < 1024) {
        setMobileView("messages");
      }
      // Refresh messages after sending
      setTimeout(() => {
        loadMessages(selectedFolder, null, true, activeAccountId).catch(handleError);
      }, 1000);
    } catch (err) {
      throw err;
    }
  };

  if (checking) {
    return <SplashLoader />;
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <TopBar
        onSearch={handleSearch}
        onLogout={handleLogoutClick}
        onAddAccount={handleAddAccount}
        userEmail={userEmail}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onAccountChange={handleAccountChange}
        searchQuery={searchQuery}
        resultCount={filteredMessages.length}
        isSearching={!!searchQuery}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - FolderList handles its own mobile visibility */}
        <div>
          <FolderList
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCompose={() => {
              setComposeInitialData(null);
              setComposeOpen(true);
              setMobileView("detail");
            }}
            loading={loading.folders}
          />
        </div>

        {/* Message List */}
        <div className={`${mobileView === "messages" ? "block" : "hidden"} lg:block h-full flex-1`}>
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
            onBulkRemoveFromSpam={handleBulkRemoveFromSpam}
            onBulkRestoreFromTrash={handleBulkRestoreFromTrash}
            hasMore={!!nextCursor}
            loading={loading.messages}
            error={error}
            searchQuery={searchQuery}
          />
        </div>

        {/* Message Detail or Compose */}
        <div className={`${mobileView === "detail" || composeOpen ? "block" : "hidden"} lg:block flex-1`}>
          <DetailView
            composeOpen={composeOpen}
            composeInitialData={composeInitialData}
            onCloseCompose={() => {
              setComposeOpen(false);
              setComposeInitialData(null);
              // If on mobile and no message selected, go back to messages view
              if (window.innerWidth < 1024 && !selectedMessage) {
                setMobileView("messages");
              }
            }}
            onSendMail={handleSendMail}
            message={selectedMessage}
            messageDetail={messageDetail}
            loading={loading.detail}
            selectedFolder={selectedFolder}
            onCompose={() => {
              setComposeInitialData(null);
              setComposeOpen(true);
              setMobileView("detail");
            }}
            onForward={handleForward}
            onStar={handleStar}
            onMarkUnread={handleMarkUnread}
            onMarkAsSpam={handleMarkAsSpam}
            onUnmarkSpam={handleUnmarkSpam}
            onRestoreFromTrash={handleRestoreFromTrash}
            onDelete={handleDelete}
            defaultFrom={activeAccount?.username || userEmail}
            defaultFromName={(activeAccount?.username || userEmail || "").split("@")[0] || ""}
          />
        </div>

      </div>

      {/* Floating Compose Button - Mobile Only */}
      <button
        onClick={() => {
          setComposeInitialData(null);
          setComposeOpen(true);
          setMobileView("detail");
        }}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all z-30 flex items-center justify-center cursor-pointer"
        aria-label="Compose new message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </button>



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


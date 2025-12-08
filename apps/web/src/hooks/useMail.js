import { useState, useCallback } from "react";
import { apiFetch } from "../lib/api";

export function useMail() {
  const [folders, setFolders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetail, setMessageDetail] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState({
    folders: false,
    messages: false,
    detail: false,
  });

  const loadFolders = useCallback(async () => {
    setLoading((prev) => ({ ...prev, folders: true }));
    try {
      const data = await apiFetch("/mail/folders");
      setFolders(data.folders || []);
    } finally {
      setLoading((prev) => ({ ...prev, folders: false }));
    }
  }, []);

  const loadMessages = useCallback(async (folder, cursor = null, replace = false) => {
    setLoading((prev) => ({ ...prev, messages: true }));
    try {
      const qs = new URLSearchParams({
        folder,
        ...(cursor ? { cursor } : {}),
      }).toString();
      const data = await apiFetch(`/mail/messages?${qs}`);
      setMessages((prev) => (replace ? data.messages : [...prev, ...data.messages]));
      setNextCursor(data.nextCursor);
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }));
    }
  }, []);

  const loadMessageDetail = useCallback(async (message, folder) => {
    setSelectedMessage(message);
    setLoading((prev) => ({ ...prev, detail: true }));
    try {
      const qs = new URLSearchParams({ folder }).toString();
      const data = await apiFetch(`/mail/messages/${message.uid}?${qs}`);
      setMessageDetail(data);
      
      // Mark as seen if not already
      if (!message.flags?.includes("\\Seen")) {
        await markSeen(message, true, folder);
      }
    } catch (err) {
      // If message not found, remove it from the list
      if (err.message && err.message.includes("not found")) {
        setMessages((prev) => prev.filter((m) => m.uid !== message.uid));
        setSelectedMessage(null);
        setMessageDetail(null);
      }
      throw err;
    } finally {
      setLoading((prev) => ({ ...prev, detail: false }));
    }
  }, []);

  const markSeen = useCallback(async (message, seen, folder) => {
    await apiFetch("/mail/flags", {
      method: "POST",
      body: JSON.stringify({
        uid: message.uid,
        folder,
        flags: ["\\Seen"],
        mode: seen ? "add" : "remove",
      }),
    });
    
    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.uid === message.uid
          ? {
              ...m,
              flags: seen
                ? [...new Set([...(m.flags || []), "\\Seen"])]
                : (m.flags || []).filter((f) => f !== "\\Seen"),
            }
          : m
      )
    );
    
    if (selectedMessage?.uid === message.uid) {
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              flags: seen
                ? [...new Set([...(prev.flags || []), "\\Seen"])]
                : (prev.flags || []).filter((f) => f !== "\\Seen"),
            }
          : prev
      );
    }
  }, [selectedMessage]);

  const toggleFlag = useCallback(async (message, flag, enable, folder) => {
    await apiFetch("/mail/flags", {
      method: "POST",
      body: JSON.stringify({
        uid: message.uid,
        folder,
        flags: [flag],
        mode: enable ? "add" : "remove",
      }),
    });
    
    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.uid === message.uid
          ? {
              ...m,
              flags: enable
                ? [...new Set([...(m.flags || []), flag])]
                : (m.flags || []).filter((f) => f !== flag),
            }
          : m
      )
    );
    
    if (selectedMessage?.uid === message.uid) {
      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              flags: enable
                ? [...new Set([...(prev.flags || []), flag])]
                : (prev.flags || []).filter((f) => f !== flag),
            }
          : prev
      );
    }
  }, [selectedMessage]);

  const deleteMessage = useCallback(async (message, folder) => {
    await apiFetch("/mail/delete", {
      method: "POST",
      body: JSON.stringify({ uid: message.uid, folder }),
    });
    
    setMessages((prev) => prev.filter((m) => m.uid !== message.uid));
    
    if (selectedMessage?.uid === message.uid) {
      setSelectedMessage(null);
      setMessageDetail(null);
    }
  }, [selectedMessage]);

  const sendMail = useCallback(async (mailData) => {
    await apiFetch("/mail/send", {
      method: "POST",
      body: JSON.stringify(mailData),
    });
  }, []);

  const selectFolder = useCallback((folder) => {
    setSelectedFolder(folder);
    setMessages([]);
    setSelectedMessage(null);
    setMessageDetail(null);
  }, []);

  return {
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
  };
}


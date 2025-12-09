const { ImapFlow } = require("imapflow");
const { decrypt } = require("../crypto");

const connections = new Map();
const IDLE_TIMEOUT = 5 * 60 * 1000;

function credsFromAccount(account) {
  console.log("credsFromAccount - account ID:", account?.id, "enc_creds length:", account?.enc_creds?.length);
  const plain = JSON.parse(decrypt(account.enc_creds));
  console.log("credsFromAccount - decrypted successfully");
  return plain;
}

async function getClient(account) {
  if (connections.has(account.id)) {
    const record = connections.get(account.id);
    record.lastUsed = Date.now();
    return record.client;
  }

  const creds = credsFromAccount(account);
  const client = new ImapFlow({
    host: creds.imap_host,
    port: creds.imap_port,
    secure: !!creds.imap_secure,
    auth: {
      user: creds.username,
      pass: creds.password,
    },
    logger: false,
    socketTimeout: 30000, // 30 second timeout
    greetingTimeout: 15000, // 15 second greeting timeout
  });

  await client.connect();
  connections.set(account.id, { client, lastUsed: Date.now() });

  client.on("close", () => {
    console.log("IMAP connection closed for account:", account.id);
    connections.delete(account.id);
  });

  client.on("error", (err) => {
    console.error("IMAP connection error for account:", account.id, err.message);
    connections.delete(account.id);
  });

  return client;
}

async function closeConnection(accountId) {
  if (connections.has(accountId)) {
    const record = connections.get(accountId);
    try {
      await record.client.logout();
    } catch (err) {
      console.error("Error closing IMAP connection:", err.message);
    }
    connections.delete(accountId);
  }
}

function scheduleCleanup() {
  const now = Date.now();
  for (const [key, { client, lastUsed }] of connections.entries()) {
    if (now - lastUsed > IDLE_TIMEOUT) {
      console.log("Cleaning up idle IMAP connection for account:", key);
      client.logout().catch((err) => {
        console.error("Error during connection cleanup:", err.message);
      });
      connections.delete(key);
    }
  }
  setTimeout(scheduleCleanup, IDLE_TIMEOUT).unref();
}

scheduleCleanup();

async function openMailbox(client, mailbox) {
  const target = mailbox || "INBOX";
  await client.mailboxOpen(target);
}

async function listFolders(account) {
  const client = await getClient(account);
  const list = await client.list();
  const folders = list.map(box => ({
    path: box.path,
    name: box.name,
    flags: box.flags,
    delimiter: box.delimiter,
  }));
  return folders;
}

async function findSentFolder(client) {
  const list = await client.list();
  const candidates = list.map((box) => ({
    path: box.path,
    name: box.name?.toLowerCase() || "",
    flags: Array.from(box.flags || []),
  }));

  const flagMatch = candidates.find((box) =>
    box.flags.some((f) => String(f).toLowerCase() === "\\sent")
  );
  if (flagMatch) return flagMatch.path;

  const nameMatch = candidates.find((box) => ["sent", "sent items", "sent mail"].includes(box.name));
  if (nameMatch) return nameMatch.path;

  const gmailMatch = candidates.find((box) => box.path?.toLowerCase().includes("sent"));
  if (gmailMatch) return gmailMatch.path;

  return "Sent";
}

async function listMessages(account, mailbox, cursorUid, limit = 20) {
  const client = await getClient(account);
  await openMailbox(client, mailbox);

  // Get all UIDs using SEARCH (this returns only existing UIDs)
  const allUids = await client.search({ all: true }, { uid: true });
  
  if (!allUids || allUids.length === 0) {
    return { messages: [], nextCursor: null };
  }

  // Sort UIDs descending (newest first)
  const sortedUids = allUids.sort((a, b) => b - a);
  
  // Apply pagination
  let uidsToFetch;
  let nextCursor = null;
  
  if (cursorUid) {
    // Find index of cursor UID
    const cursorIndex = sortedUids.indexOf(cursorUid);
    if (cursorIndex >= 0) {
      uidsToFetch = sortedUids.slice(cursorIndex + 1, cursorIndex + 1 + limit);
      if (cursorIndex + 1 + limit < sortedUids.length) {
        nextCursor = sortedUids[cursorIndex + limit];
      }
    } else {
      // Cursor not found, start from beginning
      uidsToFetch = sortedUids.slice(0, limit);
      if (sortedUids.length > limit) {
        nextCursor = sortedUids[limit - 1];
      }
    }
  } else {
    // First page
    uidsToFetch = sortedUids.slice(0, limit);
    if (sortedUids.length > limit) {
      nextCursor = sortedUids[limit - 1];
    }
  }

  if (uidsToFetch.length === 0) {
    return { messages: [], nextCursor: null };
  }

  // Fetch messages for these UIDs
  const messages = [];
  // Use comma-separated UIDs to fetch exactly these messages, avoiding any range ambiguity
  const uidSet = uidsToFetch.join(",");
  
  console.log(`listMessages - fetching UIDs: ${uidSet}`);

  for await (const msg of client.fetch({ uid: uidSet }, { envelope: true, flags: true, internalDate: true, size: true, bodyStructure: true })) {
    const { envelope } = msg;
    const attachments = Boolean(
      msg.bodyStructure?.childNodes?.some((node) => node.disposition?.type?.toLowerCase() === "attachment")
    );
    
    // Ensure we have a valid UID
    if (!msg.uid) {
      console.warn("listMessages - message missing UID:", envelope?.subject);
      continue;
    }

    messages.push({
      uid: msg.uid,
      subject: envelope?.subject || "(no subject)",
      from: envelope?.from || [],
      to: envelope?.to || [],
      date: envelope?.date || msg.internalDate,
      flags: Array.from(msg.flags || []),
      size: msg.size || 0,
      hasAttachments: attachments,
    });
  }

  // Sort by UID descending (newest first) to match the requested order
  messages.sort((a, b) => b.uid - a.uid);
  
  console.log(`listMessages - returning ${messages.length} messages`);
  return { messages, nextCursor };
}

function collectAttachments(structure, out = [], parentIsMultipart = false) {
  if (!structure) return out;
  
  const isMultipart = structure.type?.toLowerCase() === "multipart";
  const isText = structure.type?.toLowerCase() === "text";
  const disposition = structure.disposition?.type?.toLowerCase();
  const hasFilename = structure.disposition?.params?.filename || structure.parameters?.name;
  
  // Skip multipart containers themselves, but process their children
  if (isMultipart) {
    if (structure.childNodes) {
      structure.childNodes.forEach((child) => collectAttachments(child, out, true));
    }
    return out;
  }
  
  // Determine if this is an attachment
  // It's an attachment if:
  // 1. It has explicit "attachment" disposition, OR
  // 2. It has "inline" disposition AND is not text/html or text/plain (likely embedded image), OR
  // 3. It has a filename AND is not the main message body text
  const isAttachment = 
    disposition === "attachment" ||
    (disposition === "inline" && !isText) ||
    (hasFilename && isText && (structure.subtype?.toLowerCase() !== "plain" && structure.subtype?.toLowerCase() !== "html")) ||
    (hasFilename && !isText);
  
  // Exclude main message body parts (text/plain and text/html without disposition)
  const isMainBody = isText && 
                     (structure.subtype?.toLowerCase() === "plain" || structure.subtype?.toLowerCase() === "html") &&
                     !disposition &&
                     !hasFilename;
  
  if (isAttachment && !isMainBody) {
    const filename = structure.disposition?.params?.filename || 
                     structure.parameters?.name ||
                     (structure.id ? structure.id.replace(/[<>]/g, "") : null) ||
                     `attachment-${structure.part || "unknown"}`;
    
    out.push({
      part: structure.part,
      filename: filename,
      mimeType: (structure.type || "application") + "/" + (structure.subtype || "octet-stream"),
      size: structure.size || 0,
      cid: structure.id || null,
    });
  }
  
  // Process child nodes if any
  if (structure.childNodes) {
    structure.childNodes.forEach((child) => collectAttachments(child, out, isMultipart));
  }
  
  return out;
}

async function getMessage(account, mailbox, uid) {
  const client = await getClient(account);
  await openMailbox(client, mailbox);
  
  try {
    const msg = await client.fetchOne(
      uid,
      {
        source: true,
        envelope: true,
        flags: true,
        internalDate: true,
        size: true,
        bodyStructure: true,
      },
      { uid: true }
    );
    
    if (!msg) return null;
    
    const attachments = collectAttachments(msg.bodyStructure);
    return {
      uid: msg.uid,
      envelope: msg.envelope,
      flags: Array.from(msg.flags || []),
      date: msg.internalDate,
      size: msg.size || 0,
      source: msg.source,
      attachments,
    };
  } catch (err) {
    // Handle "Invalid messageset" error - message doesn't exist
    const errMsg = err.message || "";
    const errText = err.responseText || "";
    
    if (errMsg.includes("Invalid messageset") || errText.includes("Invalid messageset")) {
      console.log(`getMessage - UID ${uid} not found in ${mailbox}`);
      return null;
    }
    
    // Re-throw other errors
    throw err;
  }
}

async function downloadAttachment(account, mailbox, uid, part) {
  const client = await getClient(account);
  await openMailbox(client, mailbox);
  
  try {
    return await client.download(uid, part, { uid: true });
  } catch (err) {
    // Handle "Invalid messageset" error
    const errMsg = err.message || "";
    const errText = err.responseText || "";
    
    if (errMsg.includes("Invalid messageset") || errText.includes("Invalid messageset")) {
      console.log(`downloadAttachment - UID ${uid} not found in ${mailbox}`);
      return null;
    }
    throw err;
  }
}

async function setFlags(account, mailbox, uid, flags = [], mode = "add") {
  const client = await getClient(account);
  await openMailbox(client, mailbox);
  
  try {
    if (mode === "add") {
      await client.messageFlagsAdd(uid, flags, { uid: true });
    } else if (mode === "remove") {
      await client.messageFlagsRemove(uid, flags, { uid: true });
    }
  } catch (err) {
    const errMsg = err.message || "";
    const errText = err.responseText || "";
    
    if (errMsg.includes("Invalid messageset") || errText.includes("Invalid messageset")) {
      console.log(`setFlags - UID ${uid} not found in ${mailbox}`);
      return;
    }
    throw err;
  }
}

async function deleteMessage(account, mailbox, uid) {
  const client = await getClient(account);
  await openMailbox(client, mailbox);
  
  try {
    await client.messageDelete(uid, { uid: true });
  } catch (err) {
    const errMsg = err.message || "";
    const errText = err.responseText || "";
    
    if (errMsg.includes("Invalid messageset") || errText.includes("Invalid messageset")) {
      console.log(`deleteMessage - UID ${uid} not found in ${mailbox} (already deleted)`);
      return;
    }
    throw err;
  }
}

async function moveMessage(account, sourceMailbox, targetMailbox, uid) {
  const client = await getClient(account);
  await openMailbox(client, sourceMailbox);
  
  try {
    await client.messageMove(uid, targetMailbox, { uid: true });
  } catch (err) {
    const errMsg = err.message || "";
    const errText = err.responseText || "";
    
    if (errMsg.includes("Invalid messageset") || errText.includes("Invalid messageset")) {
      console.log(`moveMessage - UID ${uid} not found in ${sourceMailbox}`);
      return;
    }
    throw err;
  }
}

async function appendToSent(account, rawMessage) {
  if (!rawMessage) {
    console.warn("appendToSent - no raw message provided, skipping");
    return;
  }

  const client = await getClient(account);
  const primarySent = await findSentFolder(client);

  // Try several common Sent paths to maximize compatibility
  const candidates = [
    primarySent,
    "Sent",
    "Sent Items",
    "Sent Mail",
    "INBOX.Sent",
    "INBOX/Sent",
  ].filter(Boolean);

  let lastErr = null;

  for (const folder of candidates) {
    try {
      const folders = await client.list();
      const hasFolder = folders.some((f) => f.path.toLowerCase() === folder.toLowerCase());
      if (!hasFolder) {
        console.warn("appendToSent - folder missing, skipping creation per policy:", folder);
        continue; // do not create new folders
      }

      await openMailbox(client, folder);
      try {
        await client.append(folder, rawMessage, { flags: ["\\Seen"] });
        console.log("appendToSent - appended to", folder, "with \\Seen");
        return; // success
      } catch (appendErr) {
        const msg = appendErr.message || "";
        const resp = appendErr.responseText || "";
        console.warn("appendToSent - append with \\Seen failed:", msg, "resp:", resp, "folder:", folder);

        // Retry without flags if server rejects the flags format
        try {
          await client.append(folder, rawMessage);
          console.log("appendToSent - appended to", folder, "without flags");
          return;
        } catch (retryErr) {
          console.error("appendToSent - retry without flags failed:", retryErr.message, "resp:", retryErr.responseText, "folder:", folder);
          lastErr = retryErr;
          continue; // try next folder
        }
      }
    } catch (err) {
      console.error("appendToSent - failed:", err.message, "folder:", folder, "command:", err.command, "resp:", err.responseText);
      lastErr = err;
      continue;
    }
  }

  if (lastErr) {
    throw lastErr;
  }
}

async function verifyImap(creds) {
  console.log("verifyImap - creating client with:", { host: creds.imap_host, port: creds.imap_port, secure: creds.imap_secure, user: creds.username });
  const client = new ImapFlow({
    host: creds.imap_host,
    port: creds.imap_port,
    secure: !!creds.imap_secure,
    auth: {
      user: creds.username,
      pass: creds.password,
    },
    logger: false,
  });
  console.log("verifyImap - connecting...");
  await client.connect();
  console.log("verifyImap - connected, opening INBOX...");
  await client.mailboxOpen("INBOX");
  console.log("verifyImap - INBOX opened, logging out...");
  await client.logout();
  console.log("verifyImap - complete");
}

module.exports = {
  listFolders,
  listMessages,
  getMessage,
  downloadAttachment,
  setFlags,
  deleteMessage,
  moveMessage,
  verifyImap,
  credsFromAccount,
  closeConnection,
  appendToSent,
};


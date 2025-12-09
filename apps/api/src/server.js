const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");

const config = require("./config");
const { insertAccount } = require("./db");
const { encrypt } = require("./crypto");
const { signSession, verifySession, setSessionCookie, clearSessionCookie, authMiddleware } = require("./auth");
const {
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
} = require("./services/imap");
const { verifySmtp, sendMail } = require("./services/smtp");
const { parseMessage } = require("./utils/messageParser");

const app = express();

// Utility helpers
const isTrashLike = (value = "") => {
  const v = value.toLowerCase();
  return (
    v.includes("trash") ||
    v.includes("bin") ||
    v.includes("deleted items") ||
    v.includes("deleted messages")
  );
};

const findTrashFolderPath = (folders = []) => {
  const normalized = Array.isArray(folders)
    ? folders.map((f) => {
        const flagsArray = Array.isArray(f?.flags)
          ? f.flags
          : f?.flags && typeof f.flags[Symbol.iterator] === "function"
          ? Array.from(f.flags)
          : [];
        return {
          ...f,
          lowerName: (f?.name || "").toLowerCase(),
          lowerPath: (f?.path || "").toLowerCase(),
          flagSet: new Set(flagsArray.map((flag) => String(flag).toLowerCase())),
        };
      })
    : [];

  // Prefer explicit IMAP \Trash flag
  const flagMatch = normalized.find((f) => f.flagSet.has("\\trash"));
  if (flagMatch) return flagMatch.path;

  // Then well-known names
  const nameMatch = normalized.find((f) =>
    ["trash", "deleted items", "deleted messages", "bin"].includes(f.lowerName)
  );
  if (nameMatch) return nameMatch.path;

  // Finally, look for trash-like paths
  const pathMatch = normalized.find((f) => isTrashLike(f.lowerPath));
  if (pathMatch) return pathMatch.path;

  return null;
};

app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(helmet());
// Increase JSON limit to allow small attachments (base64-encoded)
app.use(express.json({ limit: "25mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.post(
  "/auth/login",
  authLimiter,
  async (req, res) => {
    try {
      console.log("Login attempt:", { username: req.body?.username, host: req.body?.imapHost });
      
      const schema = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
        imapHost: z.string().optional(),
        imapPort: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(config.defaultImapPort),
        imapSecure: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true").default(config.defaultImapSecure),
        smtpHost: z.string().optional(),
        smtpPort: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(config.defaultSmtpPort),
        smtpSecure: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true").default(config.defaultSmtpSecure),
      });

      const parseResult = schema.safeParse(req.body);
      if (!parseResult.success) {
        console.log("Schema validation failed:", parseResult.error.issues);
        return res.status(400).json({ error: "invalid input", details: parseResult.error.issues });
      }
      const payload = parseResult.data;
      console.log("Parsed payload:", { ...payload, password: "***" });

    const creds = {
      username: payload.username,
      password: payload.password,
      imap_host: payload.imapHost || config.defaultImapHost,
      imap_port: payload.imapPort ?? config.defaultImapPort,
      imap_secure: payload.imapSecure ?? config.defaultImapSecure,
      smtp_host: payload.smtpHost || config.defaultSmtpHost,
      smtp_port: payload.smtpPort ?? config.defaultSmtpPort,
      smtp_secure: payload.smtpSecure ?? config.defaultSmtpSecure,
    };
    console.log("Built creds:", { ...creds, password: "***" });

    console.log("Starting IMAP verification...");
    try {
      await verifyImap(creds);
      console.log("IMAP verification passed");
    } catch (err) {
      console.error("IMAP verification failed:", err);
      return res.status(401).json({ error: "authentication failed", detail: err.message });
    }

    console.log("Starting SMTP verification...");
    try {
      await verifySmtp(creds);
      console.log("SMTP verification passed");
    } catch (err) {
      console.error("SMTP verification failed:", err);
      return res.status(401).json({ error: "authentication failed", detail: err.message });
    }

    console.log("Encrypting credentials...");
    const enc = encrypt(JSON.stringify(creds));
    console.log("Encrypted creds length:", enc.length);
    
    let accountId;
    console.log("Inserting account to DB...");
    try {
      accountId = await insertAccount({
        username: creds.username,
        imap_host: creds.imap_host,
        imap_port: creds.imap_port,
        imap_secure: creds.imap_secure ? 1 : 0,
        smtp_host: creds.smtp_host,
        smtp_port: creds.smtp_port,
        smtp_secure: creds.smtp_secure ? 1 : 0,
        enc_creds: enc,
      });
      console.log("Account inserted, ID:", accountId);
    } catch (err) {
      console.error("Failed to persist account/session:", err);
      return res.status(500).json({ error: "failed to create session", detail: err.message });
    }

    if (!accountId) {
      console.error("Account ID is falsy:", accountId);
      return res.status(500).json({ error: "failed to create session" });
    }

    console.log("Signing session token...");
    const token = signSession(accountId);
    console.log("Setting cookie...");
    setSessionCookie(res, token);
    console.log("Login successful for account:", accountId);
    res.json({ ok: true, accountId });
    } catch (err) {
      console.error("Unexpected login error:", err);
      return res.status(500).json({ error: "internal error", detail: err.message });
    }
  }
);

app.post("/auth/logout", async (req, res) => {
  try {
    // Try to get account from session if it exists
    const token = req.cookies?.sid;
    if (token) {
      const { verifySession } = require("./auth");
      try {
        const account = await verifySession(token);
        if (account?.id) {
          console.log("Closing IMAP connection for account:", account.id);
          await closeConnection(account.id);
        }
      } catch (err) {
        // Session may be invalid, that's ok during logout
        console.log("No valid session to cleanup during logout");
      }
    }
  } catch (err) {
    console.error("Error during logout cleanup:", err);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/mail/folders", authMiddleware, async (req, res) => {
  try {
    console.log("/mail/folders - account:", req.account?.id);
    const folders = await listFolders(req.account);
    console.log("/mail/folders - success, found", folders.length, "folders");
    res.json({ folders });
  } catch (err) {
    console.error("/mail/folders - error:", err);
    res.status(500).json({ error: "failed to list folders", detail: err.message });
  }
});

app.get("/mail/messages", authMiddleware, async (req, res) => {
  const folder = req.query.folder || "INBOX";
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;
  const limit = req.query.limit ? Math.min(Number(req.query.limit), 50) : 20;
  console.log("/mail/messages - folder:", folder, "cursor:", cursor, "limit:", limit);
  try {
    const { messages, nextCursor } = await listMessages(req.account, folder, cursor, limit);
    console.log("/mail/messages - success, found", messages.length, "messages");
    res.json({ messages, nextCursor });
  } catch (err) {
    console.error("/mail/messages - error:", err);
    res.status(500).json({ error: "failed to list messages", detail: err.message });
  }
});

app.get("/mail/messages/:uid", authMiddleware, async (req, res) => {
  const folder = req.query.folder || "INBOX";
  const uid = Number(req.params.uid);
  if (!uid) return res.status(400).json({ error: "invalid uid" });

  try {
    console.log(`/mail/messages/${uid} - fetching from folder:`, folder);
    const msg = await getMessage(req.account, folder, uid);
    if (!msg) {
      console.log(`/mail/messages/${uid} - message not found`);
      return res.status(404).json({ error: "not found" });
    }
    console.log(`/mail/messages/${uid} - parsing message...`);
    const parsed = await parseMessage(msg.source);
    
    // Merge attachments from bodyStructure (has part) with parsed attachments (more comprehensive)
    // Create a map of attachments by filename/contentType for matching
    const attachmentMap = new Map();
    
    // First, add all bodyStructure attachments (they have the part field we need)
    msg.attachments.forEach(att => {
      const key = `${att.filename || ""}_${att.mimeType || ""}`;
      attachmentMap.set(key, att);
    });
    
    // Then, try to match parsed attachments and add missing ones
    // For parsed attachments without a matching bodyStructure attachment,
    // we'll try to find the part by matching filename/contentType
    if (parsed.attachments && parsed.attachments.length > 0) {
      parsed.attachments.forEach(parsedAtt => {
        const key = `${parsedAtt.filename || ""}_${parsedAtt.contentType || ""}`;
        if (!attachmentMap.has(key)) {
          // Try to find matching part in bodyStructure
          const matchingBodyAtt = msg.attachments.find(ba => 
            (ba.filename === parsedAtt.filename || 
             (ba.filename && parsedAtt.filename && ba.filename.toLowerCase() === parsedAtt.filename.toLowerCase())) &&
            (ba.mimeType === parsedAtt.contentType ||
             (ba.mimeType && parsedAtt.contentType && ba.mimeType.toLowerCase() === parsedAtt.contentType.toLowerCase()))
          );
          
          if (matchingBodyAtt && matchingBodyAtt.part) {
            // Use the bodyStructure attachment which has the part
            attachmentMap.set(key, matchingBodyAtt);
          } else {
            // If no match found, we can't download it (no part), but we can still show it
            // For now, we'll skip it since we need the part to download
            console.log(`Attachment ${parsedAtt.filename} found in parsed message but no matching part in bodyStructure`);
          }
        }
      });
    }
    
    // Convert map back to array
    const mergedAttachments = Array.from(attachmentMap.values());
    
    console.log(`/mail/messages/${uid} - success`);
    res.json({
      uid: msg.uid,
      envelope: msg.envelope,
      flags: msg.flags,
      date: msg.date,
      size: msg.size,
      message: parsed,
      attachments: mergedAttachments,
    });
  } catch (err) {
    console.error(`/mail/messages/${uid} - error:`, err);
    res.status(500).json({ error: "failed to fetch message", detail: err.message });
  }
});

app.get("/mail/attachments/:uid/:part", authMiddleware, async (req, res) => {
  const folder = req.query.folder || "INBOX";
  const uid = Number(req.params.uid);
  const { part } = req.params;
  if (!uid || !part) return res.status(400).json({ error: "invalid attachment request" });

  try {
    // First, get the message to find the attachment metadata (for filename)
    const msg = await getMessage(req.account, folder, uid);
    if (!msg) {
      return res.status(404).json({ error: "message not found" });
    }
    
    // Find the attachment by part to get its filename
    const attachment = msg.attachments.find(att => att.part === part);
    const attachmentFilename = attachment?.filename;
    
    // Download the attachment content
    const download = await downloadAttachment(req.account, folder, uid, part);
    if (!download) {
      return res.status(404).json({ error: "attachment not found" });
    }
    
    // Get filename from attachment metadata first, then fall back to disposition
    const filename = attachmentFilename || 
                     download.disposition?.parameters?.filename || 
                     `attachment-${part}`;
    
    // Ensure filename has proper encoding for Content-Disposition header
    // Escape quotes and use RFC 5987 encoding for non-ASCII characters
    const safeFilename = filename.replace(/"/g, '\\"');
    const encodedFilename = encodeURIComponent(filename);
    const contentDisposition = `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
    
    res.setHeader("Content-Type", download.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", contentDisposition);
    download.content.pipe(res);
  } catch (err) {
    console.error(`/mail/attachments/${uid}/${part} - error:`, err);
    res.status(500).json({ error: "failed to download attachment", detail: err.message });
  }
});

app.post("/mail/send", authMiddleware, sendLimiter, async (req, res) => {
  const attachmentSchema = z.object({
    filename: z.string().min(1),
    content: z.string().min(1),
    contentType: z.string().optional(),
    encoding: z.enum(["base64", "utf8"]).optional(),
    size: z.number().nonnegative().optional(),
  });

  const schema = z.object({
    from: z.string().optional(),
    fromName: z.string().optional(),
    to: z.string(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
    attachments: z.array(attachmentSchema).optional().default([]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.log("/mail/send - validation failed:", parsed.error.issues);
    return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  }

  const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // ~25MB total
  const totalSizeBytes = parsed.data.attachments.reduce((sum, att) => {
    if (typeof att.size === "number") return sum + att.size;
    // Estimate base64 payload size if size not provided
    return sum + Math.ceil((att.content.length * 3) / 4);
  }, 0);

  if (totalSizeBytes > MAX_ATTACHMENT_BYTES) {
    return res.status(413).json({ error: "attachments too large", detail: "Total attachment size exceeds 25MB" });
  }

  const mailPayload = {
    ...parsed.data,
    attachments: parsed.data.attachments.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
      encoding: att.encoding || "base64",
    })),
  };

  try {
    console.log("/mail/send - sending", {
      to: mailPayload.to,
      subject: mailPayload.subject,
      attachments: mailPayload.attachments?.length || 0,
    });
    const creds = credsFromAccount(req.account);
    const { raw } = await sendMail(creds, mailPayload);
    console.log("/mail/send - sent via SMTP, appending to Sent...");
    try {
      await appendToSent(req.account, raw);
      console.log("/mail/send - appended to Sent");
    } catch (appendErr) {
      console.error("/mail/send - append to Sent failed:", appendErr.message);
      // Do not fail the API if append fails; some providers auto-save sent items
    }
  } catch (err) {
    console.error("/mail/send - error:", err);
    return res.status(500).json({ error: "failed to send mail", detail: err.message });
  }
  res.json({ ok: true });
});

app.post("/mail/flags", authMiddleware, async (req, res) => {
  const schema = z.object({
    uid: z.number().int(),
    folder: z.string().default("INBOX"),
    flags: z.array(z.string()).default(["\\Seen"]),
    mode: z.enum(["add", "remove"]).default("add"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  const { uid, folder, flags, mode } = parsed.data;
  try {
    await setFlags(req.account, folder, uid, flags, mode);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "failed to set flags", detail: err.message });
  }
});

app.post("/mail/delete", authMiddleware, async (req, res) => {
  const schema = z.object({
    uid: z.number().int(),
    folder: z.string().default("INBOX"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  const { uid, folder } = parsed.data;
  try {
    // Find trash folder and decide whether to move or permanently delete
    const folders = await listFolders(req.account);
    const trashPath = findTrashFolderPath(folders);
    const inTrashAlready =
      isTrashLike(folder) ||
      (trashPath && folder.toLowerCase() === trashPath.toLowerCase());

    // Prefer moving to trash; if that fails, fall back to hard delete
    if (trashPath && !inTrashAlready) {
      try {
        await moveMessage(req.account, folder, trashPath, uid);
        return res.json({ ok: true, movedToTrash: true, trashFolder: trashPath });
      } catch (moveErr) {
        console.error("/mail/delete - move to trash failed, falling back to delete:", moveErr?.message, moveErr);
      }
    }

    await deleteMessage(req.account, folder, uid);
    res.json({ ok: true, deleted: true, permanentlyDeleted: true, fallbackToDelete: !!trashPath && !inTrashAlready });
  } catch (err) {
    console.error("/mail/delete - error:", err?.message, err);
    res.status(500).json({ error: "failed to delete message", detail: err.message });
  }
});

app.post("/mail/move", authMiddleware, async (req, res) => {
  const schema = z.object({
    uid: z.number().int(),
    sourceFolder: z.string(),
    targetFolder: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  const { uid, sourceFolder, targetFolder } = parsed.data;
  try {
    await moveMessage(req.account, sourceFolder, targetFolder, uid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "failed to move message", detail: err.message });
  }
});

app.post("/mail/spam", authMiddleware, async (req, res) => {
  const schema = z.object({
    uid: z.number().int(),
    folder: z.string(),
    markAsSpam: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  const { uid, folder, markAsSpam } = parsed.data;
  
  try {
    // Get all folders to find spam folder
    const folders = await listFolders(req.account);
    const spamFolder = folders.find(f => 
      f.name.toLowerCase() === "spam" || 
      f.name.toLowerCase() === "junk" ||
      f.path.toLowerCase().includes("spam") ||
      f.path.toLowerCase().includes("junk")
    );
    
    if (!spamFolder) {
      return res.status(404).json({ error: "spam folder not found" });
    }
    
    if (markAsSpam) {
      // Move to spam folder
      await moveMessage(req.account, folder, spamFolder.path, uid);
    } else {
      // Move from spam back to INBOX
      await moveMessage(req.account, folder, "INBOX", uid);
    }
    
    res.json({ ok: true, spamFolder: spamFolder.path });
  } catch (err) {
    res.status(500).json({ error: "failed to mark as spam", detail: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});


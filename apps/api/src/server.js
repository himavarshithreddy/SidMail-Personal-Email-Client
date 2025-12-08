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
  verifyImap,
  credsFromAccount,
  closeConnection,
} = require("./services/imap");
const { verifySmtp, sendMail } = require("./services/smtp");
const { parseMessage } = require("./utils/messageParser");

const app = express();

app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
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
    console.log(`/mail/messages/${uid} - success`);
    res.json({
      uid: msg.uid,
      envelope: msg.envelope,
      flags: msg.flags,
      date: msg.date,
      size: msg.size,
      message: parsed,
      attachments: msg.attachments,
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
    const download = await downloadAttachment(req.account, folder, uid, part);
    if (!download) {
      return res.status(404).json({ error: "attachment not found" });
    }
    res.setHeader("Content-Type", download.contentType || "application/octet-stream");
    if (download.disposition?.parameters?.filename) {
      res.setHeader("Content-Disposition", `attachment; filename="${download.disposition.parameters.filename}"`);
    }
    download.content.pipe(res);
  } catch (err) {
    console.error(`/mail/attachments/${uid}/${part} - error:`, err);
    res.status(500).json({ error: "failed to download attachment", detail: err.message });
  }
});

app.post("/mail/send", authMiddleware, sendLimiter, async (req, res) => {
  console.log("/mail/send - request body:", req.body);
  const schema = z.object({
    to: z.string(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    subject: z.string().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    console.log("/mail/send - validation failed:", parsed.error.issues);
    return res.status(400).json({ error: "invalid input", details: parsed.error.issues });
  }

  try {
    console.log("/mail/send - getting creds from account:", req.account?.id);
    const creds = credsFromAccount(req.account);
    console.log("/mail/send - creds obtained, sending mail...");
    await sendMail(creds, parsed.data);
    console.log("/mail/send - success");
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
    await deleteMessage(req.account, folder, uid);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "failed to delete message", detail: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal error" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});


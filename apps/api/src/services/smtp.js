const nodemailer = require("nodemailer");
const MailComposer = require("nodemailer/lib/mail-composer");

async function verifySmtp(creds) {
  console.log("verifySmtp - creating transport with:", { host: creds.smtp_host, port: creds.smtp_port, secure: creds.smtp_secure, starttls: creds.smtp_starttls, user: creds.username });
  const transport = nodemailer.createTransport({
    host: creds.smtp_host,
    port: creds.smtp_port,
    secure: !!creds.smtp_secure,
    ...(creds.smtp_starttls && !creds.smtp_secure ? { requireTLS: true } : {}),
    auth: {
      user: creds.username,
      pass: creds.password,
    },
  });
  console.log("verifySmtp - verifying...");
  await transport.verify();
  console.log("verifySmtp - complete");
}

async function buildRawMessage(payload, fromAddress) {
  const composer = new MailComposer({
    from: fromAddress,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    attachments: payload.attachments,
  });

  return new Promise((resolve, reject) => {
    composer.compile().build((err, message) => {
      if (err) return reject(err);
      resolve(message);
    });
  });
}

async function sendMail(creds, payload) {
  const transport = nodemailer.createTransport({
    host: creds.smtp_host,
    port: creds.smtp_port,
    secure: !!creds.smtp_secure,
    ...(creds.smtp_starttls && !creds.smtp_secure ? { requireTLS: true } : {}),
    auth: {
      user: creds.username,
      pass: creds.password,
    },
  });

  // Ensure from is a valid email address
  let fromEmail = payload.from || creds.username;
  if (!fromEmail.includes("@")) {
    fromEmail = `${fromEmail}@localhost`;
  }
  const fromAddress = payload.fromName ? `"${payload.fromName}" <${fromEmail}>` : fromEmail;

  console.log("sendMail - from:", fromAddress, "to:", payload.to);
  // Build raw first so we always have it even if provider auto-saves
  let raw = null;
  try {
    raw = await buildRawMessage({ ...payload, from: fromAddress }, fromAddress);
  } catch (err) {
    console.error("sendMail - failed to build raw message:", err.message);
  }

  const info = await transport.sendMail({
    from: fromAddress,
    to: payload.to,
    cc: payload.cc,
    bcc: payload.bcc,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
    attachments: payload.attachments || [],
  });
  console.log("sendMail - sent, messageId:", info.messageId);

  return { info, raw };
}

module.exports = { verifySmtp, sendMail };


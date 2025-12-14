const nodemailer = require("nodemailer");
const MailComposer = require("nodemailer/lib/mail-composer");

function createBrevoTransport() {
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 2525,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
}


async function verifySmtp(creds) {
  console.log("verifySmtp - verifying via Brevo relay for:", creds.username);

  const transport = createBrevoTransport();

  // Minimal RFC-valid message
  const info = await transport.sendMail({
    from: creds.username,
    to: creds.username,
    subject: "SMTP verification",
    text: "Verification successful",
  });

  console.log("verifySmtp - relay accepted message:", info.messageId);
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
  const transport = createBrevoTransport();

  let fromEmail = payload.from || creds.username;
  if (!fromEmail.includes("@")) {
    throw new Error("Invalid from address");
  }

  const fromAddress = payload.fromName
    ? `"${payload.fromName}" <${fromEmail}>`
    : fromEmail;

  console.log("sendMail - sending via Brevo relay:", fromAddress);

  let raw = null;
  try {
    raw = await buildRawMessage({ ...payload, from: fromAddress }, fromAddress);
  } catch (err) {
    console.error("sendMail - raw build failed:", err.message);
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

  console.log("sendMail - sent:", info.messageId);

  return { info, raw };
}


module.exports = { verifySmtp, sendMail };


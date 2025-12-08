const nodemailer = require("nodemailer");

async function verifySmtp(creds) {
  console.log("verifySmtp - creating transport with:", { host: creds.smtp_host, port: creds.smtp_port, secure: creds.smtp_secure, user: creds.username });
  const transport = nodemailer.createTransport({
    host: creds.smtp_host,
    port: creds.smtp_port,
    secure: !!creds.smtp_secure,
    auth: {
      user: creds.username,
      pass: creds.password,
    },
  });
  console.log("verifySmtp - verifying...");
  await transport.verify();
  console.log("verifySmtp - complete");
}

async function sendMail(creds, payload) {
  const transport = nodemailer.createTransport({
    host: creds.smtp_host,
    port: creds.smtp_port,
    secure: !!creds.smtp_secure,
    auth: {
      user: creds.username,
      pass: creds.password,
    },
  });

  // Ensure from is a valid email address
  let fromAddress = payload.from || creds.username;
  if (!fromAddress.includes('@')) {
    fromAddress = `${fromAddress}@localhost`;
  }

  console.log("sendMail - from:", fromAddress, "to:", payload.to);
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

  return info;
}

module.exports = { verifySmtp, sendMail };


const path = require("path");
// Load environment variables from a .env file if present
try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; ignore if not installed
}

const required = (name, fallback) => {
  const val = process.env[name];
  if (val === undefined || val === null || val === "") {
    return fallback;
  }
  return val;
};

module.exports = {
  port: Number(required("API_PORT", 4000)),
  corsOrigin: required("CORS_ORIGIN", "*"),
  jwtSecret: required("JWT_SECRET", "dev-jwt-secret"),
  appEncKey: required("APP_ENC_KEY", "dev-app-enc-key"),
  databasePath: path.resolve(required("DATABASE_URL", "data/app.db").replace("file:", "")),
  cookieSecure: required("COOKIE_SECURE", "false") !== "false",
  cookieName: required("SESSION_COOKIE", "sid"),
  defaultImapHost: required("IMAP_HOST", ""),
  defaultImapPort: Number(required("IMAP_PORT", 993)),
  defaultImapSecure: required("IMAP_SECURE", "true") !== "false",
  defaultSmtpHost: required("SMTP_HOST", ""),
  defaultSmtpPort: Number(required("SMTP_PORT", 465)),
  defaultSmtpSecure: required("SMTP_SECURE", "true") !== "false",
};


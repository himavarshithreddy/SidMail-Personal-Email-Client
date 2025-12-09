/**
 * Validates an email address
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates multiple email addresses (comma or semicolon separated)
 */
export function validateEmails(emailString) {
  if (!emailString) return { valid: true, emails: [] };
  
  const emails = emailString
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
  
  const invalid = emails.filter((e) => !isValidEmail(e));
  
  return {
    valid: invalid.length === 0,
    emails,
    invalid,
  };
}

/**
 * Truncates text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Sanitizes HTML content length for display
 */
export function sanitizeHTMLLength(html, maxLength = 50000) {
  if (!html) return "";
  if (html.length <= maxLength) return html;
  
  return html.slice(0, maxLength) + "<div class='text-foreground/60 italic'>... (content truncated)</div>";
}

/**
 * Formats file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
}






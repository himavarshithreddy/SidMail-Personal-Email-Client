const { simpleParser } = require("mailparser");
const sanitizeHtml = require("sanitize-html");

async function parseMessage(source) {
  try {
    const parsed = await simpleParser(source);
    const cleanHtml = parsed.html
      ? sanitizeHtml(parsed.html, {
          allowedSchemes: ["http", "https", "cid", "data", "mailto"],
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "span", "div", "table", "tbody", "thead", "tr", "td", "th"]),
          allowedAttributes: {
            "*": ["href", "src", "style", "class", "id", "width", "height", "alt", "align", "border", "cellpadding", "cellspacing"],
          },
        })
      : null;

    const attachments =
      parsed.attachments?.map((att) => ({
        cid: att.cid,
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
      })) || [];

    // Safely handle headers
    let headers = {};
    try {
      if (parsed.headers && typeof parsed.headers.entries === "function") {
        headers = Object.fromEntries(parsed.headers);
      } else if (parsed.headers) {
        headers = parsed.headers;
      }
    } catch (err) {
      console.error("Failed to parse headers:", err);
      headers = {};
    }

    return {
      subject: parsed.subject || "(no subject)",
      from: parsed.from?.value || [],
      to: parsed.to?.value || [],
      cc: parsed.cc?.value || [],
      date: parsed.date || null,
      text: parsed.text || "",
      html: cleanHtml,
      attachments,
      headers,
    };
  } catch (err) {
    console.error("parseMessage error:", err);
    throw err;
  }
}

module.exports = { parseMessage };


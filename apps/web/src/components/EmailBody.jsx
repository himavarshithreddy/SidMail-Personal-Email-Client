import { useEffect, useRef, useState, useCallback } from "react";
import { sanitizeHTMLLength } from "../lib/validation";

function buildIframeDoc(html, isPlainText) {
  const content = isPlainText
    ? `<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;margin:0;padding:16px 24px;font-size:15px;color:#1f2937;">${html}</pre>`
    : html;

  const viewportMeta = isPlainText
    ? `<meta name="viewport" content="width=device-width,initial-scale=1">`
    : ``;

  const extraStyles = isPlainText
    ? `img { max-width: 100%; height: auto; } table { max-width: 100%; }`
    : ``;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${viewportMeta}
<base target="_blank">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #1f2937;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 15px;
    line-height: 1.65;
    word-break: break-word;
    overflow-wrap: break-word;
    -webkit-font-smoothing: antialiased;
  }
  body { padding: 0; }
  ${extraStyles}
  a { color: #2563eb; }
  a:hover { color: #1d4ed8; }
  pre { overflow-x: auto; font-family: inherit; }
  blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 12px;
    margin-left: 0;
    color: #6b7280;
  }

  /* Styling for top-level email subheaders, titles, and preheader text */
  body > div:not([style*="display: none"]):not([style*="display:none"]),
  body > p,
  body > h1,
  body > h2,
  body > h3,
  body > h4,
  body > span,
  body > header {
    padding: 16px 24px;
    margin: 0 auto;
    max-width: 640px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    letter-spacing: -0.01em;
    line-height: 1.5;
  }

  /* Ensure tables inside divs don't get double padding/font override if they have their own */
  body > div > table {
    font-weight: normal;
    font-size: 14px;
    color: #1f2937;
  }

  .sidmail-quoted { display: none; }
  .sidmail-quoted.expanded { display: block; }
  .sidmail-quote-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 18px;
    border-radius: 9px;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    font-size: 14px;
    color: #6b7280;
    letter-spacing: 1px;
    line-height: 1;
    margin: 12px 24px;
    transition: background 0.15s;
    font-family: inherit;
    padding: 0;
  }
  .sidmail-quote-toggle:hover { background: #e5e7eb; }
</style>
</head>
<body>${content}</body>
</html>`;
}

const QUOTE_PATTERNS = [
  /^>+\s?/,
  /^On .+ wrote:$/,
  /^---+\s*$/,
  /^_{3,}\s*$/,
  /^-{5,}\s*Forwarded message\s*-{5,}$/i,
  /^From:\s+/,
  /^Sent:\s+/,
  /^Date:\s+/,
];

function isQuoteLine(line) {
  const trimmed = line.trim();
  return QUOTE_PATTERNS.some((p) => p.test(trimmed));
}

function wrapQuotedTextPlain(text) {
  if (/forwarded message/i.test(text)) {
    return text.split("\n").map(escapeHtml).join("\n");
  }

  const lines = text.split("\n");
  const result = [];
  let inQuote = false;
  let quoteBuffer = [];
  let quoteId = 0;
  let hasMainContent = false;

  const flushQuote = () => {
    if (quoteBuffer.length === 0) return;
    quoteId++;
    const id = `q${quoteId}`;
    result.push(
      `<button class="sidmail-quote-toggle" onclick="var el=document.getElementById('${id}');el.classList.toggle('expanded');this.textContent=el.classList.contains('expanded')?'\\u2212\\u2212\\u2212':'\\u2022\\u2022\\u2022'">•••</button>`
    );
    result.push(`<div class="sidmail-quoted" id="${id}">`);
    result.push(...quoteBuffer);
    result.push("</div>");
    quoteBuffer = [];
  };

  for (const line of lines) {
    if (!inQuote && !hasMainContent && line.trim() !== "" && !isQuoteLine(line)) {
      hasMainContent = true;
    }

    if (hasMainContent && isQuoteLine(line)) {
      if (!inQuote) inQuote = true;
      quoteBuffer.push(escapeHtml(line));
    } else {
      if (inQuote) {
        if (line.trim() === "" && quoteBuffer.length > 0) {
          quoteBuffer.push("");
          continue;
        }
        flushQuote();
        inQuote = false;
      }
      result.push(escapeHtml(line));
    }
  }
  flushQuote();
  return result.join("\n");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapQuotedTextHtml(html) {
  if (/forwarded message/i.test(html)) {
    return html;
  }

  let quoteId = 0;

  const makeToggle = (id) =>
    `<button class="sidmail-quote-toggle" onclick="var el=document.getElementById('${id}');el.classList.toggle('expanded');this.textContent=el.classList.contains('expanded')?'\\u2212\\u2212\\u2212':'\\u2022\\u2022\\u2022'">•••</button>`;

  let result = html;

  // Gmail-style: <div class="gmail_quote">
  result = result.replace(
    /(<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>)/gi,
    (...args) => {
      const match = args[0];
      const offset = args[args.length - 2];
      const textBefore = html.substring(0, offset).replace(/<[^>]+>/g, "").trim();
      if (textBefore.length < 5) return match;
      quoteId++;
      const id = `hq${quoteId}`;
      return `${makeToggle(id)}<div class="sidmail-quoted" id="${id}">${match}`;
    }
  );
  if (quoteId > 0) {
    // Close the wrapper divs we opened
    let count = quoteId;
    const closeTag = "</div>";
    result += closeTag.repeat(count);
  }

  // Outlook-style: <div id="appendonsend"> or <div style="border-top:..."> followed by From:
  if (quoteId === 0) {
    result = result.replace(
      /(<div[^>]*(?:id="?appendonsend"?|class="[^"]*(?:moz-cite-prefix|yahoo_quoted)[^"]*")[^>]*>)/gi,
      (...args) => {
        const match = args[0];
        const offset = args[args.length - 2];
        const textBefore = html.substring(0, offset).replace(/<[^>]+>/g, "").trim();
        if (textBefore.length < 5) return match;
        quoteId++;
        const id = `hq${quoteId}`;
        return `${makeToggle(id)}<div class="sidmail-quoted" id="${id}">${match}`;
      }
    );
    if (quoteId > 0) {
      result += "</div>".repeat(quoteId);
    }
  }

  // Blockquote-based quoting (common in many clients)
  if (quoteId === 0) {
    result = result.replace(
      /<blockquote[^>]*type="?cite"?[^>]*>/gi,
      (...args) => {
        const match = args[0];
        const offset = args[args.length - 2];
        const textBefore = html.substring(0, offset).replace(/<[^>]+>/g, "").trim();
        if (textBefore.length < 5) return match;
        quoteId++;
        const id = `hq${quoteId}`;
        return `${makeToggle(id)}<div class="sidmail-quoted" id="${id}">${match}`;
      }
    );
    if (quoteId > 0) {
      // Close after each </blockquote>
      let remaining = quoteId;
      result = result.replace(/<\/blockquote>/gi, (match) => {
        if (remaining > 0) {
          remaining--;
          return `${match}</div>`;
        }
        return match;
      });
    }
  }

  return result;
}

export function EmailBody({ html, text }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(150);

  const isPlainText = !html;
  const rawContent = html || text?.replace(/\n/g, "<br>") || "";
  const sanitized = sanitizeHTMLLength(rawContent, 100000);

  let processedContent;
  if (isPlainText && text) {
    processedContent = wrapQuotedTextPlain(text);
  } else {
    processedContent = wrapQuotedTextHtml(sanitized);
  }

  const doc = buildIframeDoc(processedContent, isPlainText);

  const updateHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const body = iframe.contentDocument?.body;
      if (body) {
        const height = Math.max(body.scrollHeight, body.offsetHeight);
        setIframeHeight(height + 2);
      }
    } catch {
      // cross-origin — fall back
    }
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const onLoad = () => {
      updateHeight();

      try {
        const body = iframe.contentDocument?.body;
        if (body) {
          const observer = new ResizeObserver(() => updateHeight());
          observer.observe(body);

          const mutObserver = new MutationObserver(() => {
            requestAnimationFrame(updateHeight);
          });
          mutObserver.observe(body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"],
          });

          return () => {
            observer.disconnect();
            mutObserver.disconnect();
          };
        }
      } catch {
        // cross-origin
      }
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [doc, updateHeight]);

  return (
    <div className="rounded-xl overflow-hidden border border-border/20 min-w-0 w-full">
      <div className="overflow-x-auto min-w-0 w-full">
        <iframe
          ref={iframeRef}
          srcDoc={doc}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="w-full border-0 block"
          style={{
            height: `${iframeHeight}px`,
            minHeight: "100px",
            minWidth: "0",
            backgroundColor: "#ffffff",
            borderRadius: "0.75rem",
          }}
          title="Email content"
        />
      </div>
    </div>
  );
}

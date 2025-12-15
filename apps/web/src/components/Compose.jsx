import { useState, useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import DOMPurify from "dompurify";
import { ErrorMessage } from "./ui/ErrorMessage";
import { validateEmails } from "../lib/validation";
import { ColorPicker } from "./ui/ColorPicker";
import { FontSize } from "../lib/tiptap-extensions";

const decodeHtmlEntities = (value = "") => {
  if (!value) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return doc.documentElement.textContent || "";
};

const inlineEmailStyles = (html) => {
  if (!html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Helper to merge styles
    const mergeStyles = (element, newStyles) => {
      const existingStyle = element.getAttribute("style") || "";
      const merged = existingStyle + (existingStyle && !existingStyle.endsWith(";") ? ";" : "") + newStyles;
      element.setAttribute("style", merged);
    };
    
    doc.querySelectorAll("blockquote").forEach((el) => {
      mergeStyles(el, "border-left:3px solid #6b7280;padding-left:10px;margin:0 0 12px;color:#374151;font-style:italic;");
    });
    doc.querySelectorAll("ul").forEach((el) => {
      mergeStyles(el, "padding-left:20px;margin:0 0 12px;list-style:disc;");
    });
    doc.querySelectorAll("ol").forEach((el) => {
      mergeStyles(el, "padding-left:20px;margin:0 0 12px;list-style:decimal;");
    });
    doc.querySelectorAll("li").forEach((el) => {
      mergeStyles(el, "margin:4px 0;");
    });
    
    // Ensure paragraphs have margin
    doc.querySelectorAll("p").forEach((el) => {
      if (!el.getAttribute("style")?.includes("margin")) {
        mergeStyles(el, "margin:0 0 12px;");
      }
    });
    
    return doc.body.innerHTML;
  } catch (e) {
    return html;
  }
};

const escapeHtml = (value = "") =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const plainTextToHtml = (text) => {
  if (!text) return "";
  const escaped = escapeHtml(text);
  return escaped
    .split(/\r?\n/)
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
};

export function Compose({ onClose, onSend, initialData, defaultFrom, defaultFromName }) {
  const [formData, setFormData] = useState({ from: "", fromName: "", to: "", subject: "", text: "", html: "" });
  const [showFrom, setShowFrom] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccBcc, setCcBcc] = useState({ cc: "", bcc: "" });
  const toInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const linkInputRef = useRef(null);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isRichTextMode, setIsRichTextMode] = useState(true);
  const [rawHtml, setRawHtml] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      FontSize,
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      transformPastedHTML: (html) => DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }),
      attributes: {
        class: "tiptap-prosemirror",
        "data-placeholder": "Type your message...",
        spellcheck: "true",
        "aria-label": "Message body editor",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      const html = nextEditor.getHTML();
      const text = nextEditor.getText();
      setFormData((prev) => ({ ...prev, text, html }));
    },
  });

  const activeLink = editor?.getAttributes("link")?.href || "";

  const getSelectedText = () => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ", " ").trim();
  };

  useEffect(() => {
    if (editor) {
      editor.setEditable(!sending);
    }
  }, [sending, editor]);

  const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const readFileAsAttachment = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || "";
        const base64 = typeof result === "string" ? result.split(",")[1] : "";
        resolve({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          content: base64,
          encoding: "base64",
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const initialHtml = initialData?.html || plainTextToHtml(initialData?.text || "");
    if (initialData) {
      setFormData({
        from: initialData.from || defaultFrom || "",
        fromName: initialData.fromName || defaultFromName || "",
        to: initialData.to || "",
        subject: initialData.subject || "",
        text: initialData.text || "",
        html: DOMPurify.sanitize(initialHtml, { USE_PROFILES: { html: true } }),
      });
      if (initialData.cc) {
        setCcBcc({ cc: initialData.cc, bcc: initialData.bcc || "" });
        setShowCc(true);
      } else {
        setCcBcc({ cc: "", bcc: initialData.bcc || "" });
        setShowCc(false);
      }
      if (initialData.bcc) {
        setShowBcc(true);
      } else {
        setShowBcc(false);
      }
    } else {
      setFormData({ from: defaultFrom || "", fromName: defaultFromName || "", to: "", subject: "", text: "", html: "" });
      setCcBcc({ cc: "", bcc: "" });
      setShowCc(false);
      setShowBcc(false);
    }

    setAttachments([]);
    setShowFrom(false);
    setError("");
    // Focus first input
    setTimeout(() => {
      toInputRef.current?.focus();
    }, 100);
  }, [initialData, defaultFrom, defaultFromName]);

  useEffect(() => {
    if (!editor) return;
    const nextHtml = DOMPurify.sanitize(formData.html || "", { USE_PROFILES: { html: true } });
    if (editor.getHTML() !== nextHtml) {
      editor.commands.setContent(nextHtml, false);
    }
  }, [editor, formData.html]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate recipients
    const toValidation = validateEmails(formData.to);
    if (!toValidation.valid) {
      setError(`Invalid recipient email(s): ${toValidation.invalid.join(", ")}`);
      return;
    }

    if (ccBcc.cc) {
      const ccValidation = validateEmails(ccBcc.cc);
      if (!ccValidation.valid) {
        setError(`Invalid CC email(s): ${ccValidation.invalid.join(", ")}`);
        return;
      }
    }

    if (ccBcc.bcc) {
      const bccValidation = validateEmails(ccBcc.bcc);
      if (!bccValidation.valid) {
        setError(`Invalid BCC email(s): ${bccValidation.invalid.join(", ")}`);
        return;
      }
    }

    const totalAttachmentBytes = attachments.reduce((sum, att) => sum + (att.size || 0), 0);
    if (totalAttachmentBytes > MAX_ATTACHMENT_BYTES) {
      setError("Attachments exceed 25MB total limit");
      return;
    }

    setSending(true);

    try {
      const emailData = { ...formData };
      
      if (isRichTextMode) {
        // Rich Text mode - use editor content with formatting
        const sanitizedHtml = DOMPurify.sanitize(formData.html, {
          ALLOWED_ATTR: ['style', 'href', 'target', 'rel', 'class'],
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'mark'],
          ALLOW_DATA_ATTR: false,
        });
        emailData.html = inlineEmailStyles(sanitizedHtml);
        emailData.text = formData.text;
      } else {
        // HTML mode - use raw HTML directly
        const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
          RETURN_TRUSTED_TYPE: false,
          FORCE_BODY: false,
        });
        emailData.html = sanitizedHtml;
        // Generate plain text from HTML for text-only clients
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHtml;
        emailData.text = tempDiv.textContent || tempDiv.innerText || '';
      }
      
      await onSend({
        ...emailData,
        ...(formData.from && { from: formData.from }),
        ...(formData.fromName && { fromName: formData.fromName }),
        ...(ccBcc.cc && { cc: ccBcc.cc }),
        ...(ccBcc.bcc && { bcc: ccBcc.bcc }),
        ...(attachments.length ? { attachments } : {}),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      const newAttachments = await Promise.all(files.map(readFileAsAttachment));
      const nextTotal =
        attachments.reduce((sum, att) => sum + (att.size || 0), 0) +
        newAttachments.reduce((sum, att) => sum + (att.size || 0), 0);

      if (nextTotal > MAX_ATTACHMENT_BYTES) {
        setError("Attachments exceed 25MB total limit");
        return;
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to add attachment");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenLinkInput = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href || "";
    setLinkUrl(previousUrl);
    const selected = getSelectedText();
    setLinkText(selected || "");
    setLinkInputOpen(true);
    setTimeout(() => linkInputRef.current?.focus(), 10);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    const text = linkText.trim();
    if (url) {
      const chain = editor.chain().focus().extendMarkRange("link").setLink({ href: url });
      if (text) {
        chain.insertContent(text).run();
      } else {
        chain.run();
      }
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkInputOpen(false);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkInputOpen(false);
    setLinkUrl("");
    setLinkText("");
  };

  const editorButtonClass = (active) =>
    `px-3 py-1.5 text-base rounded-md border border-border/70 bg-background transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
      active ? "bg-muted text-foreground border-border" : "text-muted-foreground hover:bg-muted/80"
    }`;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border">
        <h2 className="text-base font-medium text-foreground">
          {initialData?.isForward ? "Forward Message" : "Compose Message"}
        </h2>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          onClick={onClose}
          type="button"
          aria-label="Close compose window"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <form className={`h-full flex flex-col relative ${sending ? 'cursor-not-allowed' : ''}`} onSubmit={handleSubmit}>
          <div className="flex-1 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <label htmlFor="compose-from" className="text-base font-medium text-foreground">
                  Sender
                </label>
                <p className="text-sm text-muted-foreground">
                  {formData.fromName || "(no name)"} &lt;{formData.from || "you@example.com"}&gt;
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost cursor-pointer"
                onClick={() => setShowFrom((v) => !v)}
                disabled={sending}
              >
                {showFrom ? "Hide" : "Edit"}
              </button>
            </div>

            {showFrom && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="compose-from" className="text-base font-medium text-foreground">
                    From email
                  </label>
                  <input
                    id="compose-from"
                    className="input"
                    type="text"
                    placeholder="you@example.com"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    disabled={sending}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="compose-from-name" className="text-base font-medium text-foreground">
                    From name
                  </label>
                  <input
                    id="compose-from-name"
                    className="input"
                    type="text"
                    placeholder="Your display name"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    disabled={sending}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="compose-to" className="text-base font-medium text-foreground">
                  To
                </label>
                <div className="flex gap-2">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="text-base text-muted-foreground hover:text-foreground cursor-pointer"
                      disabled={sending}
                    >
                      Add CC
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="text-base text-muted-foreground hover:text-foreground cursor-pointer"
                      disabled={sending}
                    >
                      Add BCC
                    </button>
                  )}
                </div>
              </div>
              <input
                id="compose-to"
                ref={toInputRef}
                className="input"
                type="text"
                placeholder="recipient@example.com (comma-separated for multiple)"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                required
                disabled={sending}
              />
            </div>

            {showCc && (
              <div className="space-y-2">
                <label htmlFor="compose-cc" className="text-base font-medium text-foreground">
                  CC
                </label>
                <input
                  id="compose-cc"
                  className="input"
                  type="text"
                  placeholder="cc@example.com"
                  value={ccBcc.cc}
                  onChange={(e) => setCcBcc({ ...ccBcc, cc: e.target.value })}
                  disabled={sending}
                />
              </div>
            )}

            {showBcc && (
              <div className="space-y-2">
                <label htmlFor="compose-bcc" className="text-base font-medium text-foreground">
                  BCC
                </label>
                <input
                  id="compose-bcc"
                  className="input"
                  type="text"
                  placeholder="bcc@example.com"
                  value={ccBcc.bcc}
                  onChange={(e) => setCcBcc({ ...ccBcc, bcc: e.target.value })}
                  disabled={sending}
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="compose-subject" className="text-base font-medium text-foreground">
                Subject
              </label>
              <input
                id="compose-subject"
                className="input"
                placeholder="Enter subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                disabled={sending}
              />
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <label htmlFor="compose-message" className="text-base font-medium text-foreground">
                  Message
                </label>
                <button
                  type="button"
                  onClick={() => setIsRichTextMode(!isRichTextMode)}
                  className="px-3 py-1 text-sm rounded-md border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
                  disabled={sending}
                  title={isRichTextMode ? "Switch to HTML" : "Switch to Rich Text"}
                >
                  {isRichTextMode ? "Rich Text" : "HTML"}
                </button>
              </div>
              <div className="flex flex-col flex-1 rounded-md border border-border bg-background overflow-hidden">
              <div className="tiptap-shell flex flex-col flex-1 rounded-md border border-border bg-background overflow-hidden">
                {isRichTextMode && (
                <div className="tiptap-toolbar flex flex-wrap items-center gap-2 border-b border-border bg-muted/60 px-2 py-2">
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("bold"))}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    disabled={!editor || sending}
                    aria-label="Bold"
                  aria-pressed={editor?.isActive("bold") || false}
                  title="Bold"
                  >
                  <span className="font-semibold text-lg">B</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("italic"))}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    disabled={!editor || sending}
                    aria-label="Italic"
                  aria-pressed={editor?.isActive("italic") || false}
                  title="Italic"
                  >
                  <span className="italic text-lg">I</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("underline"))}
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    disabled={!editor || sending}
                    aria-label="Underline"
                  aria-pressed={editor?.isActive("underline") || false}
                  title="Underline"
                  >
                  <span className="underline text-lg">U</span>
                  </button>

                  <div className="h-6 border-l border-border mx-1" />

                  {/* Font Size */}
                  <select
                    className="px-2 py-1 text-sm rounded-md border border-border/70 bg-background cursor-pointer hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    onChange={(e) => {
                      const size = e.target.value;
                      if (size) {
                        editor?.chain().focus().setFontSize(size).run();
                      } else {
                        editor?.chain().focus().unsetFontSize().run();
                      }
                    }}
                    disabled={!editor || sending}
                    title="Font Size"
                  >
                    <option value="">Size</option>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                  </select>

                  {/* Font Family */}
                  <select
                    className="px-2 py-1 text-sm rounded-md border border-border/70 bg-background cursor-pointer hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    onChange={(e) => {
                      const font = e.target.value;
                      if (font) {
                        editor?.chain().focus().setFontFamily(font).run();
                      } else {
                        editor?.chain().focus().unsetFontFamily().run();
                      }
                    }}
                    disabled={!editor || sending}
                    title="Font Family"
                  >
                    <option value="">Font</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                    <option value="Impact, sans-serif">Impact</option>
                    <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  </select>

                  <div className="h-6 border-l border-border mx-1" />

                  {/* Text Color */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">A</span>
                    <ColorPicker
                      value={editor?.getAttributes("textStyle").color}
                      onChange={(color) => {
                        if (color) {
                          editor?.chain().focus().setColor(color).run();
                        } else {
                          editor?.chain().focus().unsetColor().run();
                        }
                      }}
                      disabled={!editor || sending}
                      title="Text Color"
                    />
                  </div>

                  {/* Background Color */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">BG</span>
                    <ColorPicker
                      value={editor?.getAttributes("highlight").color}
                      onChange={(color) => {
                        if (color) {
                          editor?.chain().focus().setHighlight({ color }).run();
                        } else {
                          editor?.chain().focus().unsetHighlight().run();
                        }
                      }}
                      disabled={!editor || sending}
                      title="Background Color"
                    />
                  </div>

                  <div className="h-6 border-l border-border mx-1" />
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("bulletList"))}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    disabled={!editor || sending}
                    aria-label="Bullet list"
                  aria-pressed={editor?.isActive("bulletList") || false}
                  title="Bullet list"
                  >
                  <span className="text-base">• List</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("orderedList"))}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    disabled={!editor || sending}
                    aria-label="Numbered list"
                  aria-pressed={editor?.isActive("orderedList") || false}
                  title="Numbered list"
                  >
                  <span className="text-base">1. List</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("blockquote"))}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    disabled={!editor || sending}
                    aria-label="Blockquote"
                  aria-pressed={editor?.isActive("blockquote") || false}
                  title="Quote"
                  >
                  <span className="text-base">“Quote”</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive("codeBlock"))}
                    onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                    disabled={!editor || sending}
                    aria-label="Code block"
                  aria-pressed={editor?.isActive("codeBlock") || false}
                  title="Code block"
                  >
                  <span className="text-base">{"</>"}</span>
                  </button>
                  <div className="h-6 border-l border-border mx-1" />
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive({ textAlign: "left" }))}
                    onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                    disabled={!editor || sending}
                    aria-label="Align left"
                  aria-pressed={editor?.isActive({ textAlign: "left" }) || false}
                  title="Align left"
                  >
                  <span className="text-lg">L</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive({ textAlign: "center" }))}
                    onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                    disabled={!editor || sending}
                    aria-label="Align center"
                  aria-pressed={editor?.isActive({ textAlign: "center" }) || false}
                  title="Align center"
                  >
                  <span className="text-lg">C</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(editor?.isActive({ textAlign: "right" }))}
                    onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                    disabled={!editor || sending}
                    aria-label="Align right"
                  aria-pressed={editor?.isActive({ textAlign: "right" }) || false}
                  title="Align right"
                  >
                  <span className="text-lg">R</span>
                  </button>
                  <div className="h-6 border-l border-border mx-1" />
                <button
                  type="button"
                  className={editorButtonClass(editor?.isActive("link") || linkInputOpen)}
                  onClick={handleOpenLinkInput}
                  disabled={!editor || sending}
                  aria-label="Insert link"
                  aria-pressed={editor?.isActive("link") || linkInputOpen || false}
                  title="Insert link"
                >
                  <span className="text-base font-medium">Link</span>
                </button>
                  <div className="h-6 border-l border-border mx-1" />
                  <button
                    type="button"
                    className={editorButtonClass(false)}
                    onClick={() => editor?.chain().focus().undo().run()}
                    disabled={!editor || !editor.can().undo() || sending}
                    aria-label="Undo"
                  title="Undo"
                  >
                  <span className="text-base">Undo</span>
                  </button>
                  <button
                    type="button"
                    className={editorButtonClass(false)}
                    onClick={() => editor?.chain().focus().redo().run()}
                    disabled={!editor || !editor.can().redo() || sending}
                    aria-label="Redo"
                  title="Redo"
                  >
                  <span className="text-base">Redo</span>
                  </button>
                </div>
                )}
                {isRichTextMode && linkInputOpen && (
                  <div className="flex flex-col gap-2 px-3 py-3 border-b border-border bg-background">
                    <div className="flex flex-col gap-2">
                      <input
                        ref={linkInputRef}
                        type="url"
                        className="input h-9"
                        placeholder="Paste or type a URL"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyLink();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setLinkInputOpen(false);
                          }
                        }}
                        disabled={sending || !editor}
                      />
                      <input
                        type="text"
                        className="input h-9"
                        placeholder="Text to display (optional)"
                        value={linkText}
                        onChange={(e) => setLinkText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyLink();
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setLinkInputOpen(false);
                          }
                        }}
                        disabled={sending || !editor}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn-primary h-9 px-3 cursor-pointer"
                        onClick={handleApplyLink}
                        disabled={sending || !editor || !linkUrl.trim()}
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        className="btn-ghost h-9 px-3 cursor-pointer"
                        onClick={handleRemoveLink}
                        disabled={sending || !editor}
                      >
                        Remove
                      </button>
                      <span className="ml-auto text-xs text-muted-foreground">Enter to apply · Esc to close</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getSelectedText() ? `Selected text: “${getSelectedText()}”` : "No text selected"}
                      {activeLink ? ` • Active link: ${activeLink}` : ""}
                    </div>
                  </div>
                )}
                {isRichTextMode ? (
                  editor ? (
                    <EditorContent
                      editor={editor}
                      className="tiptap-editor prose prose-sm max-w-none flex-1 min-h-[220px] max-h-[360px] overflow-y-auto px-3 py-2"
                    />
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">Loading editor...</div>
                  )
                ) : (
                  <textarea
                    value={rawHtml}
                    onChange={(e) => setRawHtml(e.target.value)}
                    className="tiptap-editor flex-1 min-h-[220px] max-h-[360px] overflow-y-auto px-3 py-2 font-mono text-sm bg-background text-foreground border-none focus:outline-none resize-none"
                    placeholder="Paste your HTML code here..."
                    disabled={sending}
                    spellCheck={false}
                  />
                )}
              </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-foreground">Attachments</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{attachments.length} file(s)</span>
                  <span>•</span>
                  <span>
                    {formatSize(attachments.reduce((sum, att) => sum + (att.size || 0), 0))} / 25MB
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-border bg-muted hover:bg-muted/80 text-sm cursor-pointer"
                  disabled={sending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add attachment
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachments.map((att, idx) => (
                  <div
                    key={`${att.filename}-${idx}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted text-sm"
                  >
                    <span className="truncate max-w-[180px]">{att.filename}</span>
                    <span className="text-muted-foreground text-xs">{formatSize(att.size || 0)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label={`Remove ${att.filename}`}
                      disabled={sending}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <ErrorMessage message={error} />}
          </div>

          {/* Footer with Actions */}
          <div className="px-6 py-3 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              className="btn-ghost cursor-pointer"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary cursor-pointer"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}


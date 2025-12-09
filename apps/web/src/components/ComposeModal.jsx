import { useState, useEffect, useRef } from "react";
import { ErrorMessage } from "./ui/ErrorMessage";
import { validateEmails } from "../lib/validation";

export function ComposeModal({ isOpen, onClose, onSend, defaultFrom, defaultFromName }) {
  const [formData, setFormData] = useState({ from: "", fromName: "", to: "", subject: "", text: "" });
  const [showFrom, setShowFrom] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccBcc, setCcBcc] = useState({ cc: "", bcc: "" });
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (isOpen) {
      setFormData({ from: defaultFrom || "", fromName: defaultFromName || "", to: "", subject: "", text: "" });
      setCcBcc({ cc: "", bcc: "" });
      setShowCc(false);
      setShowBcc(false);
      setAttachments([]);
      setShowFrom(false);
      setError("");
      // Focus first input
      setTimeout(() => {
        modalRef.current?.querySelector("input")?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

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
      await onSend({
        ...formData,
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-title"
    >
      <div
        className="max-w-2xl w-full p-6 rounded-lg border border-border bg-popover space-y-4 animate-in slide-in-from-bottom-4 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 id="compose-title" className="text-xl font-semibold text-foreground">
            Compose Message
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
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="input"
              type="text"
              placeholder="recipient@example.com (comma-separated for multiple)"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              required
              disabled={sending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
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
            <label htmlFor="compose-from" className="text-base font-medium text-foreground">
              From
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
              From Name
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
              <label htmlFor="compose-bcc" className="text-lg font-medium text-foreground">
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

          <div className="space-y-2">
            <label htmlFor="compose-message" className="text-base font-medium text-foreground">
              Message
            </label>
            <textarea
              id="compose-message"
              className="input min-h-[200px] max-h-[400px] resize-y"
              placeholder="Type your message..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              disabled={sending}
            />
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

          <div className="flex justify-end gap-3 pt-2">
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
    </div>
  );
}

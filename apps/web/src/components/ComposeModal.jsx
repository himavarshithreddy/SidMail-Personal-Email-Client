import { useState, useEffect, useRef } from "react";
import { ErrorMessage } from "./ui/ErrorMessage";
import { validateEmails } from "../lib/validation";

export function ComposeModal({ isOpen, onClose, onSend, initialData }) {
  const [formData, setFormData] = useState({ to: "", subject: "", text: "" });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [ccBcc, setCcBcc] = useState({ cc: "", bcc: "" });
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          to: initialData.to || "",
          subject: initialData.subject || "",
          text: initialData.text || "",
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
      setFormData({ to: "", subject: "", text: "" });
      setCcBcc({ cc: "", bcc: "" });
      setShowCc(false);
      setShowBcc(false);
      }
      setError("");
      // Focus first input
      setTimeout(() => {
        modalRef.current?.querySelector("input")?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

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

    setSending(true);

    try {
      await onSend({
        ...formData,
        ...(ccBcc.cc && { cc: ccBcc.cc }),
        ...(ccBcc.bcc && { bcc: ccBcc.bcc }),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
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

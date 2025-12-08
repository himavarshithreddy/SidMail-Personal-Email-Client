import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { Loading } from "./ui/Loading";

export function AttachmentViewer({ isOpen, onClose, attachment, attachments, uid, folder }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current attachment index
  useEffect(() => {
    if (attachment && attachments) {
      const index = attachments.findIndex((att) => att.part === attachment.part);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [attachment, attachments]);

  // Reset zoom when attachment changes
  useEffect(() => {
    setZoom(1);
    setLoading(true);
    setError(null);
  }, [attachment]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && attachments && currentIndex > 0) {
        handlePrevious();
      } else if (e.key === "ArrowRight" && attachments && currentIndex < attachments.length - 1) {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, attachments, currentIndex]);

  if (!isOpen || !attachment) return null;

  const currentAttachment = attachments?.[currentIndex] || attachment;
  const previewUrl = `${API_BASE}/mail/attachments/${uid}/${currentAttachment.part}?folder=${encodeURIComponent(folder)}&preview=true`;
  const downloadUrl = `${API_BASE}/mail/attachments/${uid}/${currentAttachment.part}?folder=${encodeURIComponent(folder)}`;

  const handlePrevious = () => {
    if (attachments && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (attachments && currentIndex < attachments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleDownload = () => {
    window.open(downloadUrl, "_blank");
  };

  const canNavigate = attachments && attachments.length > 1;
  const hasPrevious = canNavigate && currentIndex > 0;
  const hasNext = canNavigate && currentIndex < attachments.length - 1;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/95 border-b border-border rounded-t-lg">
          <div className="flex-1 min-w-0">
            <h2 id="viewer-title" className="text-lg font-semibold text-foreground truncate">
              {currentAttachment.filename}
            </h2>
            {canNavigate && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentIndex + 1} of {attachments.length}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-border rounded-md p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Zoom Out (-)"
                disabled={zoom <= 0.5}
              >
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="text-xs text-muted-foreground px-2 min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Zoom In (+)"
                disabled={zoom >= 3}
              >
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer"
                title="Reset Zoom (0)"
              >
                <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
              title="Download"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-muted transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 relative overflow-auto bg-black/50 flex items-center justify-center p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loading />
            </div>
          )}
          {error ? (
            <div className="text-center text-foreground">
              <p className="text-lg font-medium mb-2">Failed to load image</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Download Instead
              </button>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={currentAttachment.filename}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError("Image could not be loaded");
              }}
            />
          )}

          {/* Navigation Arrows */}
          {canNavigate && (
            <>
              {hasPrevious && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background border border-border transition-colors cursor-pointer"
                  title="Previous (←)"
                >
                  <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {hasNext && (
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background border border-border transition-colors cursor-pointer"
                  title="Next (→)"
                >
                  <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="p-2 bg-background/95 border-t border-border rounded-b-lg">
          <p className="text-xs text-muted-foreground text-center">
            Use ← → to navigate, + - to zoom, 0 to reset, ESC to close
          </p>
        </div>
      </div>
    </div>
  );
}

import { getFileIcon, getFileCategory, getFileCategoryColor } from "../lib/fileTypes";
import { formatFileSize, truncate } from "../lib/validation";
import { API_BASE } from "../lib/api";

export function AttachmentCard({ attachment, uid, folder }) {
  const { part, filename, mimeType, size } = attachment;
  const category = getFileCategory(mimeType, filename);
  const downloadUrl = `${API_BASE}/mail/attachments/${uid}/${part}?folder=${encodeURIComponent(folder)}`;
  const categoryColor = getFileCategoryColor(category);

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(downloadUrl, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback to opening in new tab
      window.open(downloadUrl, "_blank");
    }
  };

  return (
    <div className="group relative flex flex-col gap-2 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all">
      {/* Icon Section */}
      <div className="relative w-full aspect-square rounded-md bg-background/50 border border-border overflow-hidden flex items-center justify-center">
        <div className={`w-full h-full flex items-center justify-center ${categoryColor}`}>
          {getFileIcon(mimeType, filename, "w-8 h-8")}
        </div>
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate" title={filename}>
          {truncate(filename, 25)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(size)}
        </div>
        {mimeType && (
          <div className="text-xs text-muted-foreground/70 mt-0.5 truncate" title={mimeType}>
            {mimeType.split("/")[1]?.toUpperCase() || "FILE"}
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="pt-1 border-t border-border/50">
        <button
          onClick={handleDownload}
          className="w-full px-2 py-1.5 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors cursor-pointer flex items-center justify-center gap-1"
          title="Download"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}

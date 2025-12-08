/**
 * File type detection and icon mapping utilities
 */

/**
 * Get file extension from filename
 */
function getFileExtension(filename) {
    if (!filename) return "";
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }
  
  /**
   * Get file category from MIME type or extension
   */
  export function getFileCategory(mimeType, filename) {
    if (!mimeType && !filename) return "unknown";
    
    const ext = getFileExtension(filename);
    const mime = (mimeType || "").toLowerCase();
    
    // Image types
    if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
      return "image";
    }
    
    // Document types
    if (
      mime.includes("pdf") ||
      mime.includes("word") ||
      mime.includes("excel") ||
      mime.includes("powerpoint") ||
      mime.includes("document") ||
      mime.includes("spreadsheet") ||
      mime.includes("presentation") ||
      ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(ext)
    ) {
      return "document";
    }
    
    // Archive types
    if (
      mime.includes("zip") ||
      mime.includes("archive") ||
      mime.includes("compressed") ||
      ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)
    ) {
      return "archive";
    }
    
    // Audio types
    if (
      mime.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(ext)
    ) {
      return "audio";
    }
    
    // Video types
    if (
      mime.startsWith("video/") ||
      ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v"].includes(ext)
    ) {
      return "video";
    }
    
    // Code types
    if (
      ["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "cs", "php", "rb", "go", "rs", "swift", "kt", "html", "css", "scss", "json", "xml", "yaml", "yml", "md", "sh", "bat", "ps1"].includes(ext)
    ) {
      return "code";
    }
    
    // Text types
    if (
      mime.includes("text/") ||
      ["txt", "log", "csv"].includes(ext)
    ) {
      return "text";
    }
    
    return "unknown";
  }
  
  /**
   * Check if file can be previewed inline
   */
  export function isPreviewable(mimeType, filename) {
    const category = getFileCategory(mimeType, filename);
    return category === "image";
  }
  
  /**
   * Get file type icon component
   */
  export function getFileIcon(mimeType, filename, className = "w-5 h-5") {
    const category = getFileCategory(mimeType, filename);
    const ext = getFileExtension(filename);
    
    const iconClass = `${className} flex-shrink-0`;
    
    switch (category) {
      case "image":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      
      case "document":
        if (mimeType?.includes("pdf") || ext === "pdf") {
          return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          );
        }
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      
      case "archive":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      
      case "audio":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      
      case "video":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      
      case "code":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      
      case "text":
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  }
  
  /**
   * Get color class for file category
   */
  export function getFileCategoryColor(category) {
    switch (category) {
      case "image":
        return "text-blue-400";
      case "document":
        return "text-red-400";
      case "archive":
        return "text-yellow-400";
      case "audio":
        return "text-green-400";
      case "video":
        return "text-purple-400";
      case "code":
        return "text-orange-400";
      case "text":
        return "text-cyan-400";
      default:
        return "text-muted-foreground";
    }
  }
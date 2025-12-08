import JSZip from "jszip";
import { API_BASE } from "./api";

/**
 * Download all attachments as a ZIP file
 * @param {Array} attachments - Array of attachment objects with part, filename, etc.
 * @param {number} uid - Message UID
 * @param {string} folder - Folder name
 * @param {Function} onProgress - Optional progress callback (current, total)
 * @returns {Promise<void>}
 */
export async function downloadAllAttachments(attachments, uid, folder, onProgress) {
  if (!attachments || attachments.length === 0) {
    throw new Error("No attachments to download");
  }

  const zip = new JSZip();
  const total = attachments.length;
  let completed = 0;

  try {
    // Fetch all attachments in parallel
    const fetchPromises = attachments.map(async (att) => {
      try {
        const url = `${API_BASE}/mail/attachments/${uid}/${att.part}?folder=${encodeURIComponent(folder)}`;
        const response = await fetch(url, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${att.filename}: ${response.statusText}`);
        }

        const blob = await response.blob();
        zip.file(att.filename, blob);
        
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }

        return { success: true, filename: att.filename };
      } catch (error) {
        console.error(`Error fetching attachment ${att.filename}:`, error);
        return { success: false, filename: att.filename, error: error.message };
      }
    });

    await Promise.all(fetchPromises);

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Trigger download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(zipBlob);
    link.download = "attachments.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error creating ZIP file:", error);
    throw new Error(`Failed to create ZIP file: ${error.message}`);
  }
}

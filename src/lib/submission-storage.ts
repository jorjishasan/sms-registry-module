import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/** Live Vercel has the token; local `pnpm dev` does not. */
export function usesVercelBlob(): boolean {
  return (
    process.env.VERCEL === "1" && Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  );
}

export async function storeSubmissionFile(
  fileName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (usesVercelBlob()) {
    const blob = await put(`submissions/${fileName}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), buffer);
  return `/uploads/${fileName}`;
}

export async function removeStoredSubmission(fileUrl: string): Promise<void> {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    try {
      await del(fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // Blob may already be gone; the DB record is what matters.
    }
    return;
  }

  const diskPath = path.join(process.cwd(), "public", fileUrl.replace(/^\//, ""));
  try {
    await unlink(diskPath);
  } catch {
    // File may already be gone; the DB record is what matters.
  }
}

export function contentTypeForExtension(extension: string): string {
  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

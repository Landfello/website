import { getAccessToken } from "@/lib/session";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function uploadImageFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name} is not an image.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`${file.name} is too large. Maximum size is 5MB.`);
    }
  }

  const token = await getAccessToken();
  if (!token) throw new Error("You must be signed in to upload images");

  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.detail || data?.error || `Upload failed (${response.status})`;
    throw new Error(typeof detail === "string" ? detail : "Upload failed");
  }
  return (data.urls || []) as string[];
}

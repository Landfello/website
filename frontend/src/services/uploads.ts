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
    const raw = data?.detail || data?.error;
    if (response.status === 404 || raw === "Not Found") {
      throw new Error("Image upload is not available on the server yet. Please try again in a minute.");
    }
    throw new Error(typeof raw === "string" && raw ? raw : `Upload failed (${response.status})`);
  }
  return (data.urls || []) as string[];
}

function dataUrlToFile(dataUrl: string, index: number): File | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = mime.split("/")[1] || "jpg";
  return new File([bytes], `photo-${index + 1}.${ext}`, { type: mime });
}

/** Upload local data URLs and keep already-hosted https URLs. */
export async function resolveListingImages(images: Array<string | undefined | null>): Promise<string[]> {
  const remote: string[] = [];
  const localFiles: File[] = [];
  images.forEach((image, index) => {
    if (!image) return;
    if (image.startsWith("http://") || image.startsWith("https://")) {
      remote.push(image);
      return;
    }
    if (image.startsWith("data:")) {
      const file = dataUrlToFile(image, index);
      if (file) localFiles.push(file);
    }
  });
  const uploaded = await uploadImageFiles(localFiles);
  return [...remote, ...uploaded];
}

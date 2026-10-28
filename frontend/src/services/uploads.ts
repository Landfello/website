import { getAccessToken } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const LISTING_IMAGE_BUCKET = "listing-images";

function extensionFor(file: File): string {
  const fromType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  if (file.type && fromType[file.type]) return fromType[file.type];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext && ["jpg", "png", "webp", "gif"].includes(ext)) return ext;
  return "jpg";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function validateImageFiles(files: File[]) {
  for (const file of files) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|gif|webp)$/i.test(file.name)) {
      throw new Error(`${file.name} is not an image.`);
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`${file.name} is too large. Maximum size is 5MB.`);
    }
  }
}

async function uploadViaApi(files: File[], token: string): Promise<string[] | "missing"> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await fetch(`${API_BASE_URL}/uploads`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await response.json().catch(() => ({}));
  const raw = data?.detail || data?.error;

  if (response.status === 404 || raw === "Not Found") {
    return "missing";
  }
  if (!response.ok) {
    throw new Error(typeof raw === "string" && raw ? raw : `Upload failed (${response.status})`);
  }
  const urls = (data.urls || []) as string[];
  if (!urls.length) {
    throw new Error("Upload succeeded but no image URLs were returned.");
  }
  return urls;
}

async function uploadViaSupabase(files: File[]): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Cloud image storage is not configured.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id || "anonymous";
  const urls: string[] = [];

  for (const file of files) {
    const path = `uploads/${userId}/${crypto.randomUUID()}.${extensionFor(file)}`;
    const { error } = await supabase.storage.from(LISTING_IMAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });
    if (error) {
      throw new Error(error.message || "Could not upload image to storage.");
    }
    const { data } = supabase.storage.from(LISTING_IMAGE_BUCKET).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error("Could not build a public URL for the uploaded image.");
    }
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function uploadImageFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  validateImageFiles(files);

  const token = await getAccessToken();
  if (!token) throw new Error("You must be signed in to upload images");

  try {
    const fromApi = await uploadViaApi(files, token);
    if (fromApi !== "missing") return fromApi;
  } catch (err: any) {
    const message = String(err?.message || "");
    if (message.includes("not an image") || message.includes("too large") || message.includes("5MB")) {
      throw err;
    }
    // Fall through to Supabase / local preview if the API is old or storage is misconfigured.
  }

  try {
    return await uploadViaSupabase(files);
  } catch {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    if (total <= 900_000) {
      return Promise.all(files.map((file) => readFileAsDataUrl(file)));
    }
    throw new Error(
      "Could not upload images. Cloud storage is not ready yet — try smaller photos or try again in a minute."
    );
  }
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

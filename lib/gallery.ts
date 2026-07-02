import { supabase } from "@/lib/supabase";

const GALLERY_BUCKET = "vg-gallery";

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
]);

export const GALLERY_POSE_TYPES = ["front", "side", "back"] as const;

export type GalleryPoseType = (typeof GALLERY_POSE_TYPES)[number];

export type GalleryEntry = {
  id: string;
  image_url: string;
  day_number: number;
  pose_type: string | null;
  caption: string | null;
  created_at: string;
};

export type GalleryEntryInput = {
  image_url: string;
  day_number: number;
  pose_type?: string | null;
  caption?: string | null;
};

export type GalleryItem = {
  id: string;
  url: string;
  day_number: number;
  pose_type: string | null;
  caption: string | null;
  created_at?: string;
};

export type GalleryPageContent = {
  eyebrow: string;
  title: string;
  description: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: string }).message);
  }
  return fallback;
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) return "jpg";
  return parts.pop()!.toLowerCase();
}

function getSafeExtension(fileName: string, mimeType?: string): string {
  const ext = getFileExtension(fileName);
  if (ALLOWED_IMAGE_EXTENSIONS.has(ext)) return ext;

  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (mimeType && mimeMap[mimeType]) {
    return mimeMap[mimeType];
  }

  return "jpg";
}

function generateUniqueFileName(originalName: string, mimeType?: string): string {
  const ext = getSafeExtension(originalName, mimeType);
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

function entryToGalleryItem(entry: GalleryEntry): GalleryItem {
  return {
    id: entry.id,
    url: entry.image_url,
    day_number: entry.day_number,
    pose_type: entry.pose_type,
    caption: entry.caption,
    created_at: entry.created_at,
  };
}

export function getGalleryPageContent(brandName: string): GalleryPageContent {
  return {
    eyebrow: "Visual Progress",
    title: "Transformation Gallery",
    description: `Visual proof of the ${brandName} journey`,
  };
}

function isValidGalleryImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname;

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    return (
      host.endsWith(".supabase.co") &&
      parsed.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

export async function uploadGalleryImage(file: File): Promise<{
  url: string | null;
  error: string | null;
}> {
  if (!file || file.size === 0) {
    return { url: null, error: "No file provided." };
  }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Only image files are allowed." };
  }

  try {
    const fileName = generateUniqueFileName(file.name, file.type);

    const { data, error } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return { url: null, error: error.message };
    }

    if (!data?.path) {
      return { url: null, error: "Upload failed: no file path returned." };
    }

    const { data: publicData } = supabase.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(data.path);

    if (!publicData.publicUrl) {
      return { url: null, error: "Upload failed: could not resolve public URL." };
    }

    if (!isValidGalleryImageUrl(publicData.publicUrl)) {
      return {
        url: null,
        error: "Upload failed: invalid public URL returned from storage.",
      };
    }

    return { url: publicData.publicUrl, error: null };
  } catch (err) {
    return {
      url: null,
      error: getErrorMessage(err, "Failed to upload gallery image."),
    };
  }
}

export async function saveGalleryEntry(
  data: GalleryEntryInput
): Promise<{
  entry: GalleryEntry | null;
  error: string | null;
}> {
  if (!data.image_url.trim()) {
    return { entry: null, error: "Image URL is required." };
  }

  if (!isValidGalleryImageUrl(data.image_url)) {
    return {
      entry: null,
      error:
        "Image URL must be a Supabase storage public URL (or localhost for dev).",
    };
  }

  if (!Number.isInteger(data.day_number) || data.day_number < 1) {
    return { entry: null, error: "Day number must be a positive integer." };
  }

  const payload = {
    image_url: data.image_url.trim(),
    day_number: data.day_number,
    pose_type: data.pose_type?.trim() || null,
    caption: data.caption?.trim() || null,
  };

  try {
    const { data: row, error } = await supabase
      .from("gallery_entries")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { entry: null, error: error.message };
    }

    if (!row) {
      return {
        entry: null,
        error:
          "Save failed: no row returned. Check Supabase RLS policies for gallery_entries.",
      };
    }

    return { entry: row as GalleryEntry, error: null };
  } catch (err) {
    return {
      entry: null,
      error: getErrorMessage(err, "Failed to save gallery entry."),
    };
  }
}

export async function getGalleryEntries(): Promise<{
  entries: GalleryEntry[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from("gallery_entries")
      .select("*")
      .order("day_number", { ascending: false });

    if (error) {
      return { entries: [], error: error.message };
    }

    const rows = (data ?? []) as GalleryEntry[];
    const entries = rows.filter((row) => isValidGalleryImageUrl(row.image_url));

    return { entries, error: null };
  } catch (err) {
    return {
      entries: [],
      error: getErrorMessage(err, "Failed to fetch gallery entries."),
    };
  }
}

export async function fetchGalleryData(): Promise<{
  items: GalleryItem[];
  error: string | null;
}> {
  const { entries, error } = await getGalleryEntries();

  if (error) {
    return { items: [], error };
  }

  return {
    items: entries.map(entryToGalleryItem),
    error: null,
  };
}

export type GalleryItem = {
  id: string;
  url: string;
  caption: string | null;
  date: string | null;
  created_at?: string;
};

export type GalleryPageContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export function getGalleryPageContent(): GalleryPageContent {
  return {
    eyebrow: "Visual Progress",
    title: "Transformation Gallery",
    description:
      "Before-and-after photos, milestone snapshots, and the visual proof of the VG 2.0 rebuild.",
  };
}

export async function fetchGalleryData(): Promise<{
  items: GalleryItem[];
  error: string | null;
}> {
  // Placeholder until gallery storage is wired up
  return { items: [], error: null };
}

import type { NextConfig } from "next";

function getSupabaseHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const supabaseHostname = getSupabaseHostname();

// GalleryCard (used by app/gallery/page.tsx) renders entry.image_url via next/image.
// Production URLs: https://<project>.supabase.co/storage/v1/object/public/vg-gallery/...
const imageRemotePatterns: NonNullable<
  NextConfig["images"]
>["remotePatterns"] = [
  {
    protocol: "http",
    hostname: "localhost",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "localhost",
    pathname: "/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "127.0.0.1",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "**.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

if (supabaseHostname) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: supabaseHostname,
    pathname: "/storage/v1/object/public/**",
  });
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;

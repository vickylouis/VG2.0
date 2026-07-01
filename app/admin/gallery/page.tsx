"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ImagePlus, Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  GALLERY_POSE_TYPES,
  saveGalleryEntry,
  uploadGalleryImage,
  type GalleryPoseType,
} from "@/lib/gallery";
import { cn } from "@/lib/utils";

type GalleryFormState = {
  dayNumber: string;
  poseType: GalleryPoseType;
  caption: string;
};

const initialForm = (): GalleryFormState => ({
  dayNumber: "",
  poseType: "front",
  caption: "",
});

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-[#A3A3A3]"
    >
      {children}
    </label>
  );
}

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/50",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

function capitalizePose(pose: GalleryPoseType): string {
  return pose.charAt(0).toUpperCase() + pose.slice(1);
}

function validateForm(
  form: GalleryFormState,
  file: File | null
): string | null {
  if (!file) return "Please select an image to upload.";

  if (!file.type.startsWith("image/")) {
    return "Only image files are allowed.";
  }

  const dayNumber = Number(form.dayNumber);
  if (
    !form.dayNumber.trim() ||
    !Number.isInteger(dayNumber) ||
    dayNumber < 1
  ) {
    return "Day number must be a positive whole number.";
  }

  if (!GALLERY_POSE_TYPES.includes(form.poseType)) {
    return "Please select a valid pose type.";
  }

  return null;
}

export default function AdminGalleryPage() {
  const [form, setForm] = useState<GalleryFormState>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const poseOptions = useMemo(
    () =>
      GALLERY_POSE_TYPES.map((pose) => ({
        value: pose,
        label: capitalizePose(pose),
      })),
    []
  );

  function updateField<K extends keyof GalleryFormState>(
    key: K,
    value: GalleryFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(selected: File | null) {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selected);

    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  }

  function resetFormFields() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm(initialForm());
    setFile(null);
    setPreviewUrl(null);
  }

  function handleReset() {
    resetFormFields();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateForm(form, file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!file) return;

    setIsUploading(true);

    try {
      const { url, error: uploadError } = await uploadGalleryImage(file);

      if (uploadError || !url) {
        throw new Error(uploadError ?? "Image upload failed.");
      }

      const { entry, error: saveError } = await saveGalleryEntry({
        image_url: url,
        day_number: Number(form.dayNumber),
        pose_type: form.poseType,
        caption: form.caption.trim() || null,
      });

      if (saveError || !entry) {
        throw new Error(saveError ?? "Failed to save gallery entry.");
      }

      toast.success("Photo uploaded successfully");
      resetFormFields();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#D4AF37]/6 blur-[120px]"
      />

      <div className="relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
            Gallery Upload
          </h1>
          <p className="mt-2 text-[#A3A3A3]">
            Upload transformation photos to the public gallery
          </p>
          <Link
            href="/gallery"
            className="mt-4 inline-flex text-sm font-medium text-[#D4AF37] transition-opacity hover:opacity-80"
          >
            View public gallery →
          </Link>
        </header>

        <article
          className={cn(
            "rounded-[24px] border border-[#D4AF37]/25 p-6 sm:p-8",
            "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
            "shadow-[0_0_40px_rgba(212,175,55,0.1)] backdrop-blur-xl"
          )}
        >
          <h2 className="mb-6 text-xl font-bold text-[#F5F5F5]">
            New Gallery Entry
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <FieldLabel htmlFor="image">Image</FieldLabel>
              <label
                htmlFor="image"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl",
                  "border border-dashed border-[#D4AF37]/30 bg-[#0B0B0B]/60 px-6 py-8",
                  "transition-colors duration-300 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
                )}
              >
                {previewUrl ? (
                  <div className="relative mb-4 aspect-[4/5] w-full max-w-xs overflow-hidden rounded-xl border border-[#D4AF37]/20">
                    <Image
                      src={previewUrl}
                      alt="Selected upload preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                    <ImagePlus className="size-6 text-[#D4AF37]" aria-hidden />
                  </div>
                )}

                <p className="text-sm font-medium text-[#F5F5F5]">
                  {file ? file.name : "Click to select an image"}
                </p>
                <p className="mt-1 text-xs text-[#A3A3A3]">
                  JPG, PNG, WebP, or GIF
                </p>

                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="dayNumber">Day Number</FieldLabel>
                <input
                  id="dayNumber"
                  type="number"
                  min={1}
                  step={1}
                  value={form.dayNumber}
                  onChange={(e) => updateField("dayNumber", e.target.value)}
                  placeholder="e.g. 42"
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <FieldLabel htmlFor="poseType">Pose</FieldLabel>
                <select
                  id="poseType"
                  value={form.poseType}
                  onChange={(e) =>
                    updateField("poseType", e.target.value as GalleryPoseType)
                  }
                  className={cn(inputClassName, "cursor-pointer")}
                  required
                >
                  {poseOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#171717]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="caption">Caption</FieldLabel>
              <textarea
                id="caption"
                rows={4}
                value={form.caption}
                onChange={(e) => updateField("caption", e.target.value)}
                placeholder="Optional caption for this photo…"
                className={cn(inputClassName, "resize-none")}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="submit"
                disabled={isUploading}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3.5",
                  "text-sm font-semibold text-[#0B0B0B]",
                  "transition-all duration-300 shadow-[0_0_24px_rgba(212,175,55,0.2)]",
                  "hover:shadow-[0_0_36px_rgba(212,175,55,0.35)]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-4" aria-hidden />
                    Upload
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/40 py-3.5",
                  "text-sm font-semibold text-[#D4AF37]",
                  "transition-all duration-300 hover:bg-[#D4AF37]/10",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <RotateCcw className="size-4" aria-hidden />
                Reset
              </button>
            </div>
          </form>
        </article>
      </div>
    </div>
  );
}

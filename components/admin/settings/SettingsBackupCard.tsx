"use client";

import { useRef, useState } from "react";
import {
  Download,
  Loader2,
  RotateCcw,
  Shield,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  settingsCardClassName,
  settingsPrimaryButtonClassName,
  settingsSecondaryButtonClassName,
} from "@/components/admin/settings/settingsStyles";
import { getDefaultAppSettingsConfig } from "@/lib/defaultAppSettings";
import {
  replaceAppSettingsConfig,
  type AppSettingsConfig,
} from "@/lib/settings";
import { validateAppSettingsConfig } from "@/lib/settingsSchema";
import { cn } from "@/lib/utils";

type SettingsBackupCardProps = {
  settingsId: string;
  config: AppSettingsConfig;
  brandName: string;
};

export default function SettingsBackupCard({
  settingsId,
  config,
  brandName,
}: SettingsBackupCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function handleExport() {
    const payload = JSON.stringify(config, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vg-settings-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Settings exported");
  }

  async function handleImportFile(file: File) {
    setIsImporting(true);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const validation = validateAppSettingsConfig(parsed);

      if (!validation.valid || !validation.config) {
        toast.error("Invalid settings file");
        return;
      }

      const { error } = await replaceAppSettingsConfig(
        settingsId,
        validation.config
      );

      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Settings imported successfully");
      router.refresh();
    } catch {
      toast.error("Invalid settings file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleResetDefaults() {
    setIsResetting(true);

    const { error } = await replaceAppSettingsConfig(
      settingsId,
      getDefaultAppSettingsConfig()
    );

    setIsResetting(false);
    setShowResetConfirm(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("Settings reset to defaults");
    router.refresh();
  }

  return (
    <>
      <article className={cn(settingsCardClassName, "md:col-span-2")}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
            <Shield className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#F5F5F5]">Backup Engine</h2>
            <p className="text-sm text-[#A3A3A3]">
              Export, import, or reset your full {brandName} configuration
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className={settingsPrimaryButtonClassName}
          >
            <span className="inline-flex items-center gap-2">
              <Download className="size-4" aria-hidden />
              Export Settings
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className={settingsSecondaryButtonClassName}
          >
            <span className="inline-flex items-center gap-2">
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Upload className="size-4" aria-hidden />
              )}
              Import Settings
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            className={settingsSecondaryButtonClassName}
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="size-4" aria-hidden />
              Reset Defaults
            </span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImportFile(file);
            }
          }}
        />
      </article>

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0B]/80 px-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !isResetting && setShowResetConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-settings-title"
            className={cn(
              "w-full max-w-md rounded-[24px] border border-[#D4AF37]/25 p-6",
              "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B]/98 to-[#171717]/85",
              "shadow-[0_0_40px_rgba(212,175,55,0.15)]"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="reset-settings-title"
              className="text-lg font-bold text-[#F5F5F5]"
            >
              Reset all settings?
            </h3>
            <p className="mt-2 text-sm text-[#A3A3A3]">
              This restores the default {brandName} configuration. Your current
              settings will be replaced.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className={settingsSecondaryButtonClassName}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleResetDefaults()}
                disabled={isResetting}
                className={settingsPrimaryButtonClassName}
              >
                {isResetting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Resetting…
                  </span>
                ) : (
                  "Reset all settings?"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import type { ResolvedAppSettings } from "@/lib/appSettings";

export type ClientSettingsResponse = ResolvedAppSettings & {
  settingsId: string | null;
  error: string | null;
};

export async function fetchClientSettings(): Promise<ClientSettingsResponse | null> {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });

    if (!response.ok) {
      console.log("SETTINGS LOAD ERROR", response.statusText);
      return null;
    }

    const data = (await response.json()) as ClientSettingsResponse;
    console.log("SETTINGS LOAD SUCCESS", data.config);
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load settings";
    console.log("SETTINGS LOAD ERROR", message);
    return null;
  }
}

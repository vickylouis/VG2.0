import { NextResponse } from "next/server";
import { getResolvedAppSettings } from "@/lib/appSettings";
import { getAppSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [{ data, error }, resolved] = await Promise.all([
    getAppSettings(),
    getResolvedAppSettings(),
  ]);

  return NextResponse.json(
    {
      ...resolved,
      settingsId: data?.id ?? null,
      error,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

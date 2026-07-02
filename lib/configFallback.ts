export function logConfigFallback(
  module: string,
  field: string,
  fallback: unknown
): void {
  console.log("CONFIG FALLBACK USED", { module, field, fallback });
}

export function logConfigOverride(
  module: string,
  field: string,
  value: unknown
): void {
  console.log("CONFIG OVERRIDE APPLIED", { module, field, value });
}

export function readConfigNumber(
  module: string,
  field: string,
  value: unknown,
  fallback: number
): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    logConfigOverride(module, field, value);
    return value;
  }

  logConfigFallback(module, field, fallback);
  return fallback;
}

export function readConfigString(
  module: string,
  field: string,
  value: unknown,
  fallback: string
): string {
  if (typeof value === "string" && value.trim()) {
    logConfigOverride(module, field, value);
    return value;
  }

  logConfigFallback(module, field, fallback);
  return fallback;
}

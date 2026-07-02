const CHECKIN_UPDATED_KEY = "vg20-checkin-updated";
const CHECKIN_UPDATED_EVENT = "vg20-checkin-updated";

/** Call after a successful daily check-in save (client only). */
export function notifyCheckinSaved(): void {
  if (typeof window === "undefined") return;

  const timestamp = Date.now();
  sessionStorage.setItem(CHECKIN_UPDATED_KEY, String(timestamp));
  window.dispatchEvent(
    new CustomEvent(CHECKIN_UPDATED_EVENT, { detail: { timestamp } })
  );
}

export function getCheckinUpdatedAt(): number {
  if (typeof window === "undefined") return 0;
  return Number(sessionStorage.getItem(CHECKIN_UPDATED_KEY) || 0);
}

/**
 * Refetch history (and similar client views) when check-in saves or tab refocuses
 * after a save in another route.
 */
export function subscribeCheckinUpdated(onUpdate: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let lastSeen = getCheckinUpdatedAt();

  const maybeRefresh = () => {
    const timestamp = getCheckinUpdatedAt();
    if (timestamp > lastSeen) {
      lastSeen = timestamp;
      onUpdate();
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      maybeRefresh();
    }
  };

  window.addEventListener(CHECKIN_UPDATED_EVENT, maybeRefresh);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener(CHECKIN_UPDATED_EVENT, maybeRefresh);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

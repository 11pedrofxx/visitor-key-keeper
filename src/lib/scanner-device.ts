export const DEVICE_STORAGE_KEY = "fx-scanner-device-token";

export function lerTokenDispositivo(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEVICE_STORAGE_KEY);
}

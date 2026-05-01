// Native mobile capabilities via Capacitor — safe no-ops on web
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Share } from "@capacitor/share";
import { Preferences } from "@capacitor/preferences";
import { Network } from "@capacitor/network";
import { Device } from "@capacitor/device";
import { Keyboard } from "@capacitor/keyboard";

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform();

// ---------- Haptics ----------
export async function hapticTap(style: "light" | "medium" | "heavy" = "light") {
  if (!isNative()) return;
  try {
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {}
}
export async function hapticSuccess() {
  if (!isNative()) return;
  try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
}
export async function hapticError() {
  if (!isNative()) return;
  try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
}
export async function hapticSelection() {
  if (!isNative()) return;
  try { await Haptics.selectionStart(); await Haptics.selectionEnd(); } catch {}
}

// ---------- Camera ----------
export async function takePhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: isNative() ? CameraSource.Prompt : CameraSource.Photos,
    });
    return photo.dataUrl ?? null;
  } catch {
    return null;
  }
}

// ---------- Notifications ----------
export async function notifyLocal(title: string, body: string) {
  try {
    if (isNative()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") await LocalNotifications.requestPermissions();
      await LocalNotifications.schedule({
        notifications: [{ id: Date.now() % 100000, title, body, schedule: { at: new Date(Date.now() + 100) } }],
      });
    } else if ("Notification" in window) {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") new Notification(title, { body });
    }
  } catch {}
}

export async function registerPushNotifications() {
  if (!isNative()) return null;
  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === "granted") {
      await PushNotifications.register();
      return new Promise<string | null>((resolve) => {
        PushNotifications.addListener("registration", (token) => resolve(token.value));
        PushNotifications.addListener("registrationError", () => resolve(null));
        setTimeout(() => resolve(null), 5000);
      });
    }
  } catch {}
  return null;
}

// ---------- Share ----------
export async function shareContent(title: string, text: string, url?: string) {
  try {
    if (isNative() || (navigator as any).share) {
      await (isNative() ? Share.share({ title, text, url, dialogTitle: title }) : (navigator as any).share({ title, text, url }));
      return true;
    }
    await navigator.clipboard.writeText(text + (url ? `\n${url}` : ""));
    return true;
  } catch { return false; }
}

// ---------- Storage (cross-platform key/value) ----------
export const nativeStore = {
  async get(key: string) {
    if (isNative()) { const r = await Preferences.get({ key }); return r.value; }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string) {
    if (isNative()) await Preferences.set({ key, value });
    else localStorage.setItem(key, value);
  },
  async remove(key: string) {
    if (isNative()) await Preferences.remove({ key });
    else localStorage.removeItem(key);
  },
};

// ---------- Network awareness ----------
export async function getNetworkStatus() {
  try { return await Network.getStatus(); } catch { return { connected: navigator.onLine, connectionType: "unknown" as const }; }
}

// ---------- Device info ----------
export async function getDeviceInfo() {
  try { return await Device.getInfo(); } catch { return null; }
}

// ---------- Boot: configure native shell ----------
export async function initNative() {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0a0a0f" });
  } catch {}
  try { await SplashScreen.hide({ fadeOutDuration: 400 }); } catch {}
  try {
    Keyboard.addListener("keyboardWillShow", () => document.body.classList.add("kb-open"));
    Keyboard.addListener("keyboardWillHide", () => document.body.classList.remove("kb-open"));
  } catch {}
  try {
    Network.addListener("networkStatusChange", (s) => {
      if (!s.connected) notifyLocal("Offline", "MegaKUMUL is offline. Responses will resume when you reconnect.");
    });
  } catch {}
}

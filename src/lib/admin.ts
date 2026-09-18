const storageKey = "daddy-gallery-admin";
const adminPassword = "hello";

export function isAdminSession() {
  try {
    return sessionStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

export function checkAdminPassword(value: string) {
  return value.trim() === adminPassword;
}

export function setAdminSession(on: boolean) {
  try {
    if (on) sessionStorage.setItem(storageKey, "1");
    else sessionStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

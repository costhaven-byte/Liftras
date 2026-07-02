"use client";

/** Tiny PWA helper: service-worker registration + install-prompt capture. */

/* eslint-disable @typescript-eslint/no-explicit-any */
let deferred: any = null;
let started = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((s) => s());

export function initPWA() {
  if (started || typeof window === "undefined") return;
  started = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

export const canInstall = () => !!deferred;

export function promptInstall() {
  if (!deferred) return;
  deferred.prompt();
  deferred = null;
  notify();
}

export function subscribePWA(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

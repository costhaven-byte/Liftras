"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import {
  canInstall,
  initPWA,
  promptInstall,
  subscribePWA,
} from "@/lib/pwa";
import { Button } from "./ui";

/** Mount once (in layout) to register the SW + capture the install prompt. */
export function PWARegister() {
  useEffect(() => initPWA(), []);
  return null;
}

/** Shows only when the browser offers an install prompt (Android/desktop Chrome). */
export function InstallButton() {
  const installable = useSyncExternalStore(
    subscribePWA,
    canInstall,
    () => false,
  );
  if (!installable) return null;
  return (
    <Button variant="soft" size="lg" onClick={promptInstall}>
      <Download size={18} /> Install app
    </Button>
  );
}

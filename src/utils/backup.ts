// src/utils/backup.ts

import { storage } from "./storage";

/**
 * Export all stored data as a JSON Blob.
 * The blob can be downloaded or shared via the Web Share API.
 */
export async function exportData(): Promise<Blob> {
    const keys = await storage.keys();
    const data: Record<string, unknown> = {};
    for (const key of keys) {
        const value = await storage.get(key as any);
        data[key] = value;
    }
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: "application/json" });
}

/**
 * Import data from a JSON file and write each key back to storage.
 * After import, the page is reloaded to apply changes.
 */
export async function importData(file: File): Promise<void> {
    const text = await file.text();
    const data = JSON.parse(text) as Record<string, unknown>;
    const promises = Object.entries(data).map(([key, value]) =>
        // @ts-ignore – storage.set expects generic type, we store raw value
        storage.set(key as any, value as any)
    );
    await Promise.all(promises);
    // Reload to apply new configuration
    window.location.reload();
}

/**
 * Generate a WhatsApp share link containing the base64‑encoded JSON data.
 * This is a fallback for devices that do not support the Web Share API.
 */
export async function getWhatsAppShareLink(): Promise<string> {
    const blob = await exportData();
    const text = await blob.text();
    const base64 = btoa(unescape(encodeURIComponent(text)));
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(base64)}`;
}

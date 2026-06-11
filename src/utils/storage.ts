/**
 * Utility functions for encrypted localStorage storage
 */

// Generate a simple encryption key based on user's session or browser fingerprint
// Note: This is not military-grade encryption, but prevents casual reading
const getEncryptionKey = (): string => {
  // Use a combination of user agent, screen size, and color depth to create a unique key
  // This is not cryptographically secure, but good enough for casual use
  const userAgent = navigator.userAgent;
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  const colorDepth = window.screen.colorDepth;
  return btoa(`${userAgent}-${screenSize}-${colorDepth}`).slice(0, 32);
};

// Simple XOR encryption (obfuscation)
const xorEncrypt = (text: string, key: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const xorDecrypt = (encrypted: string, key: string): string => {
  try {
    const text = atob(encrypted);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return "";
  }
};

// Storage keys to encrypt
const ENCRYPTED_KEYS = new Set([
  "inthra-query-client-state",
  "inthra-threat-hunt-state",
]);

// Clear all Inthra-specific localStorage items
export const clearInthraStorage = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("inthra-")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

// Encrypt and save to localStorage
export const setEncryptedStorage = (key: string, value: any) => {
  try {
    const serializedValue = JSON.stringify(value);
    if (ENCRYPTED_KEYS.has(key)) {
      const encryptionKey = getEncryptionKey();
      const encryptedValue = xorEncrypt(serializedValue, encryptionKey);
      localStorage.setItem(key, encryptedValue);
    } else {
      localStorage.setItem(key, serializedValue);
    }
  } catch (error) {
    console.error("Failed to save to storage:", error);
  }
};

// Load and decrypt from localStorage
export const getEncryptedStorage = <T>(key: string): T | null => {
  try {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) return null;

    if (ENCRYPTED_KEYS.has(key)) {
      const encryptionKey = getEncryptionKey();
      const decryptedValue = xorDecrypt(storedValue, encryptionKey);
      return JSON.parse(decryptedValue) as T;
    } else {
      return JSON.parse(storedValue) as T;
    }
  } catch (error) {
    console.error("Failed to load from storage:", error);
    return null;
  }
};

// Remove from localStorage
export const removeStorage = (key: string) => {
  localStorage.removeItem(key);
};

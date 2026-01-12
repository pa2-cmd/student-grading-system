import CryptoJS from 'crypto-js';

// Encryption key derived from a combination of factors
// In production, this should be derived from user credentials or a secure key management system
const getEncryptionKey = (): string => {
  // Use a combination of browser fingerprint elements for key derivation
  const browserInfo = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ].join('|');
  
  // Create a hash of the browser info as part of the key
  const browserHash = CryptoJS.SHA256(browserInfo).toString().substring(0, 16);
  
  // Combine with a static salt (in production, use environment variable)
  const staticSalt = 'grading-tool-secure-v1';
  
  return CryptoJS.SHA256(browserHash + staticSalt).toString();
};

/**
 * Encrypts data using AES encryption before storing in localStorage
 */
export function encryptData(data: unknown): string {
  const key = getEncryptionKey();
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
}

/**
 * Decrypts data retrieved from localStorage
 */
export function decryptData<T>(encryptedData: string): T | null {
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      return null;
    }
    
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
}

/**
 * Checks if data appears to be encrypted (not valid JSON)
 */
export function isEncrypted(data: string): boolean {
  try {
    JSON.parse(data);
    return false; // Valid JSON = not encrypted
  } catch {
    return true; // Not valid JSON = likely encrypted
  }
}

/**
 * Migrates unencrypted localStorage data to encrypted format
 */
export function migrateToEncrypted(storageKey: string): void {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return;
  
  // Check if data is already encrypted
  if (isEncrypted(stored)) {
    return; // Already encrypted
  }
  
  try {
    // Data is unencrypted JSON, encrypt it
    const data = JSON.parse(stored);
    const encrypted = encryptData(data);
    localStorage.setItem(storageKey, encrypted);
    console.log('Successfully migrated localStorage data to encrypted format');
  } catch (error) {
    console.error('Failed to migrate localStorage data:', error);
  }
}

import { ethers } from "ethers";

const STORAGE_KEY = "authx_wallet_v1";

// ─── Key Generation ───────────────────────────────────────────────

export function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

export function walletFromMnemonic(mnemonic) {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic.trim(),
  };
}

export function walletFromPrivateKey(privateKey) {
  const wallet = new ethers.Wallet(privateKey.trim());
  return {
    address: wallet.address,
    privateKey: privateKey.trim(),
    mnemonic: null,
  };
}

// ─── Encryption (AES-GCM via Web Crypto API) ─────────────────────

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWallet(walletData, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(walletData))
  );
  return {
    encrypted: Array.from(new Uint8Array(encrypted)),
    salt: Array.from(salt),
    iv: Array.from(iv),
    address: walletData.address,
    version: 1,
  };
}

export async function decryptWallet(keystore, password) {
  const salt = new Uint8Array(keystore.salt);
  const iv = new Uint8Array(keystore.iv);
  const encrypted = new Uint8Array(keystore.encrypted);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted));
}

// ─── localStorage ─────────────────────────────────────────────────

export function saveKeystoreToStorage(keystore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keystore));
}

export function loadKeystoreFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function deleteKeystoreFromStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredWallet() {
  return !!localStorage.getItem(STORAGE_KEY);
}

// ─── Download keystore as JSON file ───────────────────────────────

export function downloadKeystore(keystore) {
  const blob = new Blob([JSON.stringify(keystore, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `authx-keystore-${keystore.address.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

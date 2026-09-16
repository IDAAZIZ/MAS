// ============================================================
// e-APRESIASI KKBDA — Secure Auth Credential Vault
// Uses Web Crypto API PBKDF2 with SHA-256 for zero-plaintext security
// ============================================================

export interface AuthCredentialRecord {
  username: string; // lowercase
  salt: string;
  hash: string;
  profile_id?: string;
  userId?: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string;
}

const VAULT_KEY = 'kkbda_auth_vault';

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const authVault = {
  getAll: (): AuthCredentialRecord[] => {
    try {
      const stored = localStorage.getItem(VAULT_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  getByUsername: (username: string): AuthCredentialRecord | undefined => {
    const clean = username.trim().toLowerCase();
    const all = authVault.getAll();
    return all.find((c) => c.username.toLowerCase() === clean);
  },

  save: (cred: AuthCredentialRecord): void => {
    const all = authVault.getAll();
    const clean = cred.username.trim().toLowerCase();
    const filtered = all.filter((c) => c.username.toLowerCase() !== clean);
    filtered.push({
      ...cred,
      username: clean,
      updated_at: new Date().toISOString(),
    });
    localStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
  },

  remove: (username: string): void => {
    const clean = username.trim().toLowerCase();
    const all = authVault.getAll();
    const filtered = all.filter((c) => c.username.toLowerCase() !== clean);
    localStorage.setItem(VAULT_KEY, JSON.stringify(filtered));
  },

  // Initialize bootstrap admin account securely if vault is empty
  initAdminIfNeeded: async (): Promise<void> => {
    const admin = authVault.getByUsername('admin');
    if (!admin) {
      const salt = generateSalt();
      const hash = await hashPassword('admin123', salt);
      authVault.save({
        username: 'admin',
        salt,
        hash,
        profile_id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  },
};
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'bloomx-default-key-change-in-prod';

export async function encryptValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  
  const keyBuffer = encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encrypted: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  
  const keyBuffer = encoder.encode(ENCRYPTION_KEY.slice(0, 32).padEnd(32, '0'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const iv = data.slice(0, 12);
  const encryptedData = data.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encryptedData
  );
  
  return new TextDecoder().decode(decrypted);
}

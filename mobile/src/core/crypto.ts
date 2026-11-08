import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';

const MAGIC = new Uint8Array([0x56, 0x4c, 0x54, 1]);

export function hashHex(bytes: Uint8Array): string { return bytesToHex(sha256(bytes)); }

export function encrypt(bytes: Uint8Array, key: Uint8Array, context: string): Uint8Array {
  if (key.length !== 32) throw new Error('Vault key must be 32 bytes');
  const nonce = globalThis.crypto.getRandomValues(new Uint8Array(24));
  return concatBytes(MAGIC, nonce, xchacha20poly1305(key, nonce, utf8ToBytes(context)).encrypt(bytes));
}

export function decrypt(envelope: Uint8Array, key: Uint8Array, context: string): Uint8Array {
  if (key.length !== 32) throw new Error('Vault key must be 32 bytes');
  if (envelope.length < 44 || !MAGIC.every((byte, index) => envelope[index] === byte)) throw new Error('Invalid vault envelope');
  return xchacha20poly1305(key, envelope.slice(4, 28), utf8ToBytes(context)).decrypt(envelope.slice(28));
}

export function recoveryMessage(owner: string): Uint8Array {
  return utf8ToBytes(`Vaulta vault recovery v1\nNetwork: Solana devnet\nOwner: ${owner}\nThis signature is private encryption material. Never share or publish it. This is not a login.`);
}

export function deriveVaultKey(signature: Uint8Array, owner: string): Uint8Array {
  if (signature.length !== 64) throw new Error('Recovery signature must be 64 bytes');
  return hkdf(sha256, signature, utf8ToBytes('vaulta:recovery:devnet:v1'), utf8ToBytes(`vaulta:root-key:v1:${owner}`), 32);
}

/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { decrypt, deriveVaultKey, encrypt, hashHex, recoveryMessage } from '../src/core/crypto';
import { travelSample } from '../src/core/samples';
import { ManifestSchema } from '../src/core/types';

test('v1 recovery message and derivation cannot change accidentally', () => {
  assert.equal(new TextDecoder().decode(recoveryMessage('test-owner-v1')), 'Vaulta vault recovery v1\nNetwork: Solana devnet\nOwner: test-owner-v1\nThis signature is private encryption material. Never share or publish it. This is not a login.');
  // Public synthetic vector, not a usable wallet secret or real recovery signature.
  assert.equal(bytesToHex(deriveVaultKey(new Uint8Array(64).fill(7), 'test-owner-v1')), 'ccdfebcb41b13b12c065d0947635925d34d39f89d138050fa3d0093f28238a51');
});
test('a fresh signing session recovers the manifest and exact original file bytes', () => {
  const wallet = Keypair.generate(); const owner = wallet.publicKey.toBase58();
  const key = deriveVaultKey(ed25519.sign(recoveryMessage(owner), wallet.secretKey.slice(0, 32)), owner);
  const { item, bytes } = travelSample('b44b6be1-7cae-4d86-83c2-000000000001');
  const ciphertext = encrypt(bytes, key, `vaulta:file:v1:${owner}:${item.id}`);
  const manifest = ManifestSchema.parse({ protocol: 'vaulta-v1', owner, createdAt: new Date().toISOString(), files: [{ item, dataId: 'a'.repeat(43), ciphertextHash: hashHex(ciphertext) }] });
  const encryptedManifest = encrypt(new TextEncoder().encode(JSON.stringify(manifest)), key, `vaulta:manifest:v1:${owner}`);
  key.fill(0);
  const recoveredKey = deriveVaultKey(ed25519.sign(recoveryMessage(owner), wallet.secretKey.slice(0, 32)), owner);
  const recovered = ManifestSchema.parse(JSON.parse(new TextDecoder().decode(decrypt(encryptedManifest, recoveredKey, `vaulta:manifest:v1:${owner}`))));
  assert.equal(recovered.owner, owner); assert.equal(recovered.files[0].ciphertextHash, hashHex(ciphertext));
  const plaintext = decrypt(ciphertext, recoveredKey, `vaulta:file:v1:${owner}:${recovered.files[0].item.id}`);
  assert.deepEqual(plaintext, bytes); assert.equal(hashHex(plaintext), recovered.files[0].item.contentHash);
  assert.throws(() => decrypt(encryptedManifest, deriveVaultKey(new Uint8Array(64).fill(1), owner), `vaulta:manifest:v1:${owner}`));
});

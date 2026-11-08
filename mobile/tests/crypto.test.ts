/// <reference types="node" />

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decrypt, deriveVaultKey, encrypt, hashHex, recoveryMessage } from '../src/core/crypto';

test('authenticated envelopes reject tampering, wrong key and wrong context', () => {
  const key = new Uint8Array(32).fill(7); const data = new TextEncoder().encode('private synthetic document');
  const first = encrypt(data, key, 'vaulta:file:v1:owner:id'); const second = encrypt(data, key, 'vaulta:file:v1:owner:id');
  assert.notDeepEqual(first, second); assert.deepEqual(decrypt(first, key, 'vaulta:file:v1:owner:id'), data);
  assert.throws(() => decrypt(first, new Uint8Array(32), 'vaulta:file:v1:owner:id'));
  assert.throws(() => decrypt(first, key, 'vaulta:file:v1:owner:other'));
  first[first.length - 1] ^= 1; assert.throws(() => decrypt(first, key, 'vaulta:file:v1:owner:id'));
  assert.equal(hashHex(data).length, 64);
});
test('recovery derivation separates owners and warns about signature secrecy', () => {
  const signature = new Uint8Array(64).fill(1);
  assert.notDeepEqual(deriveVaultKey(signature, 'owner1'), deriveVaultKey(signature, 'owner2'));
  assert.match(new TextDecoder().decode(recoveryMessage('owner1')), /private encryption material/i);
  assert.throws(() => deriveVaultKey(new Uint8Array(63), 'owner1'));
});

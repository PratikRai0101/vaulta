/// <reference types="node" />

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { createDataItem } from '../src/core/dataItem';

test('Solana data item has a verified signature, expected ID and ciphertext', async () => {
  const secret = new Uint8Array(32).fill(9); const owner = ed25519.getPublicKey(secret); const data = new Uint8Array([1, 2, 3]);
  let digest = new Uint8Array();
  const item = await createDataItem(data, owner, async (payload) => { digest = Uint8Array.from(payload); return ed25519.sign(payload, secret); });
  assert.deepEqual(item.bytes.slice(0, 2), new Uint8Array([4, 0]));
  assert.deepEqual(item.bytes.slice(66, 98), owner);
  assert.match(new TextDecoder().decode(digest), /^[0-9a-f]{96}$/);
  assert.ok(ed25519.verify(item.bytes.slice(2, 66), digest, owner));
  assert.equal(item.id, Buffer.from(sha256(item.bytes.slice(2, 66))).toString('base64url'));
  assert.deepEqual(item.bytes.slice(-3), data);
});

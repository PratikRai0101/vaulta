/// <reference types="node" />

import { test } from 'node:test';
import assert from 'node:assert/strict';
import bs58 from 'bs58';
import { ed25519 } from '@noble/curves/ed25519.js';
import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { extractVerifiedSignature, recordFromTransaction } from '../src/core/wallet';

const memo = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
test('MWA signed message must contain the original payload and a valid signature', () => {
  const key = Keypair.generate(); const payload = new TextEncoder().encode('synthetic test');
  const sig = ed25519.sign(payload, key.secretKey.slice(0, 32));
  const signed = new Uint8Array([...payload, ...sig]);
  assert.deepEqual(extractVerifiedSignature(signed, payload, key.publicKey.toBase58()), sig);
  signed[0] ^= 1; assert.throws(() => extractVerifiedSignature(signed, payload, key.publicKey.toBase58()));
  assert.throws(() => extractVerifiedSignature(sig, payload, key.publicKey.toBase58()));
});
test('journal accepts a verified owner-signed memo and rejects failures and address-only mentions', () => {
  const owner = Keypair.generate(); const other = Keypair.generate();
  const record = { protocol: 'vaulta-v1', owner: owner.publicKey.toBase58(), manifestId: 'A'.repeat(43), ciphertextHash: 'a'.repeat(64), createdAt: '2026-01-01T00:00:00.000Z' };
  function fixture(signer: Keypair, memoOwnerIsSigner: boolean) {
    const tx = new Transaction({ feePayer: signer.publicKey, recentBlockhash: PublicKey.default.toBase58() }).add(new TransactionInstruction({ programId: memo, keys: [{ pubkey: owner.publicKey, isSigner: memoOwnerIsSigner, isWritable: false }], data: Buffer.from(JSON.stringify(record)) }));
    tx.sign(signer); const message = tx.compileMessage();
    const signature = bs58.encode(tx.signature ?? new Uint8Array());
    return { signature, result: { slot: 1, meta: { fee: 0, preBalances: [], postBalances: [], err: null }, transaction: { message, signatures: [signature] } } };
  }
  const valid = fixture(owner, true);
  assert.equal(recordFromTransaction(record.owner, valid.signature, valid.result)?.manifestId, record.manifestId);
  assert.equal(recordFromTransaction(record.owner, valid.signature, { ...valid.result, meta: { ...valid.result.meta, err: { InstructionError: [0, 'Custom'] } } }), null);
  const mention = fixture(other, false);
  assert.equal(recordFromTransaction(record.owner, mention.signature, mention.result), null);
  const forged = { ...valid.result, transaction: { ...valid.result.transaction, signatures: [bs58.encode(new Uint8Array(64).fill(1))] } };
  assert.equal(recordFromTransaction(record.owner, valid.signature, forged), null);
});

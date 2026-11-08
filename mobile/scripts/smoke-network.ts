/// <reference types="node" />
// Explicit opt-in: creates tiny permanent synthetic ciphertext and a devnet memo.
// It tests the protocol, NOT Android Mobile Wallet Adapter or a real user's wallet.
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'buffer';
import { Keypair, Connection, Transaction, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { z } from 'zod';
import { createDataItem } from '../src/core/dataItem';
import { decrypt, deriveVaultKey, encrypt, hashHex, recoveryMessage } from '../src/core/crypto';
import { downloadCiphertext } from '../src/core/remote';
import { discoverBackups, recordFromTransaction } from '../src/core/wallet';
import { ArweaveIdSchema, ManifestSchema } from '../src/core/types';
import { travelSample } from '../src/core/samples';

if (!process.argv.includes('--live')) throw new Error('Pass --live to authorize tiny permanent synthetic uploads and devnet test transactions.');
const output = path.resolve(process.cwd(), '../.local-build/network-smoke.json');
const wallet = Keypair.generate(); const owner = wallet.publicKey.toBase58();
const rpc = new Connection('https://api.devnet.solana.com', 'confirmed');
const report: Record<string, unknown> = { owner, nativeWallet: 'NOT TESTED', startedAt: new Date().toISOString() };
const save = () => fs.writeFileSync(output, JSON.stringify(report, null, 2));
async function upload(bytes: Uint8Array) {
  const dataItem = await createDataItem(bytes, wallet.publicKey.toBytes(), async payload => ed25519.sign(payload, wallet.secretKey.slice(0, 32)));
  const response = await fetch('https://turbo.ardrive.io/tx/solana', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Uint8Array.from(dataItem.bytes).buffer, signal: AbortSignal.timeout(45_000) });
  if (!response.ok) throw new Error(`Turbo returned HTTP ${response.status}`);
  const result = z.object({ id: ArweaveIdSchema }).parse(await response.json());
  if (result.id !== dataItem.id) throw new Error('Upload data item ID mismatch');
  return result.id;
}
async function main() {
try {
  const airdrop = await rpc.requestAirdrop(wallet.publicKey, 10_000_000);
  await rpc.confirmTransaction(airdrop, 'confirmed'); report.devnetFunding = 'confirmed'; save();
  const signature = ed25519.sign(recoveryMessage(owner), wallet.secretKey.slice(0, 32));
  const key = deriveVaultKey(signature, owner); signature.fill(0);
  const { item, bytes } = travelSample('b44b6be1-7cae-4d86-83c2-000000000001');
  const cipher = encrypt(bytes, key, `vaulta:file:v1:${owner}:${item.id}`);
  const dataId = await upload(cipher);
  const createdAt = new Date().toISOString();
  const manifest = ManifestSchema.parse({ protocol: 'vaulta-v1', owner, createdAt, files: [{ item, dataId, ciphertextHash: hashHex(cipher) }] });
  const encrypted = encrypt(new TextEncoder().encode(JSON.stringify(manifest)), key, `vaulta:manifest:v1:${owner}`);
  const manifestId = await upload(encrypted); key.fill(0);
  const memo = { protocol: 'vaulta-v1', owner, manifestId, ciphertextHash: hashHex(encrypted), createdAt };
  const { context, value: latest } = await rpc.getLatestBlockhashAndContext('confirmed');
  const tx = new Transaction({ feePayer: wallet.publicKey, ...latest }).add(new TransactionInstruction({ programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }], data: Buffer.from(JSON.stringify(memo)) }));
  tx.sign(wallet);
  const transaction = await rpc.sendRawTransaction(tx.serialize(), { minContextSlot: context.slot });
  const confirmation = await rpc.confirmTransaction({ signature: transaction, ...latest }, 'confirmed');
  if (confirmation.value.err) throw new Error('Devnet transaction failed');
  const actual = recordFromTransaction(owner, transaction, await rpc.getTransaction(transaction, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }));
  if (!actual || actual.manifestId !== manifestId) throw new Error('Confirmed owner-signed record could not be verified');
  const discovered = await discoverBackups(owner);
  if (!discovered.records.some(record => record.transaction === transaction)) throw new Error('Wallet history discovery missed the confirmed backup');
  const freshKey = deriveVaultKey(ed25519.sign(recoveryMessage(owner), wallet.secretKey.slice(0, 32)), owner);
  const downloadedManifest = ManifestSchema.parse(JSON.parse(new TextDecoder().decode(decrypt(await downloadCiphertext(manifestId, memo.ciphertextHash), freshKey, `vaulta:manifest:v1:${owner}`))));
  const remote = downloadedManifest.files[0];
  const restored = decrypt(await downloadCiphertext(remote.dataId, remote.ciphertextHash), freshKey, `vaulta:file:v1:${owner}:${item.id}`);
  if (hashHex(restored) !== item.contentHash) throw new Error('Restored bytes do not match');
  freshKey.fill(0); wallet.secretKey.fill(0);
  Object.assign(report, { result: 'PASS', transaction, manifestId, ciphertextHash: memo.ciphertextHash, discovery: 'owner signature verified', recovery: 'fresh signing session restored exact original bytes', finishedAt: new Date().toISOString() }); save(); console.log(JSON.stringify(report, null, 2));
} catch (error) {
  Object.assign(report, { result: 'BLOCKED', error: error instanceof Error ? error.message : 'Unknown network error' }); save(); console.error(JSON.stringify(report, null, 2)); process.exitCode = 1;
}
}
void main();

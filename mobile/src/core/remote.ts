import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
import { hashHex } from './crypto';
import { createDataItem } from './dataItem';
import { ArweaveIdSchema, HashSchema } from './types';
import { signPayload } from './wallet';

const MAX_UPLOAD = 2 * 1024 * 1024;
export async function uploadCiphertext(bytes: Uint8Array, owner: string): Promise<{ id: string }> {
  if (bytes.length > MAX_UPLOAD) throw new Error('Ciphertext exceeds the 2 MiB upload limit');
  const item = await createDataItem(bytes, new PublicKey(owner).toBytes(), (payload) => signPayload(payload, owner));
  const response = await fetch('https://turbo.ardrive.io/tx/solana', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: Uint8Array.from(item.bytes).buffer });
  if (!response.ok) throw new Error(response.status === 402 ? 'Turbo requires payment or more upload credits (HTTP 402)' : `Turbo upload failed (HTTP ${response.status})`);
  const result = z.object({ id: ArweaveIdSchema }).parse(await response.json());
  if (result.id !== item.id) throw new Error('Turbo returned a mismatched data item ID');
  return result;
}
export async function downloadCiphertext(id: string, expectedHash: string): Promise<Uint8Array> {
  ArweaveIdSchema.parse(id); HashSchema.parse(expectedHash);
  let failure = 'Ciphertext unavailable';
  for (const gateway of ['https://turbo-gateway.com/raw', 'https://ar-io.dev/raw', 'https://arweave.net']) {
    try {
      const response = await fetch(`${gateway}/${id}`, { redirect: 'error' });
      if (!response.ok) { failure = `Gateway returned HTTP ${response.status}`; continue; }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > MAX_UPLOAD) throw new Error('Downloaded ciphertext exceeds the 2 MiB limit');
      if (hashHex(bytes) !== expectedHash) throw new Error('Ciphertext hash does not match the signed backup');
      return bytes;
    } catch (error) { failure = error instanceof Error ? error.message : 'Gateway request failed'; }
  }
  throw new Error(failure);
}

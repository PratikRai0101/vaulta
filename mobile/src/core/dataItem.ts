import { sha256, sha384 } from '@noble/hashes/sha2.js';
import { concatBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { Buffer } from 'buffer';

const enc = utf8ToBytes;
const tags = [['Content-Type', 'application/octet-stream'], ['Vaulta-Protocol', 'vaulta-v1']];
function avroLong(value: number): Uint8Array {
  let n = value * 2; const bytes: number[] = [];
  do { const part = n % 128; n = Math.floor(n / 128); bytes.push(part | (n ? 128 : 0)); } while (n);
  return new Uint8Array(bytes);
}
function encodedTags(): Uint8Array {
  const fields = tags.flatMap(([name, value]) => [name, value].flatMap((s) => { const b = enc(s); return [avroLong(b.length), b]; }));
  return concatBytes(avroLong(tags.length), ...fields, avroLong(0));
}
function longLE(value: number): Uint8Array { const result = new Uint8Array(8); new DataView(result.buffer).setUint32(0, value, true); return result; }
function deepHashBlob(bytes: Uint8Array): Uint8Array { return sha384(concatBytes(sha384(enc(`blob${bytes.length}`)), sha384(bytes))); }
function deepHashList(items: Uint8Array[]): Uint8Array {
  return items.reduce((hash, item) => sha384(concatBytes(hash, deepHashBlob(item))), sha384(enc(`list${items.length}`)));
}
export async function createDataItem(data: Uint8Array, owner: Uint8Array, sign: (payload: Uint8Array) => Promise<Uint8Array>): Promise<{ bytes: Uint8Array; id: string }> {
  if (owner.length !== 32) throw new Error('Solana owner must be 32 bytes');
  const tagBytes = encodedTags(); const empty = new Uint8Array();
  const digest = deepHashList([enc('dataitem'), enc('1'), enc('4'), owner, empty, empty, tagBytes, data]);
  // Solana type 4 signs the ASCII hexadecimal representation of the deep hash.
  const signature = await sign(enc(Buffer.from(digest).toString('hex')));
  if (signature.length !== 64) throw new Error('Invalid data item signature');
  const bytes = concatBytes(new Uint8Array([4, 0]), signature, owner, new Uint8Array([0, 0]), longLE(tags.length), longLE(tagBytes.length), tagBytes, data);
  return { bytes, id: Buffer.from(sha256(signature)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
}

import { Directory, File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Buffer } from 'buffer';
import { z } from 'zod';
import { decrypt, encrypt } from './crypto';
import { BackupRecordSchema, ItemSchema, RemoteFileSchema } from './types';

const OwnerSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const IdentitySchema = z.object({ owner: OwnerSchema });
export const IndexSchema = z.object({
  version: z.literal(1), revision: z.number().int().nonnegative(),
  items: z.array(ItemSchema).max(100), uploads: z.array(RemoteFileSchema).max(100),
  confirmed: z.array(RemoteFileSchema).max(100), receipt: BackupRecordSchema.nullable(),
});
export type LocalIndex = z.infer<typeof IndexSchema>;
export const emptyIndex = (): LocalIndex => ({ version: 1, revision: 0, items: [], uploads: [], confirmed: [], receipt: null });
const root = () => { const dir = new Directory(Paths.document, 'vaulta'); dir.create({ intermediates: true, idempotent: true }); return dir; };
const ownerDirectory = (owner: string) => {
  const dir = new Directory(root(), OwnerSchema.parse(owner));
  dir.create({ intermediates: true, idempotent: true }); return dir;
};
const fileFor = (owner: string, id: string) => new File(ownerDirectory(owner), `${z.string().uuid().parse(id)}.vlt`);
const context = (owner: string) => `vaulta:index:v1:${owner}`;

export async function readIdentity(): Promise<string | null> {
  const file = new File(root(), 'identity.json');
  if (!file.exists) return null;
  return IdentitySchema.parse(JSON.parse(await file.text())).owner;
}
export function saveIdentity(owner: string): void {
  new File(root(), 'identity.json').write(JSON.stringify(IdentitySchema.parse({ owner })));
}
export async function protectKey(owner: string, key: Uint8Array): Promise<boolean> {
  if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync()) || !SecureStore.canUseBiometricAuthentication()) return false;
  await SecureStore.setItemAsync(`vaulta.${OwnerSchema.parse(owner)}`, Buffer.from(key).toString('base64'), {
    requireAuthentication: true, keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: 'Protect your Vaulta encryption key',
  });
  return true;
}
export async function readProtectedKey(owner: string): Promise<Uint8Array | null> {
  const encoded = await SecureStore.getItemAsync(`vaulta.${OwnerSchema.parse(owner)}`, { requireAuthentication: true, authenticationPrompt: 'Unlock your Vaulta documents' });
  if (!encoded) return null;
  const key = new Uint8Array(Buffer.from(encoded, 'base64'));
  if (key.length !== 32) throw new Error('Invalid protected vault key. Reconnect the original wallet.');
  return key;
}

// Two encrypted generations preserve the previous index if a write is interrupted.
export async function loadIndex(owner: string, key: Uint8Array): Promise<LocalIndex> {
  const directory = ownerDirectory(owner); const valid: LocalIndex[] = []; let existed = false;
  for (const slot of [0, 1]) {
    const file = new File(directory, `index-${slot}.vlt`);
    if (!file.exists) continue;
    existed = true;
    try { valid.push(IndexSchema.parse(JSON.parse(new TextDecoder().decode(decrypt(await file.bytes(), key, context(owner)))))); } catch { /* The other complete generation may survive an interrupted write. */ }
  }
  if (!valid.length && existed) throw new Error('The encrypted index could not be opened. Reconnect the original wallet or recover its backup; no local files were overwritten.');
  return valid.sort((a, b) => b.revision - a.revision)[0] ?? emptyIndex();
}
export async function saveIndex(owner: string, key: Uint8Array, index: LocalIndex): Promise<LocalIndex> {
  const next = IndexSchema.parse({ ...index, revision: index.revision + 1 });
  const file = new File(ownerDirectory(owner), `index-${next.revision % 2}.vlt`);
  file.write(encrypt(new TextEncoder().encode(JSON.stringify(next)), key, context(owner)));
  const checked = IndexSchema.parse(JSON.parse(new TextDecoder().decode(decrypt(await file.bytes(), key, context(owner)))));
  if (checked.revision !== next.revision) throw new Error('Local index write verification failed');
  return checked;
}
export function writeCiphertext(owner: string, id: string, bytes: Uint8Array): void { fileFor(owner, id).write(bytes); }
export async function readCiphertext(owner: string, id: string): Promise<Uint8Array> { return fileFor(owner, id).bytes(); }
export function clearTemporaryFiles(): void {
  const dir = new Directory(Paths.cache, 'vaulta-open');
  if (dir.exists) dir.delete();
}
export function temporaryFile(id: string, extension: string, bytes: Uint8Array): File {
  const dir = new Directory(Paths.cache, 'vaulta-open'); dir.create({ intermediates: true, idempotent: true });
  const name = `${z.string().uuid().parse(id)}.${z.enum(['pdf','png','jpg','json','bin']).parse(extension)}`;
  const file = new File(dir, name); file.write(bytes); return file;
}

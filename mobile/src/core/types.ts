import { z } from 'zod';

export const CategorySchema = z.enum(['travel', 'membership', 'ticket', 'document']);
export const ItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(180),
  category: CategorySchema,
  mimeType: z.string().min(1).max(150),
  size: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  fields: z.record(z.string(), z.string()),
});
export type VaultItem = z.infer<typeof ItemSchema>;

export const ArweaveIdSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const HashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const RemoteFileSchema = z.object({
  item: ItemSchema,
  dataId: ArweaveIdSchema,
  ciphertextHash: HashSchema,
});
export type RemoteFile = z.infer<typeof RemoteFileSchema>;
export const ManifestSchema = z.object({
  protocol: z.literal('vaulta-v1'),
  owner: z.string().min(32).max(44),
  createdAt: z.string().datetime(),
  files: z.array(RemoteFileSchema).max(100),
});
export type VaultManifest = z.infer<typeof ManifestSchema>;
export const BackupRecordSchema = z.object({
  protocol: z.literal('vaulta-v1'),
  owner: z.string().min(32).max(44),
  manifestId: ArweaveIdSchema,
  ciphertextHash: HashSchema,
  createdAt: z.string().datetime(),
  transaction: z.string().min(64).max(100),
});
export type BackupRecord = z.infer<typeof BackupRecordSchema>;
export type WalletSession = { owner: string; authToken: string };
export type VaultIdentity =
  | { kind: 'wallet'; owner: string }
  | { kind: 'device-only' };
export type VaultStatus =
  | { kind: 'loading' }
  | { kind: 'locked'; identity: VaultIdentity }
  | { kind: 'unlocked'; identity: VaultIdentity };
export type DiscoveryResult = { records: BackupRecord[]; truncated: boolean };

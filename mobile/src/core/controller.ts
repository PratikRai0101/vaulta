import type { BackupRecord, VaultItem, VaultStatus } from './types';

export type IntegrityResult = { matches: boolean; actualHash: string };
export type VaultController = {
  status: VaultStatus;
  items: VaultItem[];
  lastBackup: BackupRecord | null;
  backedUpIds: string[];
  busy: string | null;
  error: string | null;
  preview: boolean;
  connectWallet: (expectedOwner?: string) => Promise<void>;
  enterPreview: () => void;
  unlock: () => Promise<void>;
  lock: () => void;
  importDocument: () => Promise<void>;
  addSamplePass: () => Promise<void>;
  createMembership: (title: string, memberName: string) => Promise<void>;
  backup: () => Promise<void>;
  restore: () => Promise<void>;
  importReceipt: () => Promise<void>;
  inspect: (id: string) => Promise<IntegrityResult | null>;
  open: (id: string) => Promise<void>;
  exportReceipt: () => Promise<void>;
  clearError: () => void;
};

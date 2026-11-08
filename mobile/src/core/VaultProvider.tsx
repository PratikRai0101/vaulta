import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { decrypt, encrypt, hashHex } from './crypto';
import { connectWallet as authorizeWallet, discoverBackups, publishBackup } from './wallet';
import { downloadCiphertext, uploadCiphertext } from './remote';
import * as storage from './storage';
import { previewItems, makeSample, travelSample } from './samples';
import { ItemSchema, ManifestSchema, type BackupRecord, type RemoteFile, type VaultItem, type VaultStatus } from './types';
import type { VaultController } from './controller';

const Context = createContext<VaultController | null>(null);
const encoder = new TextEncoder();
const MAX_FILE_BYTES = 2 * 1024 * 1024 - 44;
const fileContext = (owner: string, id: string) => `vaulta:file:v1:${owner}:${id}`;

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultStatus>({ kind: 'loading' });
  const [items, setItems] = useState<VaultItem[]>([]);
  const [lastBackup, setLastBackup] = useState<BackupRecord | null>(null);
  const [backedUpIds, setBackedUpIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const keyRef = useRef<Uint8Array | null>(null);
  const ownerRef = useRef<string | null>(null);
  const indexRef = useRef(storage.emptyIndex());
  const busyRef = useRef(false);

  const display = (index: storage.LocalIndex) => {
    indexRef.current = index;
    setItems(index.items); setLastBackup(index.receipt);
    setBackedUpIds(index.confirmed.filter(remote => index.items.some(item => item.id === remote.item.id && item.contentHash === remote.item.contentHash)).map(remote => remote.item.id));
  };
  const lock = () => {
    if (busyRef.current) return;
    keyRef.current?.fill(0); keyRef.current = null;
    indexRef.current = storage.emptyIndex(); setItems([]); setLastBackup(null); setBackedUpIds([]); setPreview(false);
    storage.clearTemporaryFiles();
    setStatus({ kind: 'locked', identity: ownerRef.current ? { kind: 'wallet', owner: ownerRef.current } : { kind: 'device-only' } });
  };
  useEffect(() => {
    storage.clearTemporaryFiles();
    void storage.readIdentity().then(owner => {
      ownerRef.current = owner; setStatus({ kind: 'locked', identity: owner ? { kind: 'wallet', owner } : { kind: 'device-only' } });
    }).catch(() => { setStatus({ kind: 'locked', identity: { kind: 'device-only' } }); setError('Local identity could not be read. Reconnect the original wallet to reopen its encrypted files.'); });
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => { if (busyRef.current) timer = setTimeout(check, 30_000); else lock(); };
    const subscription = AppState.addEventListener('change', state => {
      clearTimeout(timer); if (state !== 'active') timer = setTimeout(check, 30_000);
    });
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);

  async function run<T>(label: string, action: () => Promise<T>): Promise<T | null> {
    if (busyRef.current) return null;
    busyRef.current = true; setBusy(label); setError(null);
    try { return await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'The operation could not be completed. Your local encrypted files were kept.'); return null; }
    finally { busyRef.current = false; setBusy(null); }
  }
  const active = () => {
    if (preview || !keyRef.current || !ownerRef.current) throw new Error('Connect and unlock your wallet first. Preview cannot store personal files or perform network operations.');
    return { key: keyRef.current, owner: ownerRef.current };
  };
  const commit = async (index: storage.LocalIndex) => {
    const { key, owner } = active(); display(await storage.saveIndex(owner, key, index));
  };
  const install = async (owner: string, key: Uint8Array, cache: boolean) => {
    try {
      const index = await storage.loadIndex(owner, key);
      const protectedOnDevice = cache ? await storage.protectKey(owner, key) : true;
      storage.saveIdentity(owner); keyRef.current?.fill(0); keyRef.current = key; ownerRef.current = owner;
      setPreview(false); display(index); setStatus({ kind: 'unlocked', identity: { kind: 'wallet', owner } });
      if (!protectedOnDevice) Alert.alert('Wallet unlock required after restart', 'No enrolled biometric protection is available. Your encryption key will not be stored unprotected. Encrypted files remain here; reconnect the same wallet after restarting.');
    } catch (cause) { key.fill(0); throw cause; }
  };
  const connectWallet = async () => { await run('Connecting wallet and deriving private key…', async () => {
    const result = await authorizeWallet(); await install(result.session.owner, result.key, true);
  }); };
  const unlock = async () => { await run('Unlocking encrypted vault…', async () => {
    const owner = ownerRef.current;
    if (!owner) throw new Error('Connect your wallet to create a vault.');
    const cached = await storage.readProtectedKey(owner);
    if (cached) return install(owner, cached, false);
    const result = await authorizeWallet();
    if (result.session.owner !== owner) { result.key.fill(0); throw new Error('Use the same wallet account that owns this local vault.'); }
    await install(owner, result.key, true);
  }); };
  const enterPreview = () => {
    if (busyRef.current) return;
    keyRef.current?.fill(0); keyRef.current = null; setError(null); setPreview(true); setItems(previewItems); setBackedUpIds([]); setLastBackup(null);
    setStatus({ kind: 'unlocked', identity: { kind: 'device-only' } });
  };
  const saveDocument = async (item: VaultItem, bytes: Uint8Array) => {
    const { key, owner } = active();
    if (indexRef.current.items.length >= 100) throw new Error('This first version supports up to 100 items.');
    if (bytes.length > MAX_FILE_BYTES) throw new Error('This first version supports files under 2 MiB, including encryption overhead.');
    storage.writeCiphertext(owner, item.id, encrypt(bytes, key, fileContext(owner, item.id)));
    await commit({ ...indexRef.current, items: [...indexRef.current.items, ItemSchema.parse(item)] });
  };
  const importDocument = async () => { await run('Importing and encrypting file…', async () => {
    active();
    const selection = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (selection.canceled) return;
    const asset = selection.assets[0]; if (!asset) return;
    const source = new File(asset.uri);
    try {
      if (source.size > MAX_FILE_BYTES) throw new Error('Choose a file under 2 MiB for this version. Larger documents remain untouched.');
      const bytes = await source.bytes();
      const item = ItemSchema.parse({ id: Crypto.randomUUID(), title: asset.name.slice(0, 180) || 'Document', category: 'document', mimeType: asset.mimeType || 'application/octet-stream', size: bytes.length, createdAt: new Date().toISOString(), contentHash: hashHex(bytes), fields: {} });
      await saveDocument(item, bytes);
    } finally { if (source.exists && source.uri.startsWith(`${Paths.cache.uri.replace(/\/$/, '')}/`)) source.delete(); }
  }); };
  const addSamplePass = async () => { await run('Saving encrypted sample pass…', async () => {
    const sample = travelSample(Crypto.randomUUID()); await saveDocument({ ...sample.item, createdAt: new Date().toISOString() }, sample.bytes);
  }); };
  const createMembership = async (title: string, memberName: string) => { await run('Creating encrypted membership…', async () => {
    const cleanTitle = title.trim(), cleanName = memberName.trim();
    if (!cleanTitle || !cleanName || cleanTitle.length > 100 || cleanName.length > 100) throw new Error('Enter a title and name, each under 100 characters.');
    const id = Crypto.randomUUID();
    const sample = makeSample(id, 'membership', cleanTitle, { clubName: cleanTitle, memberName: cleanName, memberId: id.slice(0, 8), code: JSON.stringify({ protocol: 'vaulta-pass-v1', id, title: cleanTitle, member: cleanName }), sample: 'false', selfCreated: 'true' });
    await saveDocument({ ...sample.item, createdAt: new Date().toISOString() }, sample.bytes);
  }); };
  const plaintext = async (item: VaultItem) => {
    const { key, owner } = active();
    return decrypt(await storage.readCiphertext(owner, item.id), key, fileContext(owner, item.id));
  };
  const inspect = async (id: string) => run('Authenticating encrypted bytes…', async () => {
    const item = indexRef.current.items.find(value => value.id === id); if (!item) throw new Error('Saved item not found. Preview does not perform an integrity check.');
    const actualHash = hashHex(await plaintext(item)); return { matches: actualHash === item.contentHash, actualHash };
  });
  const open = async (id: string) => { await run('Opening decrypted copy…', async () => {
    const item = indexRef.current.items.find(value => value.id === id); if (!item) throw new Error('This preview is not a saved file.');
    const bytes = await plaintext(item); if (hashHex(bytes) !== item.contentHash) throw new Error('File integrity check failed. No plaintext was opened.');
    const extension = item.mimeType === 'application/pdf' ? 'pdf' : item.mimeType === 'image/png' ? 'png' : item.mimeType === 'image/jpeg' ? 'jpg' : item.mimeType === 'application/json' ? 'json' : 'bin';
    const file = storage.temporaryFile(item.id, extension, bytes);
    if (await file.canPreview({ mimeType: item.mimeType })) await file.preview({ title: item.title, mimeType: item.mimeType });
    else if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: item.mimeType, dialogTitle: 'Export a decrypted copy — outside Vaulta protection' });
    else throw new Error('No native viewer is available for this file type.');
  }); };
  const backup = async () => { await run('Preparing encrypted backup…', async () => {
    const { key, owner } = active(); const snapshot = indexRef.current.items;
    if (!snapshot.length) throw new Error('Add a pass or document before backing up.');
    const files: RemoteFile[] = [];
    for (const [position, item] of snapshot.entries()) {
      setBusy(`Backing up encrypted item ${position + 1} of ${snapshot.length}…`);
      let remote = indexRef.current.uploads.find(value => value.item.id === item.id && value.item.contentHash === item.contentHash);
      if (!remote) {
        const ciphertext = await storage.readCiphertext(owner, item.id);
        const verified = decrypt(ciphertext, key, fileContext(owner, item.id));
        if (hashHex(verified) !== item.contentHash) throw new Error('Local integrity check failed. The backup was stopped.');
        const uploaded = await uploadCiphertext(ciphertext, owner);
        remote = { item, dataId: uploaded.id, ciphertextHash: hashHex(ciphertext) };
        await commit({ ...indexRef.current, uploads: [...indexRef.current.uploads.filter(value => value.item.id !== item.id), remote] });
      }
      files.push(remote);
    }
    const createdAt = new Date().toISOString();
    const manifest = ManifestSchema.parse({ protocol: 'vaulta-v1', owner, createdAt, files });
    const encrypted = encrypt(encoder.encode(JSON.stringify(manifest)), key, `vaulta:manifest:v1:${owner}`);
    setBusy('Uploading encrypted manifest…'); const uploaded = await uploadCiphertext(encrypted, owner);
    setBusy('Sign the Solana backup record in your wallet…');
    const receipt = await publishBackup({ owner, manifestId: uploaded.id, ciphertextHash: hashHex(encrypted), createdAt });
    await commit({ ...indexRef.current, receipt, confirmed: files });
    Alert.alert('Backup confirmed on devnet', 'Your wallet signed the recovery index. Turbo accepted the encrypted data; Arweave settlement can take longer. Export the public recovery receipt as an extra locator.');
  }); };
  const restore = async () => { await run('Discovering your wallet-owned backups…', async () => {
    const { key, owner } = active(); const discovery = await discoverBackups(owner);
    if (!discovery.records.length) throw new Error(discovery.truncated ? 'No backup found in the first 500 transactions. More history exists; this is not proof that your vault has no backup.' : 'No valid Vaulta backup was found in the available devnet history. Devnet can reset.');
    const receipt = discovery.records[0];
    const encrypted = await downloadCiphertext(receipt.manifestId, receipt.ciphertextHash);
    const manifest = ManifestSchema.parse(JSON.parse(new TextDecoder().decode(decrypt(encrypted, key, `vaulta:manifest:v1:${owner}`))));
    if (manifest.owner !== owner || manifest.createdAt !== receipt.createdAt) throw new Error('The encrypted manifest does not match the wallet-owned record.');
    const uniqueIds = new Set(manifest.files.map(remote => remote.item.id));
    if (uniqueIds.size !== manifest.files.length) throw new Error('The backup contains duplicate item identifiers.');
    for (const [position, remote] of manifest.files.entries()) {
      setBusy(`Recovering encrypted item ${position + 1} of ${manifest.files.length}…`);
      const existing = indexRef.current.items.find(item => item.id === remote.item.id);
      if (existing && existing.contentHash !== remote.item.contentHash) throw new Error('A local item conflicts with this snapshot. Nothing in the local index was replaced.');
      const bytes = await downloadCiphertext(remote.dataId, remote.ciphertextHash);
      const plain = decrypt(bytes, key, fileContext(owner, remote.item.id));
      if (hashHex(plain) !== remote.item.contentHash || plain.length !== remote.item.size) throw new Error('A recovered file failed its authenticated integrity check.');
      storage.writeCiphertext(owner, remote.item.id, bytes);
    }
    const localOnly = indexRef.current.items.filter(item => !uniqueIds.has(item.id));
    const uploads = [...indexRef.current.uploads.filter(remote => !uniqueIds.has(remote.item.id)), ...manifest.files];
    await commit({ ...indexRef.current, items: [...localOnly, ...manifest.files.map(remote => remote.item)], uploads, confirmed: manifest.files, receipt });
    Alert.alert('Vault recovered', `${manifest.files.length} authenticated items recovered. Local-only items were kept.${discovery.truncated ? ' More transaction history exists; only the first 500 transactions were scanned.' : ''}`);
  }); };
  const exportReceipt = async () => { await run('Exporting public recovery receipt…', async () => {
    active(); const receipt = indexRef.current.receipt; if (!receipt) throw new Error('No confirmed backup receipt is available.');
    const file = storage.temporaryFile(Crypto.randomUUID(), 'json', encoder.encode(JSON.stringify(receipt, null, 2)));
    if (!(await Sharing.isAvailableAsync())) throw new Error('Native file sharing is not available.');
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Public backup locator — not a decryption key' });
  }); };
  const controller: VaultController = { status, items, lastBackup, backedUpIds, busy, error, preview, connectWallet, enterPreview, unlock, lock, importDocument, addSamplePass, createMembership, backup, restore, inspect, open, exportReceipt, clearError: () => setError(null) };
  return <Context.Provider value={controller}>{children}</Context.Provider>;
}
export function useVault(): VaultController {
  const value = useContext(Context); if (!value) throw new Error('VaultProvider is required'); return value;
}

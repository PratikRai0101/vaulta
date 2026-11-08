import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { ed25519 } from '@noble/curves/ed25519.js';
import { Connection, Message, PublicKey, Transaction, TransactionInstruction, clusterApiUrl } from '@solana/web3.js';
import type { Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { deriveVaultKey, recoveryMessage } from './crypto';
import { BackupRecordSchema, type BackupRecord, type DiscoveryResult, type WalletSession } from './types';

const identity = { name: 'Vaulta', uri: 'https://vaulta.app' };
const memoProgram = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const connection = () => new Connection(clusterApiUrl('devnet'), 'confirmed');
let authToken: string | undefined;

async function withWallet<T>(fn: (wallet: Web3MobileWallet) => Promise<T>): Promise<T> {
  const { Platform } = await import('react-native');
  if (Platform.OS !== 'android') throw new Error('Mobile Wallet Adapter is only available on Android');
  const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
  return transact(fn);
}
async function authorize(wallet: Web3MobileWallet, expected?: string) {
  const result = await wallet.authorize({ chain: 'solana:devnet', identity, ...(authToken ? { auth_token: authToken } : {}) });
  const account = expected
    ? result.accounts.find((entry) => new PublicKey(Buffer.from(entry.address, 'base64')).toBase58() === expected)
    : result.accounts[0];
  if (!account) throw new Error('Wallet did not authorize the expected account');
  const owner = new PublicKey(Buffer.from(account.address, 'base64')).toBase58();
  authToken = result.auth_token;
  return { owner, address: account.address, authToken: result.auth_token };
}
export function extractVerifiedSignature(signed: Uint8Array, payload: Uint8Array, owner: string): Uint8Array {
  if (signed.length !== payload.length + 64 || !payload.every((byte, index) => signed[index] === byte)) throw new Error('Wallet returned an invalid signed message');
  const signature = signed.slice(payload.length);
  if (!ed25519.verify(signature, payload, new PublicKey(owner).toBytes())) throw new Error('Wallet message signature verification failed');
  return signature;
}
async function sign(wallet: Web3MobileWallet, payload: Uint8Array, owner: string, address: string): Promise<Uint8Array> {
  const result = await wallet.signMessages({ addresses: [address], payloads: [payload] });
  if (result.length !== 1) throw new Error('Wallet returned an unexpected number of signed messages');
  return extractVerifiedSignature(result[0], payload, owner);
}
export async function connectWallet(): Promise<{ session: WalletSession; key: Uint8Array }> {
  return withWallet(async (wallet) => {
    const account = await authorize(wallet); const message = recoveryMessage(account.owner);
    const first = await sign(wallet, message, account.owner, account.address);
    const second = await sign(wallet, message, account.owner, account.address);
    if (!first.every((byte, index) => byte === second[index])) throw new Error('Wallet signatures are not repeatable; recovery is unavailable');
    const key = deriveVaultKey(first, account.owner); first.fill(0); second.fill(0);
    return { session: { owner: account.owner, authToken: account.authToken }, key };
  });
}
export async function signPayload(payload: Uint8Array, owner: string): Promise<Uint8Array> {
  return withWallet(async (wallet) => { const account = await authorize(wallet, owner); return sign(wallet, payload, owner, account.address); });
}

// Legacy messages are the only journal format Vaulta publishes. Verify the signature and
// require the owner in the memo instruction's signer accounts, not just in the transaction.
export function recordFromTransaction(owner: string, signature: string, result: Awaited<ReturnType<Connection['getTransaction']>>): BackupRecord | null {
  if (!result || !result.meta || result.meta.err || result.transaction.signatures[0] !== signature || !(result.transaction.message instanceof Message)) return null;
  const message = result.transaction.message;
  const ownerIndex = message.accountKeys.findIndex((key) => key.toBase58() === owner);
  if (ownerIndex < 0 || ownerIndex >= message.header.numRequiredSignatures) return null;
  const sig = result.transaction.signatures[ownerIndex];
  try {
    if (!sig || !ed25519.verify(bs58.decode(sig), message.serialize(), new PublicKey(owner).toBytes())) return null;
    for (const instruction of message.instructions) {
      if (!message.accountKeys[instruction.programIdIndex]?.equals(memoProgram) || !instruction.accounts.includes(ownerIndex)) continue;
      const decoded: unknown = JSON.parse(Buffer.from(bs58.decode(instruction.data)).toString('utf8'));
      const parsed = BackupRecordSchema.safeParse({ ...(typeof decoded === 'object' && decoded !== null ? decoded : {}), transaction: signature });
      if (parsed.success && parsed.data.owner === owner) return parsed.data;
    }
  } catch { return null; }
  return null;
}
export async function publishBackup(input: Omit<BackupRecord, 'protocol' | 'transaction'>): Promise<BackupRecord> {
  const record = BackupRecordSchema.omit({ transaction: true }).parse({ ...input, protocol: 'vaulta-v1' });
  const rpc = connection(); const latest = await rpc.getLatestBlockhash('confirmed');
  const owner = new PublicKey(record.owner);
  const transaction = new Transaction({ feePayer: owner, ...latest }).add(new TransactionInstruction({
    programId: memoProgram, keys: [{ pubkey: owner, isSigner: true, isWritable: false }], data: Buffer.from(JSON.stringify(record), 'utf8'),
  }));
  const signature = await withWallet(async (wallet) => {
    await authorize(wallet, record.owner);
    const signatures = await wallet.signAndSendTransactions({ transactions: [transaction], commitment: 'confirmed' });
    if (signatures.length !== 1) throw new Error('Wallet returned an unexpected transaction result');
    return signatures[0];
  });
  const confirmation = await rpc.confirmTransaction({ signature, ...latest }, 'confirmed');
  if (confirmation.value.err) throw new Error('Backup transaction failed on Solana devnet');
  const confirmed = await rpc.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  const actual = recordFromTransaction(record.owner, signature, confirmed);
  if (!actual || actual.manifestId !== record.manifestId || actual.ciphertextHash !== record.ciphertextHash || actual.createdAt !== record.createdAt) throw new Error('Confirmed transaction did not contain the expected owner-signed backup');
  return actual;
}
export async function discoverBackups(owner: string): Promise<DiscoveryResult> {
  const rpc = connection(); const address = new PublicKey(owner); const records: BackupRecord[] = [];
  const pageSize = 100; const maxPages = 5; let before: string | undefined; let truncated = false;
  for (let page = 0; page < maxPages; page++) {
    const entries = await rpc.getSignaturesForAddress(address, { limit: pageSize, ...(before ? { before } : {}) }, 'confirmed');
    const successful = entries.filter((entry) => !entry.err);
    for (const entry of successful) {
      const tx = await rpc.getTransaction(entry.signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
      if (!tx) throw new Error('Transaction history is unavailable; discovery cannot be completed');
      const record = recordFromTransaction(owner, entry.signature, tx); if (record) records.push(record);
    }
    if (entries.length < pageSize) break;
    before = entries[entries.length - 1].signature;
    if (page === maxPages - 1) truncated = true;
  }
  return { records, truncated };
}

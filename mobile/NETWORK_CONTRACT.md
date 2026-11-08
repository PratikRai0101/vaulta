# Implementation contract

These exports are the seam between native state and pure/network code. `types.ts` and `controller.ts` belong to the parent integration work; do not change their public shape without reporting it.

## Crypto (`src/core/crypto.ts`)

```ts
hashHex(bytes: Uint8Array): string
encrypt(bytes: Uint8Array, key: Uint8Array, context: string): Uint8Array
decrypt(envelope: Uint8Array, key: Uint8Array, context: string): Uint8Array
recoveryMessage(owner: string): Uint8Array
deriveVaultKey(signature: Uint8Array, owner: string): Uint8Array
```

Use XChaCha20-Poly1305 with a fresh 24-byte OS-random nonce, a versioned binary envelope and UTF-8 context as associated data. Root keys are 32 bytes. HKDF-SHA256 derives the root from the verified 64-byte Ed25519 signature and owner/domain separation. Recovery message is fixed, versioned, includes owner and devnet, and explicitly says its signature is private encryption material, not login. Never publish that signature. Crypto remains runnable under Node without React Native.

Contexts: `vaulta:index:v1:${owner}`, `vaulta:file:v1:${owner}:${id}`, `vaulta:manifest:v1:${owner}`. File UUID is stable across snapshots.

## Wallet (`src/core/wallet.ts`)

```ts
connectWallet(): Promise<{ session: WalletSession; key: Uint8Array }>
signPayload(payload: Uint8Array, owner: string): Promise<Uint8Array>
publishBackup(input: Omit<BackupRecord, 'protocol' | 'transaction'>): Promise<BackupRecord>
discoverBackups(owner: string): Promise<DiscoveryResult>
```

Android Mobile Wallet Adapter, web3.js 1.99.0. Lazy platform guard keeps iOS preview working. Each privileged operation must authorize and check the actual account equals expected owner. Auth token may be cached in memory only. Never receive a wallet seed. Verify returned raw Ed25519 signatures; handle the actual MWA signed-message representation. Connect signs the exact recovery message twice and refuses non-repeatability. Tests do not establish cross-device compatibility.

A memo contains protocol/owner/manifest ID/ciphertext SHA-256/created time, never filenames, plaintext hashes or derivation signatures. The transaction must require the owner to sign. Publish returns only after RPC success, with commitment stated honestly. Discovery validates successful transactions and owner signature, not merely an address mention. Bound history scans and return `truncated: true` when history remains. Do not treat a partial scan as an exhaustive empty vault.

## Remote (`src/core/remote.ts`)

```ts
uploadCiphertext(bytes: Uint8Array, owner: string): Promise<{ id: string }>
downloadCiphertext(id: string, expectedHash: string): Promise<Uint8Array>
```

Upload to production Arweave via Turbo. A small ANS-104 Solana data item implementation is acceptable if tested against the real service; no Node crypto/filesystem shims in the mobile bundle. `signPayload` is for public upload signatures, NEVER the recovery signature. Public tags are only protocol/content type, no document metadata. Enforce an explicit reasonable upload limit and report HTTP 402/limits truthfully. Do not promise free unlimited storage or chunk to evade pricing. Actual payment/top-up can remain documented if services demand it. Download verifies the chain-committed ciphertext hash before returning bytes. Gateway fallback is allowed; arbitrary redirects from untrusted manifests are not.

## Native controller

`useVault()` is supplied by `src/core/VaultProvider.tsx` (parent owned) and returns `VaultController` in `controller.ts`. Async UI actions are caught centrally and set `error`; UI can invoke them with `void`. `inspect()` returns a result or null on failure. Preview mode is synthetic, cannot import personal documents, and cannot back up or claim network success. Preview should be explicitly labelled.

Travel field names: `airline`, `flight`, `from`, `to`, `fromCity`, `toCity`, `date`, `boarding`, `departure`, `gate`, `seat`, `passenger`, `booking`, `code`, `sample` (`true` on synthetic passes). Membership uses `clubName`, `memberName`, `memberId`, `code`, `sample`.

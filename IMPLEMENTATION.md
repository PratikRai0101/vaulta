# Vaulta implementation plan

Deadline: 8 November 2026, 22:15 IST. Android is the submission target. iOS is a native UI preview; Mobile Wallet Adapter is Android-only.

## Checklist

- [x] Ground: greenfield Expo SDK 58 project; approved Close-up design; actual dependency versions queried.
- [x] Sketch and select the smallest end-to-end architecture below.
- [x] Implement authenticated encryption and boundary schemas, with real tests.
- [x] Implement wallet custody boundary, Turbo upload and Solana-owned recovery discovery.
- [x] Implement encrypted local vault and native UI.
- [x] Produce and exercise an Android APK; real-phone and funded on-chain tests remain separate gates.
- [x] Publish storage/recovery nuances and limitations. Final demo steps and release publication are in progress.

## Caller usage

The UI asks one vault controller to connect/unlock, import, open, back up or recover. It never receives a wallet private key or raw derivation signature. Network adapters own protocol details. Storage owns encrypted files and metadata. The UI receives display items and confirmed backup receipts, not RPC objects.

## Two candidate shapes

A. A deployed PDA registry and independent random vault key, with wallet-authorized key envelopes and a separate recovery secret. This gives constant-time discovery and explicit revisions, but needs a deployed program, additional build/deployment infrastructure and more key-recovery UX.

B. A wallet-signed Solana memo journal indexing encrypted Arweave snapshots, with a domain-separated signature-derived vault key. This needs no trusted application server or custom deployed program. It exposes RPC history retention and deterministic-signing assumptions, which must be explicit.

B is selected for the hackathon. Solana is the ownership and recovery control plane, not an ornamental hash field: the app can discover valid snapshots from the wallet's transaction history and reject unsigned/failed/foreign records. Arweave stores authenticated ciphertext. Public records never contain filenames, plaintext document hashes, keys or derivation signatures. Confirmed ciphertext hashes bind downloaded snapshots to wallet-signed records. There is no issuer-authenticity claim.

The production alternative remains A with an independently backed-up recovery secret. The architecture-review skill's default Claude runners are unavailable in this environment; this short local comparison is not represented as a multi-model architecture review.

## Responsibility map

- `mobile/src/core/types.ts`: schema-derived item, manifest, session and backup contracts.
- `mobile/src/core/crypto.ts`: authenticated encryption, domain-separated key derivation and ciphertext hashing; no React Native dependency.
- `mobile/src/core/remote.ts`: ANS-104/Turbo upload and verified download, with explicit size/payment failures.
- `mobile/src/core/wallet.ts`: Android Mobile Wallet Adapter and Solana signed-index publishing/discovery.
- `mobile/src/core/storage.ts`: protected key, encrypted local metadata and files; temporary plaintext only for explicit opening.
- `mobile/src/core/VaultProvider.tsx`: one writer for local state; orchestrates complete operations and truthful pending/error states.
- `mobile/src/app/`: native Router screens and approved visual direction. No WebView.

## Security and delivery constraints

Use synthetic demos. Never collect seed phrases. Derivation signatures are sensitive encryption material, never authentication/public-proof payloads. Compare repeated signatures before claiming recovery support; cross-wallet/device repeatability still needs device testing. Biometric key protection may be unavailable on simulators. No silent fallback from protected key storage. Encrypted Arweave data cannot be reliably deleted and may outlive the current cipher. Devnet history can reset; exported public backup receipts are a separate recovery locator, not a decryption secret.

Uploads and transactions may fail independently. Do not mark a snapshot backed up before a successful Solana confirmation. Keep local documents usable after upload failure. Hashes cannot restore missing ciphertext. History pagination must be bounded and report truncation, not pretend an incomplete scan found no backups.

## Implementation reconciliation

Accepted by the parent implementation owner under the user's simplicity and deadline constraint:

- Encrypted JSON with two index generations replaces planned SQLCipher for the bounded 100-item vault. Both file contents and metadata remain authenticated ciphertext. SDK58 file writes are asynchronous and are awaited. Type-aware lint rejects forgotten promises.
- XChaCha20-Poly1305 is the authenticated cipher. It uses a versioned envelope and random 24-byte nonces rather than adding a native cipher binding.
- Added `importReceipt()` to the controller and restore screen. Imported locators authenticate content under the wallet-derived key without claiming current chain confirmation. This provides a fallback when devnet history disappears.
- The first Android preview test found a missing `expo-symbols` dependency. A direct import now makes the dependency required at bundle time. The regression check verifies the Vaulta package before every UI interaction and refuses another foreground app.
- The first-release binary uses an ARM64 local development certificate. It is not a Play Store signing configuration.

Native reference-wallet authorization, two repeatable signing requests, encrypted local save, and an actual byte-integrity inspection passed on the Android emulator. Solflare, physical-device biometrics, and a funded on-chain confirmation are not inferred from that result. The RPC faucet rejected the live protocol test with HTTP410 and directed funding to faucet.solana.com.

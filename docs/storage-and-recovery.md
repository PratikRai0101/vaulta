# How Vaulta stores and recovers files

Vaulta separates private contents from public ownership records. A wallet address identifies a vault, but the address alone cannot decrypt it.

## What stays on your phone

Vaulta encrypts each file with XChaCha20-Poly1305 before writing it to the app's private directory. Every envelope has a format version, a fresh 24-byte nonce, and an authentication tag. Associated data binds the ciphertext to the owner and file identifier.

Filenames, content hashes, pass fields, upload pointers, and receipt metadata live in an encrypted index. Two index generations preserve the previous readable version if a write is interrupted. For the first-pass limit of 100 items, an encrypted JSON index is smaller and simpler than a database. The app awaits native file writes before reporting an item saved.

The current wallet address is a public local identity pointer. File counts, ciphertext sizes, and opaque filenames remain observable to someone with filesystem access. Encryption does not hide every activity pattern.

If enrolled biometric protection is available, Expo SecureStore protects a cached encryption key on that device. The key is not stored unprotected when biometrics are unavailable. In that case, reconnect the wallet after a restart. Lock clears active application state and the in-memory key. Background lock waits 30 seconds and defers while an authorized operation, such as a wallet handoff, is in progress.

Opening a file requires decryption. The app writes a temporary plaintext copy for the native viewer or share sheet. Lock and startup remove Vaulta's temporary copies. Another app can keep an exported copy, and flash storage does not guarantee secure erasure. This first version does not block screenshots or screen recording. The original source file remains outside Vaulta's control.

## What goes to Arweave

A backup contains authenticated ciphertext for each file and a separate encrypted manifest. The manifest contains the private filenames, file hashes, and download references. Public upload tags contain only the application protocol and content type.

Turbo receives signed Solana ANS-104 data items. Upload signatures are public and unrelated to the private recovery signature. A successful upload response means Turbo accepted the data. Bundling and settlement on Arweave can take longer.

Arweave is permanent storage. Deleting a phone, an application account, or a local file cannot reliably remove an uploaded ciphertext. Future cipher failures, wallet compromise, or leaked recovery signatures can expose old backups. Do not use this prototype for personal IDs or other high-impact secrets.

Small uploads may qualify for a service allowance. There is no unlimited-free-storage promise. Larger uploads can require Turbo credits. This version reports payment-required responses and does not provide a top-up flow or split files to evade pricing.

## What goes to Solana

The public Memo record contains the protocol version, wallet owner, encrypted manifest ID, ciphertext SHA-256 digest, application timestamp, and transaction signature. It does not contain filenames, plaintext document hashes, file contents, or the recovery signature.

The wallet must sign the Memo instruction. Discovery checks the successful transaction, the owner signature, and the owner's presence among the Memo's signer accounts. Merely transferring to or mentioning a wallet does not create a valid Vaulta record.

The app marks items backed up only after a successful devnet confirmation and verification of the expected record. Uploaded ciphertext can exist without a confirmed index transaction. In that case the UI keeps the items pending, and a later attempt can reuse completed file uploads.

Wallet identity, timing, ciphertext size, upload ownership, and transaction activity are public. The app trusts RPC providers for history availability and freshness, though it verifies signatures locally. A provider can omit history. A gateway can withhold bytes. Hashes detect replacement; they do not restore unavailable files.

The app uses the existing Memo program. It has no custom smart contract, token-gated storage, or claim of issuer authenticity.

## How the encryption key is recovered

The wallet signs one exact, versioned message that includes its owner address and Solana devnet. Vaulta verifies the Ed25519 signature and uses HKDF-SHA256 to derive a 32-byte encryption key. Two signatures are compared at connection time to reject an immediately non-repeatable signer.

The recovery signature is a secret in this design. It is not a login credential or a public ownership proof. It is never published, logged, or reused as an upload signature. Another application that obtains the same signature can derive the key. A familiar app name or a copied message does not provide phishing protection.

The same account must reproduce the same signature bytes on the new device. The same seed words with a different derivation path or account address do not identify the same vault. The in-session check does not prove that every wallet product, hardware wallet, or software version behaves identically across devices.

The v1 message and derivation are covered by a fixed test vector. Changing their wording or derivation without a migration would make old files inaccessible.

For production, an independently generated vault key with an explicit recovery secret or hardware-backed wrapping would avoid treating a normally public signature as a long-term encryption secret. That change is not hidden behind the current prototype's recovery claim.

## Recovery through the journal

A fresh installation connects the wallet and derives the key again. It scans up to 500 transactions for valid owner-signed Vaulta records. If a bounded scan finds no record and more history exists, the app says the result is incomplete.

After discovery, the app downloads the encrypted manifest and checks its ciphertext digest against the signed record. It decrypts the manifest, checks the owner and timestamp, downloads each ciphertext, verifies each committed digest, and authenticates the plaintext bytes. Only then does the local index include recovered items.

Existing local-only items stay in the vault. A conflicting identifier with different contents stops recovery rather than silently replacing the item. A failed download does not report a complete recovery.

## Recovery after history loss

Devnet can reset, and an RPC provider can prune history. Export the public JSON receipt after backup. The receipt is a locator, not a key, and is not sufficient by itself to read the files.

With the same wallet connected, **Import recovery receipt** uses the manifest ID and digest from that file. The wallet-derived key authenticates the encrypted manifest and file contents. This path does not claim that the old transaction remains confirmed on the current devnet, and it does not mark a new on-chain backup confirmed.

A chosen receipt can refer to an older snapshot. Receipt recovery does not prove that the snapshot is the latest one. Keep the receipt somewhere independent of the phone.

## What cannot be recovered

If both the wallet account and every usable cached encryption key are lost, Vaulta has no password reset, email recovery, administrator key, or escrow service. A transaction hash cannot reconstruct a missing decryption key. A content hash cannot reconstruct a missing file.

A stolen wallet can expose historical backups because the recovery key is deterministic. Rotating to another wallet does not remove old Arweave ciphertext. Biometric enrollment changes can invalidate a local cached key; the original wallet remains the recovery path.

These limits are part of self-custody, and the signature-derived-key approach adds a phishing and compatibility risk. They are reasons to keep this submission a synthetic-data prototype until a separate security review and real-device recovery tests are complete.

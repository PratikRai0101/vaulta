# Validation status

The submission artifact is a native ARM64 Android release APK. It runs without Metro and is signed with a local development certificate.

## Passed

- TypeScript typecheck, type-aware ESLint, and seven Node tests.
- Authenticated encryption roundtrip, fresh nonces, wrong-key rejection, wrong-context rejection, and ciphertext tampering rejection.
- A fixed v1 recovery-message and HKDF test vector.
- Fresh-session signature derivation recovering the exact original file bytes in a protocol test.
- Verified Solana ANS-104 encoding and owner-signed Memo parsing. Failed transactions and address-only mentions are rejected.
- A real tiny synthetic encrypted Turbo upload and download with a matching ciphertext digest.
- Installation and launch of `com.vaulta.wallet` on an Android API36 emulator.
- Native preview entry after fixing the required `expo-symbols` dependency. The test checks the foreground package before interactions and refuses another application.
- Android Mobile Wallet Adapter authorization and two verified repeatable signatures using Solana Mobile's official reference wallet v2.2.0.
- A real encrypted sample saved by the native application. Native file inspection read and authenticated the stored bytes and matched the saved content digest.

The official reference wallet APK digest was checked against its GitHub release asset. It is a development wallet and must never hold real funds.

## Not claimed

A funded on-chain backup confirmation and clean-install remote recovery have not yet been certified in this report. The emulator's first upload attempt failed DNS resolution. The production upload hostname was changed to the documented `upload.ardrive.io` alias. That change is not itself proof of a successful upload.

The reference wallet creates another account for a fresh authorization unless an existing address is requested. Recovery now supports an explicit original-account address hint. The funded reference account and a newly authorized account must not be confused. A changed account is not a successful recovery.

The direct RPC faucet rejected the optional network smoke test with HTTP410. The funded reference account's devnet balance was independently checked at 5 SOL. Funding is not transaction confirmation.

Solflare, Seed Vault, physical-device biometrics, cross-wallet recovery compatibility, iOS builds, screenshot blocking, and production signing are unverified or not implemented. No security audit is implied by these tests.

## Reproduce

Run `npm run typecheck`, `npm run lint`, and `npm test` in `mobile/`. Build with `npm run build:android`. Install the APK, then run `npm run verify:android` against the emulator. The preview check never claims that wallet or storage network operations passed.

`npm run test:network -- --live` is an explicit opt-in to permanent synthetic uploads and a devnet protocol transaction. It uses a disposable software test signer, not Mobile Wallet Adapter. The app's production signing path remains the external Android wallet.

Do not clear app data until a backup is actually confirmed or a valid recovery locator is independently kept. Never clear the wallet application's data as part of a Vaulta recovery test.

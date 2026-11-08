# Vaulta

A native Android document and pass wallet. Your Solana wallet owns the recovery index. Arweave stores encrypted file contents and an encrypted manifest. Vaulta has no application account, password database, or Supabase backend.

This is an experimental hackathon build, not audited storage for personal IDs. Read [storage and recovery](docs/storage-and-recovery.md) before uploading sensitive files.

## Install the Android build

Download `vaulta.apk` from [GitHub Releases](https://github.com/PratikRai0101/vaulta/releases). The standalone ARM64 APK runs without Metro. It uses a local development signing certificate, not a production release key.

1. Install the APK on Android 7 or later.
2. Install a Mobile Wallet Adapter-compatible wallet. Use the same Solana account for every recovery.
3. Connect the wallet and approve the two private recovery-message signatures.
4. Add a sample pass or import a file under 2 MiB.
5. Open **Settings**, then **Back up vault**. Read the permanent-storage warning before approving.
6. Keep some devnet SOL for the index transaction. Use the [official Solana faucet](https://faucet.solana.com) if the RPC faucet rejects requests.
7. Export the public recovery receipt after a confirmed backup.

**Try design preview** uses synthetic samples. Preview does not save personal files or claim successful uploads.

## Recover on another phone

1. Connect the same wallet account and approve the unchanged Vaulta v1 recovery message.
2. Open **Settings**, then **Restore on this phone**.
3. Select **Discover & restore backup** to find an owner-signed record in Solana devnet history.
4. If history is missing, select **Import recovery receipt** and choose your exported JSON receipt.

Receipt imports authenticate downloaded content with your wallet-derived key. They do not pretend to re-establish current on-chain confirmation. A receipt does not contain a decryption key.

## Build from source

Use Node 22.13 or later within the Expo SDK 58 supported range, JDK 21, and an Android SDK. This project uses Expo SDK 58, React Native 0.88, TypeScript, and Expo Router.

```sh
cd mobile
npm ci
npm run typecheck
npm run lint
npm test
npm run build:android
```

The build script produces `mobile/builds/vaulta.apk`. Set `ANDROID_HOME` and `JAVA_HOME` if the script cannot find your SDK or JDK. Run `npm run android` for a development build. iOS wallet signing is unsupported by Mobile Wallet Adapter; an iOS build is not part of the tested submission artifact.

## Why Solana belongs here

Solana stores the wallet-signed recovery journal. Each record binds an encrypted manifest ID and ciphertext digest to the wallet that authorized it. A fresh installation can discover backups without a Vaulta server. The client verifies the owner signature and rejects failed transactions and records that merely mention the address.

The wallet also signs a separate, fixed recovery message that derives the encryption key. That private signature never goes into the journal or upload signatures. Solana is the ownership and discovery layer; it is not a PDF database or an issuer-verification service. The app uses the standard Memo program rather than claiming a custom deployed program.

## Check the implementation

```sh
cd mobile
npm test
npm run verify:android
# Optional. Creates tiny permanent synthetic uploads and devnet transactions.
npm run test:network -- --live
```

The Android check asserts `com.vaulta.wallet` is foregrounded before interactions. It never treats another app as a successful Vaulta test. See [validation status](docs/validation.md) for what actually ran and what remains unverified.

## First-pass limits

- Android first, dark theme, 100 items, and less than 2 MiB per encrypted upload.
- Import, native file preview or export, self-created memberships, sample travel passes, QR presentation, local integrity checks, encrypted backups, and recovery.
- No NFC, payment functionality, issuer verification, camera scanning, incoming share extension, or paid Turbo top-up UI.
- Devnet can reset. RPC providers and gateways can fail. Turbo acceptance is not immediate Arweave layer-one settlement.
- Wallet signing compatibility across real wallet products and devices still needs testing. Use synthetic documents for the demo.

Archivo is bundled under the SIL Open Font License in `mobile/assets/fonts/OFL.txt`. The arch artwork is original to this project.

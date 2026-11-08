import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { History, KeyRound } from "lucide-react-native";
import { useVault } from "../core/VaultProvider";
import { colors, type } from "../theme";
import { ReceiptLink } from "../ui/BackupPanel";
import {
  Back,
  Button,
  Heading,
  Mark,
  Row,
  Screen,
  shared,
} from "../ui/primitives";

export default function RestoreScreen() {
  const vault = useVault();
  const params = useLocalSearchParams();
  const [requestedOwner, setRequestedOwner] = useState(() => typeof params.owner === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(params.owner) ? params.owner : "");
  const identity =
    vault.status.kind === "loading" ? null : vault.status.identity;
  const owner = identity?.kind === "wallet" ? identity.owner : null;
  return (
    <Screen>
      <Back label="Settings" />
      <Heading
        title={"Same wallet.\nSame vault."}
        subtitle="Discover encrypted backups owned by your connected wallet."
      />
      <TextInput accessibilityLabel="Recovery wallet address" placeholder="Original Solana account address" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} value={requestedOwner} onChangeText={setRequestedOwner} style={[shared.input, { marginBottom: 12 }]} />
      <Button title="Connect this account" secondary disabled={!requestedOwner.trim() || !!vault.busy} onPress={() => void vault.connectWallet(requestedOwner.trim())} />
      <View
        style={{ height: 190, alignItems: "center", justifyContent: "center" }}
      >
        <View
          style={{
            width: 100,
            height: 140,
            borderRadius: 50,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            backgroundColor: "#b9c7cd",
            borderWidth: 1,
            borderColor: "#e3ecef",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: "-6deg" }],
          }}
        >
          <Mark size={55} color={colors.darkInk} />
        </View>
      </View>
      <Row
        title="Wallet-owned history"
        detail={owner || "Connect the wallet you used to make your backup."}
        trailing={<History size={22} color={colors.muted} />}
      />
      <Row
        title="No email or account recovery"
        detail="Your wallet recreates private encryption key material by signing the fixed Vaulta recovery message."
        trailing={<KeyRound size={22} color={colors.muted} />}
      />
      <View style={[shared.panel, { marginTop: 22 }]}>
        <Text style={type.body}>Recovery is experimental.</Text>
        <Text style={type.muted}>
          Use the same wallet and account. Repeatable signing must work on this
          device. A receipt cannot replace wallet access.
        </Text>
        <Text style={type.muted}>
          Vaulta scans a bounded portion of Solana devnet history. A partial
          scan can miss older backups. Only validated wallet-owned receipts can
          be used to download and decrypt files.
        </Text>
        <Text style={type.muted}>
          If devnet history was reset or pruned, import your exported receipt. It locates the ciphertext; your wallet-derived key authenticates the content. This path does not assume current on-chain confirmation.
        </Text>
        <Text style={type.muted}>
          Restore downloads existing encrypted backups. Creating a new backup
          uploads encrypted data permanently to production Arweave; it cannot be
          deleted.
        </Text>
      </View>
      <View style={shared.spacer} />
      <View style={shared.bottom}>
        {!owner && (
          <Button
            title="Connect wallet"
            disabled={!!vault.busy}
            onPress={() => void vault.connectWallet()}
          />
        )}
        <Button
          title="Discover & restore backup"
          secondary={!owner}
          disabled={!owner || vault.preview || !!vault.busy}
          onPress={() => void vault.restore()}
        />
        <Button
          title="Import recovery receipt"
          secondary
          disabled={!owner || vault.preview || !!vault.busy}
          onPress={() => void vault.importReceipt()}
        />
        <Text style={type.label}>
          {vault.preview
            ? "Preview cannot discover or restore real backups."
            : "Network results and any scan limits appear above. No backup is assumed until the controller confirms it."}
        </Text>
        {vault.lastBackup && !vault.preview && (
          <ReceiptLink transaction={vault.lastBackup.transaction} />
        )}
      </View>
    </Screen>
  );
}

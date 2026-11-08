import { Text, View } from "react-native";
import { router } from "expo-router";
import { LockKeyhole } from "lucide-react-native";
import { useVault } from "../../core/VaultProvider";
import { colors, type } from "../../theme";
import { BackupPanel } from "../../ui/BackupPanel";
import {
  Brand,
  Button,
  Heading,
  Mark,
  Row,
  Screen,
  Section,
  shared,
} from "../../ui/primitives";

export default function SettingsScreen() {
  const vault = useVault();
  const identity =
    vault.status.kind === "loading" ? null : vault.status.identity;
  const owner = identity?.kind === "wallet" ? identity.owner : null;
  return (
    <Screen>
      <Brand />
      <Heading title="Settings." />
      <View
        style={{
          flexDirection: "row",
          gap: 18,
          alignItems: "center",
          paddingBottom: 22,
          borderBottomWidth: 1,
          borderColor: colors.faint,
        }}
      >
        <View
          style={{
            backgroundColor: "#aebec5",
            padding: 12,
            borderRadius: 24,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          }}
        >
          <Mark size={25} color={colors.darkInk} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.muted}>
            {vault.preview ? "Design preview" : "This device"}
          </Text>
          <Text style={type.heading}>
            {vault.preview ? "Sample vault" : "Your vault"}
          </Text>
        </View>
        <Text style={[type.label, { textAlign: "right" }]}>
          {vault.preview ? "No files\nsaved" : "Local key\naccess"}
        </Text>
      </View>
      <Section title="Your wallet">
        <Row
          title={owner ? "Connected wallet" : "Connect your wallet"}
          detail={
            owner ||
            (vault.preview
              ? "Preview has no wallet identity."
              : "Use the same wallet for encrypted recovery.")
          }
        />
        {!owner && (
          <Button
            title="Connect wallet"
            secondary
            disabled={!!vault.busy}
            onPress={() => void vault.connectWallet()}
          />
        )}
        <Row
          title="Restore on this phone"
          detail="Discover history owned by the same wallet"
          onPress={() => router.push("/restore")}
        />
      </Section>
      <Section title="Your vault">
        <BackupPanel />
      </Section>
      <Section title="Privacy">
        <Row
          title="Encrypted on your device"
          detail="File contents are encrypted before storage or upload. Your recovery signature is private key material; never share it."
        />
        <Row
          title="What becomes public"
          detail="Backups expose wallet ownership, upload and transaction timing, and encrypted data size. The receipt contains encrypted manifest identifiers, not your filenames."
        />
        <Row
          title="Recovery depends on your wallet"
          detail="Keep your wallet safe. Vaulta cannot recover files through an email address or an account password."
        />
      </Section>
      <View style={shared.bottom}>
        <Button
          title={vault.preview ? "Leave preview" : "Lock vault"}
          secondary
          icon={<LockKeyhole color={colors.ink} size={20} />}
          disabled={!!vault.busy}
          onPress={vault.lock}
        />
        <Text
          style={[type.label, { textAlign: "center", paddingVertical: 16 }]}
        >
          Vaulta · experimental devnet prototype
        </Text>
      </View>
    </Screen>
  );
}

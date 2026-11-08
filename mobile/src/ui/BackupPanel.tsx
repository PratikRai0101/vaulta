import { useState } from "react";
import { Linking, Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ExternalLink, ShieldCheck, X } from "lucide-react-native";
import { useVault } from "../core/VaultProvider";
import { colors, type } from "../theme";
import { Button, IconButton, Row, shared } from "./primitives";

export function ReceiptLink({ transaction }: { transaction: string }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Row
        title="View devnet transaction"
        detail="Solana Explorer"
        onPress={() => {
          void Linking.openURL(
            `https://explorer.solana.com/tx/${encodeURIComponent(transaction)}?cluster=devnet`,
          ).catch(() => setError("Could not open the explorer. Try again."));
        }}
        trailing={<ExternalLink color={colors.muted} size={20} />}
      />
      {error && (
        <Text style={[type.muted, { color: colors.error }]}>{error}</Text>
      )}
    </>
  );
}
export function BackupPanel() {
  const vault = useVault();
  const [confirm, setConfirm] = useState(false);
  const pending = vault.items.filter(
    (item) => !vault.backedUpIds.includes(item.id),
  ).length;
  return (
    <>
      <Row
        title="Backup status"
        detail={
          vault.preview
            ? "Preview · no remote backup"
            : `${pending} ${pending === 1 ? "item" : "items"} pending · ${vault.backedUpIds.length} in latest backup`
        }
      />
      <View style={{ gap: 12, marginTop: 16 }}>
        <Text style={type.muted}>
          Encrypted files are uploaded to permanent Arweave storage. A Solana
          devnet transaction records the encrypted manifest receipt.
        </Text>
        <Button
          title="Back up vault"
          secondary
          disabled={vault.preview || !!vault.busy || !vault.items.length}
          onPress={() => setConfirm(true)}
        />
      </View>
      {vault.lastBackup && !vault.preview && (
        <>
          <Row
            title="Latest receipt"
            detail={new Date(vault.lastBackup.createdAt).toLocaleString()}
          />
          <Text selectable style={type.label}>
            Manifest: {vault.lastBackup.manifestId}
          </Text>
          <ReceiptLink transaction={vault.lastBackup.transaction} />
          <Button
            title="Export recovery receipt"
            secondary
            disabled={!!vault.busy}
            onPress={() => void vault.exportReceipt()}
          />
        </>
      )}
      <Modal
        visible={confirm}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirm(false)}
      >
        <View style={styles.scrim}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.header}>
              <ShieldCheck color={colors.platinum} size={29} />
              <IconButton
                label="Cancel backup"
                onPress={() => setConfirm(false)}
              >
                <X color={colors.ink} size={22} />
              </IconButton>
            </View>
            <Text style={type.heading}>A permanent encrypted upload.</Text>
            <Text style={type.body}>
              This uploads every file in this vault as encrypted data to
              production Arweave. Uploaded ciphertext cannot be deleted.
            </Text>
            <Text style={type.muted}>
              Your wallet will authorize the upload and sign a public Solana
              devnet receipt. Upload limits, storage fees, and wallet network
              fees may apply. Keep access to the same wallet for recovery.
            </Text>
            <Text style={type.muted}>
              Recovery is experimental. A receipt alone cannot decrypt your
              files, and wallet signing compatibility across devices is not
              guaranteed.
            </Text>
            <View style={shared.gap}>
              <Button
                title="Upload encrypted backup"
                onPress={() => {
                  setConfirm(false);
                  void vault.backup();
                }}
              />
              <Button
                title="Keep on this device"
                secondary
                onPress={() => setConfirm(false)}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "#00000099", justifyContent: "flex-end" },
  sheet: {
    padding: 24,
    gap: 20,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

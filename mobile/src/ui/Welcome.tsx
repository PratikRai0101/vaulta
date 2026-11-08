import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useVault } from "../core/VaultProvider";
import { colors, type } from "../theme";
import { Brand, Button, Mark, Screen, shared } from "./primitives";

export function Welcome() {
  const vault = useVault();
  if (vault.status.kind === "loading")
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.platinum} />
        <Text style={type.muted}>Opening Vaulta…</Text>
      </View>
    );
  const hasIdentity =
    vault.status.kind === "locked" && vault.status.identity.kind === "wallet";
  return (
    <Screen>
      <Brand />
      <Text style={[type.title, styles.title]}>
        Your essentials.{"\n"}Within reach.
      </Text>
      <View style={styles.object}>
        <View style={styles.backCard} />
        <View style={styles.frontCard}>
          <Mark size={64} color={colors.darkInk} />
          <Text
            style={[type.label, { color: colors.darkInk, letterSpacing: 4 }]}
          >
            VAULTA
          </Text>
        </View>
      </View>
      <Text style={type.heading}>
        {hasIdentity ? "Welcome back." : "A quieter kind of wallet."}
      </Text>
      <Text style={[type.muted, { marginTop: 12 }]}>
        Keep passes and documents together. Connect your wallet to create or
        unlock your encrypted vault.
      </Text>
      <Text style={[type.muted, { marginTop: 12 }]}>
        Android wallet connection · Solana devnet. Recovery uses a repeatable
        wallet signature as private key material. Vaulta never asks for your
        seed phrase.
      </Text>
      <View style={shared.spacer} />
      <View style={shared.bottom}>
        {hasIdentity && (
          <Button
            title="Unlock vault"
            disabled={!!vault.busy}
            onPress={() => void vault.unlock()}
          />
        )}
        <Button
          title="Connect wallet"
          secondary={hasIdentity}
          disabled={!!vault.busy}
          onPress={() => void vault.connectWallet()}
        />
        <Button
          title="Try design preview"
          secondary
          onPress={vault.enterPreview}
          disabled={!!vault.busy}
        />
        <Text style={[type.label, { textAlign: "center" }]}>
          Preview uses samples. No personal files are saved.
        </Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: { marginTop: 32, fontSize: 31, lineHeight: 40 },
  object: { height: 260, justifyContent: "center", alignItems: "center" },
  backCard: {
    width: 245,
    height: 150,
    borderWidth: 1,
    borderColor: colors.faint,
    borderRadius: 16,
    backgroundColor: "#293238",
    transform: [{ rotate: "9deg" }],
    position: "absolute",
  },
  frontCard: {
    width: 245,
    height: 150,
    backgroundColor: "#c0cbd1",
    borderWidth: 1,
    borderColor: "#e6eff2",
    borderRadius: 16,
    transform: [{ rotate: "-9deg" }],
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});

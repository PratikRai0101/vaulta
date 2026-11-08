import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, Fingerprint, ShieldAlert } from "lucide-react-native";
import { useVault } from "../../core/VaultProvider";
import type { IntegrityResult } from "../../core/controller";
import { colors, fonts, type } from "../../theme";
import { ReceiptLink } from "../../ui/BackupPanel";
import {
  Back,
  Button,
  Empty,
  Heading,
  Row,
  Screen,
  shared,
} from "../../ui/primitives";
import { MetalSurface } from "../../ui/PassCard";

export default function ProofScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vault = useVault();
  const item = vault.items.find((candidate) => candidate.id === id);
  const [inspection, setInspection] = useState<{
    id: string;
    hash: string;
    result: IntegrityResult;
  } | null>(null);
  const result =
    inspection?.id === id && inspection.hash === item?.contentHash
      ? inspection.result
      : null;
  const [inspecting, setInspecting] = useState(false);
  if (!item)
    return (
      <Screen>
        <Back />
        <Empty
          title="Item unavailable."
          description="This item is no longer in the current vault."
        />
      </Screen>
    );
  const inspect = async () => {
    setInspecting(true);
    try {
      const inspected = await vault.inspect(item.id);
      setInspection(
        inspected
          ? { id: item.id, hash: item.contentHash, result: inspected }
          : null,
      );
    } finally {
      setInspecting(false);
    }
  };
  const confirmed =
    !vault.preview && vault.backedUpIds.includes(item.id) && vault.lastBackup;
  return (
    <Screen>
      <Back label={item.category === "document" ? "Documents" : "Wallet"} />
      <Heading title="Integrity proof." subtitle={item.title} />
      <View style={styles.receipt}>
        <MetalSurface />
        <View style={styles.receiptTop}>
          <Text style={styles.receiptLabel}>
            {vault.preview
              ? "SAMPLE · NO SAVED FILE"
              : "VAULTA · FILE INTEGRITY"}
          </Text>
          <Fingerprint size={27} color={colors.darkInk} />
        </View>
        <Text style={styles.receiptTitle}>
          {result
            ? result.matches
              ? "A matching fingerprint."
              : "The file has changed."
            : "Every byte counts."}
        </Text>
        <View style={styles.hashLines}>
          {item.contentHash.match(/.{1,32}/g)?.map((line, index) => (
            <Text key={index} style={styles.hashInk}>
              {line}
            </Text>
          ))}
        </View>
        <Text style={styles.receiptLabel}>
          SHA-256 ·{" "}
          {vault.preview
            ? "illustrative metadata"
            : "saved content fingerprint"}
        </Text>
      </View>
      <Row
        title={
          result
            ? result.matches
              ? "Local contents match"
              : "Integrity mismatch"
            : "Ready to inspect"
        }
        detail={
          result
            ? result.matches
              ? "The current bytes match the saved SHA-256 hash."
              : "Current bytes do not match the saved fingerprint. Treat this file as changed."
            : "Read the file and calculate its current fingerprint."
        }
        trailing={
          result ? (
            result.matches ? (
              <CheckCircle2 color={colors.success} size={24} />
            ) : (
              <ShieldAlert color={colors.error} size={24} />
            )
          ) : (
            <Fingerprint color={colors.muted} size={24} />
          )
        }
      />
      <Text style={[type.muted, { marginTop: 16 }]}>
        Integrity checks compare file bytes. They do not validate the issuer,
        identity, or contents of a document.
      </Text>
      {vault.preview && (
        <Text style={[type.muted, { marginTop: 12, color: colors.warning }]}>
          Preview inspection is synthetic. No personal file is stored or
          verified.
        </Text>
      )}
      <View style={[shared.panel, { marginTop: 24 }]}>
        <Text style={type.label}>SAVED SHA-256</Text>
        <Text selectable style={styles.hash}>
          {item.contentHash}
        </Text>
        <Text style={type.label}>CURRENT SHA-256</Text>
        <Text selectable style={styles.hash}>
          {result?.actualHash || "Run inspection to read current bytes."}
        </Text>
      </View>
      <View style={shared.bottom}>
        <Button
          title={
            inspecting
              ? "Reading file…"
              : result
                ? "Inspect again"
                : "Inspect file"
          }
          disabled={!!vault.busy || inspecting}
          onPress={() => void inspect()}
        />
        {!vault.preview && (
          <Button
            title="Open / export original"
            secondary
            disabled={!!vault.busy}
            onPress={() => void vault.open(item.id)}
          />
        )}
      </View>
      {confirmed ? (
        <>
          <Row
            title="Included in latest backup"
            detail={new Date(confirmed.createdAt).toLocaleString()}
          />
          <ReceiptLink transaction={confirmed.transaction} />
          <Text selectable style={type.label}>
            Encrypted manifest SHA-256: {confirmed.ciphertextHash}
          </Text>
        </>
      ) : (
        <Text style={type.muted}>
          {vault.preview
            ? "Preview has no network receipt."
            : "This item has no confirmed backup receipt in the current vault."}
        </Text>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  receipt: {
    overflow: "hidden",
    borderRadius: 17,
    padding: 24,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#dfe7eb",
    minHeight: 230,
    transform: [{ rotate: "-2deg" }],
    boxShadow: "2px 2px 0px #73858e, 0px 16px 22px #00000040",
  },
  receiptTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 16,
    color: "#435863",
    letterSpacing: 1,
  },
  receiptTitle: {
    fontFamily: fonts.body,
    fontWeight: "600",
    color: colors.darkInk,
    fontSize: 26,
    lineHeight: 32,
    marginVertical: 20,
    letterSpacing: -0.5,
  },
  hashLines: { marginBottom: 16, gap: 4 },
  hashInk: { fontFamily: "monospace", fontSize: 10, color: "#435863" },
  hash: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 20,
    color: colors.ink,
  },
});

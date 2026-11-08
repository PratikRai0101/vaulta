import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { QrCode, X } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { useVault } from "../../core/VaultProvider";
import { colors, fonts, type } from "../../theme";
import { PassCard } from "../../ui/PassCard";
import { CodeBoundary } from "../../ui/CodeBoundary";
import {
  Back,
  Button,
  Empty,
  Heading,
  IconButton,
  Row,
  Screen,
  shared,
} from "../../ui/primitives";

function Field({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | undefined;
  large?: boolean;
}) {
  return (
    <View style={{ gap: 7, flex: 1 }}>
      <Text style={type.muted}>{label}</Text>
      <Text
        selectable
        style={[type.body, { fontWeight: "600", fontSize: large ? 25 : 16 }]}
      >
        {value || "—"}
      </Text>
    </View>
  );
}
export default function PassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vault = useVault();
  const item = vault.items.find((candidate) => candidate.id === id);
  const [showCode, setShowCode] = useState(false);
  const { width } = useWindowDimensions();
  if (!item)
    return (
      <Screen>
        <Back />
        <Empty
          title="Pass unavailable."
          description="This item is no longer in the current vault."
        />
      </Screen>
    );
  const f = item.fields;
  const travel = item.category === "travel";
  const sample = f.sample === "true" || vault.preview;
  return (
    <Screen>
      <Back />
      <Heading
        title={travel ? "Boarding pass." : "Membership."}
        subtitle={
          travel
            ? [f.date, f.flight].filter(Boolean).join(" · ")
            : f.clubName || item.title
        }
      />
      <View style={styles.card}>
        <PassCard item={item} />
      </View>
      <View style={[shared.panel, { marginTop: 32 }]}>
        <View style={styles.handle} />
        {travel ? (
          <>
            <View style={styles.fields}>
              <Field label="Boarding" value={f.boarding} large />
              <Field label="Gate" value={f.gate} large />
              <Field label="Seat" value={f.seat} large />
            </View>
            <View style={shared.rule} />
            <View style={styles.fields}>
              <Field label="Passenger" value={f.passenger} />
              <Field label="Booking" value={f.booking} />
            </View>
          </>
        ) : (
          <>
            <Field label="Member" value={f.memberName} />
            <Field label="Member ID" value={f.memberId} />
            <Text style={type.muted}>
              Personal reference · not issuer verified
            </Text>
          </>
        )}
      </View>
      <View style={{ marginTop: 22, gap: 12 }}>
        {sample && (
          <Text style={[type.muted, { color: colors.warning }]}>
            {travel
              ? "Design sample · not valid for travel."
              : "Sample card · not an issued credential."}
          </Text>
        )}
        <Text style={type.muted}>
          {vault.preview
            ? "Preview · no files saved"
            : vault.backedUpIds.includes(item.id)
              ? "Available offline · backed up on devnet"
              : "Available offline · on this device only"}
        </Text>
      </View>
      <View style={shared.bottom}>
        <Button
          title="Show code"
          icon={<QrCode color={colors.darkInk} size={22} />}
          disabled={!f.code}
          onPress={() => {
            setShowCode(true);
          }}
        />
        {!f.code && (
          <Text style={type.muted}>This pass has no code payload.</Text>
        )}
        <Row
          title="Integrity proof"
          onPress={() =>
            router.push({ pathname: "/proof/[id]", params: { id: item.id } })
          }
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
      <Modal
        visible={showCode}
        animationType="slide"
        onRequestClose={() => setShowCode(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalTop}>
            <Text style={type.heading}>
              {travel ? "Boarding code" : "Membership code"}
            </Text>
            <IconButton label="Close code" onPress={() => setShowCode(false)}>
              <X size={23} color={colors.ink} />
            </IconButton>
          </View>
          <ScrollView contentContainerStyle={styles.qrArea}>
            <View style={styles.qr}>
              {f.code && (
                <CodeBoundary key={f.code}>
                  <QRCode
                    value={f.code}
                    size={Math.min(width - 96, 320)}
                    color="#172025"
                    backgroundColor="#ffffff"
                    quietZone={8}
                  />
                </CodeBoundary>
              )}
            </View>

            <Text
              style={[type.heading, { textAlign: "center", marginTop: 28 }]}
            >
              {item.title}
            </Text>
            {sample && (
              <Text
                style={[
                  type.body,
                  { color: colors.warning, textAlign: "center", marginTop: 16 },
                ]}
              >
                DESIGN SAMPLE{"\n"}
                {travel ? "Not valid for travel" : "Not an issued credential"}
              </Text>
            )}
            <Text selectable style={[type.label, styles.payload]}>
              {f.code}
            </Text>
            {vault.preview && (
              <Text style={[type.label, { marginTop: 12 }]}>
                Preview · no files saved
              </Text>
            )}
          </ScrollView>
          <Button title="Done" onPress={() => setShowCode(false)} />
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: 5,
    transform: [{ rotate: "-2deg" }],
  },
  fields: { flexDirection: "row", gap: 16 },
  handle: {
    width: 32,
    height: 3,
    backgroundColor: colors.faint,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: -10,
    marginBottom: 7,
  },
  modal: { flex: 1, backgroundColor: colors.background, padding: 24 },
  modalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  qrArea: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  qr: { backgroundColor: "white", padding: 12, borderRadius: 12 },
  payload: { textAlign: "center", marginTop: 16, fontFamily: fonts.body },
});

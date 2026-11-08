import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, ArrowRight, X } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";
import { useVault } from "../core/VaultProvider";
import { colors, fonts, type } from "../theme";

export function Mark({
  size = 27,
  color = colors.ink,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 32 44"
      accessibilityElementsHidden
    >
      <Path
        d="M3 41V17a13 13 0 0 1 26 0v24M10 41V17a6 6 0 0 1 12 0v24M3 31h7m12 0h7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
export function Brand({ action }: { action?: ReactNode }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brand}>
        <Mark />
        <Text style={styles.wordmark}>vaulta</Text>
      </View>
      {action}
    </View>
  );
}
export function IconButton({
  label,
  children,
  onPress,
  disabled = false,
}: PropsWithChildren<{
  label: string;
  onPress: () => void;
  disabled?: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  icon,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, secondary && { color: colors.ink }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Back({ label = "Wallet" }: { label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Back to ${label}`}
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={styles.back}
    >
      <ArrowLeft size={22} color={colors.ink} />
      <Text style={type.body}>{label}</Text>
    </Pressable>
  );
}
export function Feedback() {
  const vault = useVault();
  return (
    <>
      {vault.preview && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>PREVIEW · No files saved</Text>
        </View>
      )}
      {vault.busy && (
        <View style={styles.feedback} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={colors.platinum} />
          <Text style={[type.muted, { flex: 1 }]}>{vault.busy}</Text>
        </View>
      )}
      {vault.error && (
        <View
          style={[styles.feedback, { borderColor: colors.error }]}
          accessibilityLiveRegion="assertive"
        >
          <Text
            selectable
            style={[type.muted, { color: colors.error, flex: 1 }]}
          >
            {vault.error}
          </Text>
          <IconButton label="Dismiss error" onPress={vault.clearError}>
            <X size={20} color={colors.error} />
          </IconButton>
        </View>
      )}
    </>
  );
}
export function Screen({
  children,
  scroll = true,
  style,
}: PropsWithChildren<{ scroll?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.feedbackWrap}>
        <Feedback />
      </View>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, style]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.heading}>
      <Text style={type.title}>{title}</Text>
      {subtitle && (
        <Text style={[type.muted, { marginTop: 10, fontSize: 15 }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
export function Empty({
  title,
  description,
  children,
}: PropsWithChildren<{ title: string; description: string }>) {
  return (
    <View style={styles.empty}>
      <Mark size={55} color={colors.faint} />
      <Text style={[type.heading, { marginTop: 24 }]}>{title}</Text>
      <Text style={[type.muted, { textAlign: "center", marginVertical: 14 }]}>
        {description}
      </Text>
      {children}
    </View>
  );
}
export function Row({
  title,
  detail,
  onPress,
  trailing,
}: {
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={type.body}>{title}</Text>
        {detail && (
          <Text selectable style={type.muted}>
            {detail}
          </Text>
        )}
      </View>
      {trailing ?? (onPress && <ArrowRight size={21} color={colors.muted} />)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}
export function Section({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={[type.heading, { marginBottom: 5 }]}>{title}</Text>
      {children}
    </View>
  );
}
export const shared = StyleSheet.create({
  gap: { gap: 12 },
  spacer: { flex: 1, minHeight: 20 },
  rule: { height: 1, backgroundColor: colors.rule, marginVertical: 20 },
  input: {
    minHeight: 54,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 16,
    borderColor: colors.rule,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  panel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  bottom: { gap: 12, paddingTop: 20, paddingBottom: 24 },
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingBottom: 28, flexGrow: 1 },
  feedbackWrap: { paddingHorizontal: 24 },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 12,
    marginBottom: 8,
  },
  notice: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: colors.rule,
    marginBottom: 8,
  },
  noticeText: { ...type.label, color: colors.warning, letterSpacing: 1 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 64,
    paddingTop: 8,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  wordmark: {
    fontFamily: fonts.body,
    fontSize: 30,
    color: colors.ink,
    fontWeight: "600",
    letterSpacing: -1.4,
  },
  iconButton: {
    minWidth: 48,
    minHeight: 48,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 54,
    borderRadius: 32,
    backgroundColor: colors.platinum,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.rule,
  },
  buttonText: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: "600",
    color: colors.darkInk,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.4 },
  back: { minHeight: 52, flexDirection: "row", gap: 10, alignItems: "center" },
  heading: { marginTop: 20, marginBottom: 24 },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    minHeight: 74,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.rule,
  },
  section: {
    borderLeftWidth: 1,
    borderColor: colors.faint,
    borderTopLeftRadius: 20,
    paddingLeft: 16,
    marginTop: 26,
  },
});

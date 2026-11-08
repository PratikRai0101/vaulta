import { StyleSheet, Text, View } from "react-native";
import type { VaultItem } from "../core/types";
import { colors, fonts } from "../theme";
import { Mark } from "./primitives";

export function DocumentFolio({
  item,
  preview,
}: {
  item: VaultItem;
  preview: boolean;
}) {
  return (
    <View style={styles.stage}>
      <View style={styles.folder}>
        <View style={styles.tab} />
      </View>
      <View style={styles.paper}>
        <View style={styles.top}>
          <Text numberOfLines={1} style={styles.label}>
            {preview ? "Vaulta design sample" : "Encrypted document"}
          </Text>
          <Mark size={16} color={colors.darkInk} />
        </View>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.description}>
          {item.mimeType === "application/pdf" ? "PDF document" : item.mimeType}
        </Text>
        <Text style={styles.description}>
          {preview
            ? "Preview · no files saved"
            : `${Math.max(1, Math.round(item.size / 1024))} KB · stored on this device`}
        </Text>
        <View style={styles.seal}>
          <Mark size={42} color="#718276" />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  stage: {
    height: 246,
    marginVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  folder: {
    position: "absolute",
    width: "88%",
    height: 188,
    borderRadius: 8,
    borderTopRightRadius: 30,
    backgroundColor: "#35463d",
    borderWidth: 1,
    borderColor: "#69756f",
    transform: [{ rotate: "4deg" }, { translateY: 7 }],
  },
  tab: {
    position: "absolute",
    top: -12,
    left: 24,
    width: 95,
    height: 15,
    backgroundColor: "#43534b",
    borderWidth: 1,
    borderColor: "#69756f",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  paper: {
    width: "87%",
    minHeight: 195,
    backgroundColor: "#e8eee5",
    padding: 23,
    borderRadius: 3,
    transform: [{ rotate: "-5deg" }],
    boxShadow: "4px 5px 0px #a8b6a9, 6px 7px 0px #62756a",
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: "#9baaaa",
    paddingBottom: 12,
  },
  label: {
    color: colors.darkInk,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  title: {
    fontFamily: fonts.body,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.darkInk,
    marginTop: 18,
    marginBottom: 8,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#52645d",
    lineHeight: 20,
  },
  seal: { position: "absolute", right: 18, bottom: 14, opacity: 0.22 },
});

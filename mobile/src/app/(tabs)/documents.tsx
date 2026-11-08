import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
} from "lucide-react-native";
import { useVault } from "../../core/VaultProvider";
import type { VaultItem } from "../../core/types";
import { colors, type } from "../../theme";
import { DocumentFolio } from "../../ui/DocumentFolio";
import {
  Brand,
  Button,
  Empty,
  Heading,
  IconButton,
  Screen,
  shared,
} from "../../ui/primitives";

export default function DocumentsScreen() {
  const vault = useVault();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VaultItem>();
  const documents = vault.items.filter((item) => item.category === "document");
  const shown = documents.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );
  const hero =
    selected && shown.some((item) => item.id === selected.id)
      ? selected
      : shown[0];
  const backupCount = documents.filter((item) =>
    vault.backedUpIds.includes(item.id),
  ).length;
  return (
    <Screen>
      <Brand
        action={
          <IconButton
            label="Import document"
            disabled={!!vault.busy || vault.preview}
            onPress={() => void vault.importDocument()}
          >
            <Plus color={colors.ink} size={24} />
          </IconButton>
        }
      />
      <Heading
        title="Documents."
        subtitle={`${documents.length} files · ${vault.preview ? "design samples" : `${backupCount} backed up`}`}
      />
      <View style={styles.search}>
        <Search color={colors.muted} size={20} />
        <TextInput
          accessibilityLabel="Search documents"
          placeholder="Search documents"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          style={[type.body, styles.searchInput]}
        />
      </View>
      {hero && <DocumentFolio item={hero} preview={vault.preview} />}
      {shown.map((item) => (
        <View key={item.id} style={styles.file}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.title}`}
            onPress={() => setSelected(item)}
            style={styles.fileInfo}
          >
            <FileText color={colors.faint} size={32} strokeWidth={1} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={type.body}>{item.title}</Text>
              <Text style={type.label}>
                {item.mimeType === "application/pdf" ? "PDF" : "FILE"} ·{" "}
                {Math.max(1, Math.round(item.size / 1024))} KB ·{" "}
                {vault.preview
                  ? "Preview"
                  : vault.backedUpIds.includes(item.id)
                    ? "Backed up"
                    : "On this device"}
              </Text>
            </View>
            {vault.backedUpIds.includes(item.id) && !vault.preview ? (
              <CheckCircle2 color={colors.muted} size={18} />
            ) : (
              <Clock3 color={colors.faint} size={18} />
            )}
          </Pressable>
          <View style={styles.actions}>
            <Button
              title={vault.preview ? "Sample details" : "Open / export"}
              secondary
              disabled={!!vault.busy}
              onPress={() =>
                vault.preview
                  ? router.push({
                      pathname: "/proof/[id]",
                      params: { id: item.id },
                    })
                  : void vault.open(item.id)
              }
            />
            <IconButton
              label={`Inspect ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: "/proof/[id]",
                  params: { id: item.id },
                })
              }
            >
              <ArrowUpRight size={21} color={colors.muted} />
            </IconButton>
          </View>
        </View>
      ))}
      {!shown.length && (
        <Empty
          title={
            documents.length
              ? "No matching documents."
              : "Everything in one place."
          }
          description={
            documents.length
              ? "Try searching for another filename."
              : "Import a document to keep its original bytes in your encrypted vault."
          }
        />
      )}
      <View style={shared.bottom}>
        {vault.preview ? (
          <Text style={type.muted}>
            Personal document import is unavailable in preview. Connect a wallet
            from Settings to use your vault.
          </Text>
        ) : (
          <Button
            title="Import document"
            icon={<Plus size={21} color={colors.darkInk} />}
            disabled={!!vault.busy}
            onPress={() => void vault.importDocument()}
          />
        )}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  search: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 14,
    paddingHorizontal: 15,
    gap: 12,
  },
  searchInput: { flex: 1, paddingVertical: 15 },
  file: { borderBottomWidth: 1, borderColor: colors.rule, paddingVertical: 12 },
  fileInfo: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 12,
  },
});

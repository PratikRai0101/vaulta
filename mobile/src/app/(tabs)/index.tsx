import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { CheckCircle2, Clock3, Plus, Search } from "lucide-react-native";
import { useVault } from "../../core/VaultProvider";
import type { VaultItem } from "../../core/types";
import { colors, fonts } from "../../theme";
import {
  Brand,
  Button,
  Empty,
  Heading,
  IconButton,
  Row,
  Screen,
  shared,
} from "../../ui/primitives";
import { CardDeck } from "../../ui/CardDeck";

type Filter = "all" | "travel" | "membership";
const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Travel", value: "travel" },
  { label: "Memberships", value: "membership" },
];
export default function WalletScreen() {
  const vault = useVault();
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VaultItem>();
  const onSelect = useCallback(
    (item: VaultItem | undefined) => setSelected(item),
    [],
  );
  const passes = vault.items.filter((item) => item.category !== "document");
  const shown = passes.filter(
    (item) =>
      (filter === "all" || item.category === filter) &&
      `${item.title} ${Object.values(item.fields).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const backed = selected && vault.backedUpIds.includes(selected.id);
  return (
    <Screen>
      <Brand
        action={
          <IconButton
            label="Search passes"
            onPress={() => setSearchOpen((value) => !value)}
          >
            <Search size={23} color={colors.ink} />
          </IconButton>
        }
      />
      <Heading
        title="Your wallet."
        subtitle={`${passes.length} ${passes.length === 1 ? "pass" : "passes"} · ${vault.preview ? "design samples" : "available offline"}`}
      />
      {searchOpen && (
        <TextInput
          autoFocus
          accessibilityLabel="Search passes"
          placeholder="Search passes"
          placeholderTextColor={colors.faint}
          value={query}
          onChangeText={setQuery}
          style={[shared.input, { marginBottom: 16 }]}
        />
      )}
      <ScrollView
        horizontal
        style={{ flexGrow: 0, maxHeight: 58 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {filters.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === option.value }}
            onPress={() => setFilter(option.value)}
            style={[styles.filter, filter === option.value && styles.active]}
          >
            <Text
              style={[
                styles.filterText,
                filter === option.value && { color: colors.darkInk },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {shown.length ? (
        <>
          <CardDeck items={shown} onSelect={onSelect} />
          <Row
            title={
              vault.preview
                ? "Preview · no files saved"
                : backed
                  ? "Backed up · devnet receipt"
                  : "On this device · not backed up"
            }
            detail={
              vault.preview
                ? "Sample passes cannot be used for travel."
                : undefined
            }
            trailing={
              backed ? (
                <CheckCircle2 size={20} color={colors.success} />
              ) : (
                <Clock3 size={20} color={colors.muted} />
              )
            }
          />
          {selected && (
            <Row
              title="View integrity proof"
              onPress={() =>
                router.push({
                  pathname: "/proof/[id]",
                  params: { id: selected.id },
                })
              }
            />
          )}
        </>
      ) : (
        <Empty
          title={
            passes.length ? "No matching passes." : "Room for your essentials."
          }
          description={
            passes.length
              ? "Try another search or category."
              : "Your vault is empty. Add a sample pass or create a membership to get started."
          }
        />
      )}
      <View style={shared.spacer} />
      <View style={shared.bottom}>
        <Button
          title="Add to wallet"
          icon={<Plus size={22} color={colors.darkInk} />}
          onPress={() => router.push("/add")}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  filters: { gap: 8, paddingBottom: 8 },
  filter: {
    minHeight: 48,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.rule,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  filterText: { fontFamily: fonts.body, fontSize: 15, color: colors.muted },
});

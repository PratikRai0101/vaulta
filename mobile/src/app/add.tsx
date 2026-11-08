import { useState } from "react";
import { router } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { Plus, FileUp, Plane, UserRound } from "lucide-react-native";
import { useVault } from "../core/VaultProvider";
import { colors, type } from "../theme";
import {
  Back,
  Button,
  Heading,
  Screen,
  Section,
  Row,
  shared,
} from "../ui/primitives";

export default function AddScreen() {
  const vault = useVault();
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const busy = !!vault.busy;
  const [initialIds] = useState(
    () => new Set(vault.items.map((item) => item.id)),
  );
  const addedItems = vault.items.filter((item) => !initialIds.has(item.id));
  const hasSamplePass = vault.items.some(
    (item) => item.category === "travel" && item.fields.sample === "true",
  );
  return (
    <Screen>
      <Back />
      <Heading
        title="Make room."
        subtitle="Passes, memberships, and the files you carry."
      />
      <Section title="Add to your wallet">
        <View style={shared.gap}>
          <Text style={type.muted}>
            Create one clearly labelled sample boarding pass. It is not valid
            for travel.
          </Text>
          <Button
            title={
              hasSamplePass && !vault.preview
                ? "Sample pass is in your wallet"
                : "Add sample pass"
            }
            icon={<Plane size={20} color={colors.darkInk} />}
            disabled={busy || vault.preview || hasSamplePass}
            onPress={() => void vault.addSamplePass()}
          />
          <Text style={[type.muted, { marginTop: 12 }]}>
            Import an original file from your device. Vaulta keeps its real
            contents.
          </Text>
          <Button
            title="Import document"
            secondary
            icon={<FileUp size={20} color={colors.ink} />}
            disabled={busy || vault.preview}
            onPress={() => void vault.importDocument()}
          />
        </View>
      </Section>
      <Section title="Create a membership">
        <View style={shared.gap}>
          <Text style={type.muted}>
            A personal reference card. This does not issue or validate a
            membership with a club.
          </Text>
          <TextInput
            accessibilityLabel="Membership name"
            placeholder="Membership name"
            placeholderTextColor={colors.faint}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            style={shared.input}
          />
          <TextInput
            accessibilityLabel="Member name"
            placeholder="Member name"
            placeholderTextColor={colors.faint}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoCapitalize="words"
            style={shared.input}
          />
          <Button
            title="Create membership"
            secondary
            icon={<UserRound size={20} color={colors.ink} />}
            disabled={busy || vault.preview || !title.trim() || !name.trim()}
            onPress={() =>
              void vault.createMembership(title.trim(), name.trim())
            }
          />
        </View>
      </Section>
      {!!addedItems.length && !vault.preview && (
        <Section title="Saved on this device">
          {addedItems.map((item) => (
            <Row
              key={item.id}
              title={item.title}
              detail="Not backed up yet"
              onPress={() =>
                router.push({
                  pathname:
                    item.category === "document" ? "/proof/[id]" : "/pass/[id]",
                  params: { id: item.id },
                })
              }
            />
          ))}
        </Section>
      )}
      {vault.preview && (
        <View style={[shared.panel, { marginTop: 24 }]}>
          <Plus color={colors.muted} size={24} />
          <Text style={type.body}>You’re exploring the design.</Text>
          <Text style={type.muted}>
            Preview samples are temporary. Connect a wallet in Settings to add
            and save your own items.
          </Text>
        </View>
      )}
      <View style={shared.bottom}>
        <Text style={type.label}>
          New items stay on this device until you explicitly back them up.
        </Text>
      </View>
    </Screen>
  );
}

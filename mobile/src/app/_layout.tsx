import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { VaultProvider, useVault } from "../core/VaultProvider";
import { colors, type } from "../theme";
import { Welcome } from "../ui/Welcome";

function VaultRoutes() {
  const vault = useVault();
  if (vault.status.kind !== "unlocked" && !vault.preview) return <Welcome />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: "modal" }} />
      <Stack.Screen name="pass/[id]" />
      <Stack.Screen name="proof/[id]" />
      <Stack.Screen name="restore" />
    </Stack>
  );
}
export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Archivo: require("../../assets/fonts/Archivo.ttf"),
    ArchivoExpanded: require("../../assets/fonts/ArchivoExpanded.ttf"),
  });
  if (!loaded && !fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.platinum} />
      </View>
    );
  if (fontError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={type.body}>
          Vaulta could not load its fonts. Please restart the app.
        </Text>
      </View>
    );
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <VaultProvider>
          <VaultRoutes />
        </VaultProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

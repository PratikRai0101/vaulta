import { NativeTabs } from "expo-router/native-tabs";
import { colors, fonts } from "../../theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.ink}
      iconColor={colors.muted}
      labelStyle={{ fontFamily: fonts.body, fontSize: 12, color: colors.muted }}
      disableTransparentOnScrollEdge
      indicatorColor={colors.rule}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf="wallet.bifold"
          md="account_balance_wallet"
        />
        <NativeTabs.Trigger.Label>Wallet</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Icon sf="doc.text" md="description" />
        <NativeTabs.Trigger.Label>Documents</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

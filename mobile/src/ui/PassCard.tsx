import { StyleSheet, Text, View } from "react-native";
import { ArrowRight, Plane } from "lucide-react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import type { VaultItem } from "../core/types";
import { colors, fonts } from "../theme";
import { Mark } from "./primitives";

export function MetalSurface({ dark = false }: { dark?: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 340 222"
      preserveAspectRatio="none"
      accessibilityElementsHidden
    >
      <Defs>
        <LinearGradient id="metal" x1="0" y1="0" x2="1" y2="0.6">
          <Stop offset="0" stopColor={dark ? "#38434b" : "#a6b0b8"} />
          <Stop offset="0.36" stopColor={dark ? "#273139" : "#e9edef"} />
          <Stop offset="0.68" stopColor={dark ? "#171e24" : "#c0c9cf"} />
          <Stop offset="1" stopColor={dark ? "#303d47" : "#9ca9b2"} />
        </LinearGradient>
      </Defs>
      <Rect width="340" height="222" rx="16" fill="url(#metal)" />
      {Array.from({ length: 7 }, (_, i) => (
        <Path
          key={i}
          d={`M${146 - i * 12} 220V${123 - i * 12}a${40 + i * 12} ${40 + i * 12} 0 0 1 ${80 + i * 24} 0V220`}
          stroke={dark ? "#bdccd4" : "#53636d"}
          strokeWidth="0.7"
          fill="none"
          opacity="0.16"
        />
      ))}
      <Path
        d="M188 160l65-87"
        stroke={dark ? "#bdccd4" : "#53636d"}
        strokeWidth="1.1"
        opacity="0.2"
      />
    </Svg>
    </View>
  );
}
export function PassCard({ item }: { item: VaultItem }) {
  const f = item.fields;
  const travel = item.category === "travel";
  const dark = item.category === "membership";
  const ink = dark ? colors.ink : colors.darkInk;
  return (
    <View style={[styles.card, dark && { borderColor: "#71808a" }]}>
      <MetalSurface dark={dark} />
      <View style={styles.brand}>
        <Text numberOfLines={1} style={[styles.brandText, { color: ink }]}>
          {travel ? f.airline || item.title : f.clubName || item.title}
        </Text>
        {travel ? (
          <Plane size={21} color={ink} />
        ) : (
          <Mark size={17} color={ink} />
        )}
      </View>
      {travel ? (
        <>
          <View style={styles.route}>
            <Text style={[styles.airport, { color: ink }]}>
              {f.from || "—"}
            </Text>
            <ArrowRight color={ink} size={26} />
            <Text style={[styles.airport, { color: ink }]}>{f.to || "—"}</Text>
          </View>
          <View style={styles.cities}>
            <Text style={[styles.small, { color: ink }]}>{f.fromCity}</Text>
            <Text style={[styles.small, { color: ink }]}>{f.toCity}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.small, { color: ink }]}>
              Depart <Text style={styles.bold}>{f.departure || "—"}</Text>
            </Text>
            <Text style={[styles.small, { color: ink }]}>
              Gate <Text style={styles.bold}>{f.gate || "—"}</Text>
            </Text>
            <Text style={[styles.small, { color: ink }]}>
              Seat <Text style={styles.bold}>{f.seat || "—"}</Text>
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text numberOfLines={2} style={[styles.memberTitle, { color: ink }]}>
            {item.title}
          </Text>
          <View style={styles.memberMeta}>
            <Text
              numberOfLines={1}
              style={[styles.small, { color: ink, flex: 1 }]}
            >
              {f.memberName || f.passenger || "Personal pass"}
            </Text>
            <Text style={[styles.small, { color: ink }]}>
              {f.memberId || f.booking || ""}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    aspectRatio: 1.53,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6ecef",
    overflow: "hidden",
    padding: 20,
    minHeight: 208,
    backgroundColor: "#bdc8ce",
    boxShadow: "3px 2px 0px #697780, 0px 16px 22px #00000040",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  route: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 17,
  },
  airport: {
    fontFamily: fonts.body,
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -2.5,
  },
  cities: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  bold: { fontWeight: "700" },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#677d8655",
    marginTop: 15,
    paddingTop: 11,
  },
  memberTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 32,
    marginTop: 28,
  },
  memberMeta: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: "auto",
  },
});

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import type { VaultItem } from "../core/types";
import { colors, type } from "../theme";
import { IconButton } from "./primitives";
import { MetalSurface, PassCard } from "./PassCard";

export function CardDeck({
  items,
  onSelect,
}: {
  items: VaultItem[];
  onSelect: (item: VaultItem | undefined) => void;
}) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [drag] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 68, 450);
  const safeIndex = Math.min(index, Math.max(0, items.length - 1));
  const selected = items[safeIndex];
  const move = useCallback(
    (direction: number) => {
      if (items.length < 2) {
        Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        return;
      }
      setIndex(
        (current) =>
          (Math.min(current, items.length - 1) + direction + items.length) %
          items.length,
      );
      if (reducedMotion) {
        drag.setValue(0);
        return;
      }
      drag.setValue(direction * 38);
      Animated.spring(drag, {
        toValue: 0,
        damping: 22,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    },
    [items.length, reducedMotion, drag],
  );
  useEffect(() => {
    onSelect(selected);
  }, [selected, onSelect]);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReducedMotion)
      .catch(() => setReducedMotion(true));
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducedMotion,
    );
    return () => listener.remove();
  }, []);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          items.length > 1 &&
          Math.abs(g.dx) > 10 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
        onPanResponderMove: (_, g) =>
          drag.setValue(Math.max(-110, Math.min(110, g.dx))),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > 50 || Math.abs(g.vx) > 0.65)
            move(g.dx < 0 ? 1 : -1);
          else
            Animated.spring(drag, {
              toValue: 0,
              useNativeDriver: true,
              damping: 22,
              stiffness: 160,
            }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [move, drag, items.length],
  );
  if (!selected) return null;
  return (
    <>
      <View
        style={[styles.stage, { height: Math.max(208, cardWidth / 1.53) + 42 }]}
      >
        {items.length > 1 && (
          <>
            {[-1, 1].map((side) => (
              <View
                key={side}
                pointerEvents="none"
                style={[
                  styles.neighbor,
                  {
                    width: cardWidth,
                    height: Math.max(208, cardWidth / 1.53),
                    transform: [
                      { perspective: 1000 },
                      { translateX: side * cardWidth * 0.66 },
                      { rotateY: `${side * -68}deg` },
                      { rotateZ: `${side * -2}deg` },
                    ],
                  },
                ]}
              >
                <MetalSurface
                  dark={
                    items[(safeIndex + side + items.length) % items.length]
                      ?.category === "membership"
                  }
                />
              </View>
            ))}
          </>
        )}
        <Animated.View
          {...pan.panHandlers}
          style={{
            width: cardWidth,
            transform: [
              { perspective: 1000 },
              { translateX: drag },
              {
                rotateY: reducedMotion
                  ? "0deg"
                  : drag.interpolate({
                      inputRange: [-110, 0, 110],
                      outputRange: ["-22deg", "0deg", "22deg"],
                    }),
              },
              { rotateZ: "-3deg" },
            ],
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${selected.title}`}
            onPress={() =>
              router.push({
                pathname: "/pass/[id]",
                params: { id: selected.id },
              })
            }
          >
            <PassCard item={selected} />
          </Pressable>
        </Animated.View>
      </View>
      <View style={styles.caption}>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={type.heading}>
            {selected.title}
          </Text>
          <Text style={[type.muted, { marginTop: 6 }]}>
            {selected.category === "travel"
              ? `Boarding ${selected.fields.boarding || "—"} · departure ${selected.fields.departure || "—"}`
              : selected.fields.memberName || "Tap the card to open"}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={type.muted}>
            {String(safeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </Text>
          {items.length > 1 && (
            <View style={{ flexDirection: "row" }}>
              <IconButton label="Previous pass" onPress={() => move(-1)}>
                <ChevronLeft color={colors.muted} size={20} />
              </IconButton>
              <IconButton label="Next pass" onPress={() => move(1)}>
                <ChevronRight color={colors.muted} size={20} />
              </IconButton>
            </View>
          )}
        </View>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  stage: {
    marginHorizontal: -24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 12,
  },
  neighbor: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#71808a",
    borderRadius: 16,
    overflow: "hidden",
    opacity: 0.55,
  },
  caption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginTop: 6,
  },
});
